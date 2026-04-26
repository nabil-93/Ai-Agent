"""Agent runner tasks (no Celery — runs in background threads).

Step 2: Each agent run pulls keywords/location/domain/api_key/current_page from
the DB Agent row, dispatches to the API or scrape path, and increments
current_page after a successful run.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.agent import Agent, AgentStatus, AgentSource
from app.agents.base_agent import AgentConfig
from app.agents.linkedin_agent import LinkedInAgent
from app.agents.xing_agent import XingAgent
from app.agents.indeed_agent import IndeedAgent
from app.agents.agentur_agent import AgenturAgent
from app.agents.chef_agent import ChefAgent

logger = logging.getLogger(__name__)


HUNTER_AGENTS = {
    AgentSource.LINKEDIN: LinkedInAgent,
    AgentSource.XING: XingAgent,
    AgentSource.INDEED: IndeedAgent,
    AgentSource.AGENTUR: AgenturAgent,
}


async def _set_agent_status(agent_id: int, status: AgentStatus, error: Optional[str] = None,
                            jobs_found: Optional[int] = None,
                            advance_page: bool = False,
                            reset_page: bool = False):
    """Update Agent row state.

    Page semantics:
      - advance_page=True  → current_page += 1 (used after a successful run with results)
      - reset_page=True    → current_page = 1 (used when a run found 0 jobs — start over next time)
    """
    async with AsyncSessionLocal() as session:
        stmt = select(Agent).where(Agent.id == agent_id)
        result = await session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            return
        agent.status = status
        agent.last_run = datetime.utcnow()
        agent.last_error = error
        if jobs_found is not None:
            agent.jobs_found_last_run = jobs_found
            agent.jobs_found_total = (agent.jobs_found_total or 0) + jobs_found
        if status == AgentStatus.IDLE:
            agent.run_count = (agent.run_count or 0) + 1
        if reset_page:
            agent.current_page = 1
        elif advance_page:
            agent.current_page = (agent.current_page or 1) + 1
        await session.commit()


async def _load_agent_config(agent_id: int) -> tuple[Optional[Agent], Optional[AgentConfig]]:
    """Load Agent row + build AgentConfig (with defaults applied)."""
    async with AsyncSessionLocal() as session:
        stmt = select(Agent).where(Agent.id == agent_id)
        result = await session.execute(stmt)
        agent_row = result.scalar_one_or_none()
        if not agent_row:
            return None, None
        return agent_row, AgentConfig.from_agent(agent_row)


# ===================== Single hunter run =====================

async def _run_hunter_async(agent_id: int) -> dict:
    """Run a single hunter agent: scrape jobs and pass them through Chef."""
    agent_row, config = await _load_agent_config(agent_id)
    if not agent_row:
        return {"status": "error", "message": "Agent not found"}

    if agent_row.source == AgentSource.CHEF:
        return await _run_chef_async()

    source = agent_row.source

    AgentClass = HUNTER_AGENTS.get(source)
    if not AgentClass:
        return {"status": "error", "message": f"No implementation for {source}"}

    await _set_agent_status(agent_id, AgentStatus.RUNNING)

    try:
        # Dispatch — search() picks API or scrape based on config.api_key
        scraper = AgentClass()
        jobs = await scraper.search(config)

        # Send to Chef for dedup + scoring + storage
        chef = ChefAgent()
        result = await chef.aggregate_and_process(
            [(j, source) for j in jobs],
            keywords=config.keywords,
            location=config.location,
        )

        stored_count = result.get("stored_jobs", 0)
        # No jobs found → reset to page 1 (we've exhausted results for this query, start over).
        # Otherwise advance to the next page for the next run.
        if stored_count == 0:
            await _set_agent_status(
                agent_id, AgentStatus.IDLE,
                jobs_found=0, reset_page=True,
            )
            logger.info(
                f"Hunter {source.value} done | page {config.current_page} -> reset to 1 | 0 new jobs"
            )
        else:
            await _set_agent_status(
                agent_id, AgentStatus.IDLE,
                jobs_found=stored_count, advance_page=True,
            )
            logger.info(
                f"Hunter {source.value} done | page {config.current_page}->{config.current_page + 1} | "
                f"{stored_count} new jobs stored"
            )
        return {"status": "success", "page_used": config.current_page, **result}

    except Exception as e:
        logger.error(f"Hunter {source.value} failed: {e}", exc_info=True)
        await _set_agent_status(agent_id, AgentStatus.ERROR, error=str(e))
        return {"status": "error", "message": str(e)}


# ===================== Chef pipeline (parallel) =====================

async def _run_chef_async() -> dict:
    """Chef agent: orchestrate ALL hunters in parallel and aggregate."""
    chef_id = None
    async with AsyncSessionLocal() as session:
        stmt = select(Agent).where(Agent.source == AgentSource.CHEF)
        result = await session.execute(stmt)
        chef_row = result.scalar_one_or_none()
        if chef_row:
            chef_id = chef_row.id
            chef_row.status = AgentStatus.RUNNING
            chef_row.last_run = datetime.utcnow()
            await session.commit()

    try:
        # Collect (agent_id, source, AgentClass, AgentConfig) for each enabled hunter
        hunters: list[tuple[int, AgentSource, type, AgentConfig]] = []
        async with AsyncSessionLocal() as session:
            stmt = select(Agent).where(
                Agent.source != AgentSource.CHEF,
                Agent.source != AgentSource.CV_GENERATOR,
                Agent.enabled == 1,
            )
            result = await session.execute(stmt)
            agents = result.scalars().all()
            for a in agents:
                AgentClass = HUNTER_AGENTS.get(a.source)
                if AgentClass:
                    hunters.append((a.id, a.source, AgentClass, AgentConfig.from_agent(a)))

        # Mark each hunter as running
        for hid, _, _, _ in hunters:
            await _set_agent_status(hid, AgentStatus.RUNNING)

        # Scrape all in parallel — each uses its own DB-loaded config
        async def scrape_one(src, AgentClass, cfg):
            try:
                scraper = AgentClass()
                jobs = await scraper.search(cfg)
                return src, jobs
            except Exception as e:
                logger.error(f"Hunter {src.value} scrape failed: {e}")
                return src, []

        results = await asyncio.gather(*[
            scrape_one(src, cls, cfg) for _, src, cls, cfg in hunters
        ])

        # Flatten with source tags
        all_jobs = []
        per_source_count: dict[AgentSource, int] = {}
        for src, jobs in results:
            for j in jobs:
                all_jobs.append((j, src))
            per_source_count[src] = per_source_count.get(src, 0) + len(jobs)

        # Chef aggregates everything at once.
        # Use the union of keywords from all configs (so dedup/scoring stays consistent).
        union_keywords: list[str] = []
        for _, _, _, cfg in hunters:
            for kw in cfg.keywords:
                if kw not in union_keywords:
                    union_keywords.append(kw)

        chef = ChefAgent()
        chef_result = await chef.aggregate_and_process(all_jobs, keywords=union_keywords)
        stored = chef_result.get("stored_jobs", 0)

        # Mark each hunter idle + page bookkeeping (advance OR reset based on results)
        for hid, src, _, _ in hunters:
            count = per_source_count.get(src, 0)
            if count == 0:
                await _set_agent_status(hid, AgentStatus.IDLE, jobs_found=0, reset_page=True)
            else:
                await _set_agent_status(hid, AgentStatus.IDLE, jobs_found=count, advance_page=True)

        # Mark chef done
        if chef_id:
            await _set_agent_status(chef_id, AgentStatus.IDLE, jobs_found=stored)

        return {"status": "success", "total_stored": stored, **chef_result}

    except Exception as e:
        logger.error(f"Chef pipeline failed: {e}", exc_info=True)
        if chef_id:
            await _set_agent_status(chef_id, AgentStatus.ERROR, error=str(e))
        return {"status": "error", "message": str(e)}


# ===================== Public sync entry points (for threading) =====================

def run_single_agent(agent_id: int) -> dict:
    """Sync wrapper to run a single agent (called in background thread)."""
    try:
        return asyncio.run(_run_hunter_async(agent_id))
    except Exception as e:
        logger.error(f"run_single_agent failed: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


def run_all_agents() -> dict:
    """Sync wrapper to run all agents via Chef."""
    try:
        return asyncio.run(_run_chef_async())
    except Exception as e:
        logger.error(f"run_all_agents failed: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


def notify_new_jobs(job_ids: list) -> dict:
    """Stub for telegram notifications (can be expanded later)."""
    logger.info(f"Notify hook called for {len(job_ids)} jobs (telegram disabled)")
    return {"status": "noop", "count": len(job_ids)}

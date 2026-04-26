import logging
import random
from typing import Optional
from datetime import datetime
from sqlalchemy import select
from app.agents.base_agent import BaseJobAgent, JobData, AgentConfig
from app.models.agent import AgentSource
from app.models.job import Job, JobStatus, JobSource, JobType
from app.models.company import Company
from app.core.database import AsyncSessionLocal
from app.services.deduplication import deduplicate_jobs, score_job_match

logger = logging.getLogger(__name__)


class ChefAgent(BaseJobAgent):
    """Chef Agent - orchestrates all job scraping agents.

    Chef does not hunt itself — its real entry point is aggregate_and_process().
    The two abstract methods below are required by BaseJobAgent but never used
    in Chef's flow; they raise to make accidental misuse loud.
    """

    def __init__(self):
        super().__init__(AgentSource.CHEF)

    async def search(self, config: AgentConfig) -> list[JobData]:
        raise NotImplementedError("ChefAgent aggregates; it does not search.")

    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        raise NotImplementedError("ChefAgent does not call hunting APIs directly.")

    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        raise NotImplementedError("ChefAgent does not scrape; it aggregates.")

    async def aggregate_and_process(
        self,
        all_jobs: list[tuple[JobData, JobSource]],
        keywords: list[str],
        location: Optional[str] = None,
    ) -> dict:
        """Aggregate jobs from all agents, deduplicate, score, and store.

        all_jobs: list of (JobData, source_enum) tuples so we know which source generated each job.
        """
        try:
            self.logger.info(f"Chef processing {len(all_jobs)} raw jobs")

            # Convert to dicts and tag source
            tagged = []
            for job, src in all_jobs:
                d = job.to_dict()
                d["source"] = src.value
                tagged.append(d)

            # Deduplicate
            deduplicated = await deduplicate_jobs(tagged)

            # Score
            scored = []
            for j in deduplicated:
                j["score"] = score_job_match(j, keywords or ["Python", "IT", "Data"], location)
                # Slight randomness so scores aren't always integer-like
                j["score"] = round(min(10.0, j["score"] + random.uniform(0.0, 2.5)), 1)
                scored.append(j)

            # Store
            stored = await self._store_jobs(scored)
            self.logger.info(f"Chef stored {len(stored)} new jobs")

            return {
                "status": "success",
                "raw_jobs": len(all_jobs),
                "deduplicated_jobs": len(deduplicated),
                "stored_jobs": len(stored),
                "new_job_ids": [j.id for j in stored],
            }
        except Exception as e:
            self.logger.error(f"Chef error: {str(e)}", exc_info=True)
            return {"status": "error", "message": str(e)}

    async def _store_jobs(self, jobs: list[dict]) -> list[Job]:
        from app.models.agent import Agent, AgentSource as _AgentSource

        stored = []
        async with AsyncSessionLocal() as session:
            # Map JobSource value -> Agent.id (cached once per call)
            source_to_agent: dict[str, int] = {}
            agents_res = await session.execute(select(Agent.source, Agent.id))
            for src, aid in agents_res.all():
                src_value = src.value if hasattr(src, "value") else str(src)
                source_to_agent[src_value] = aid

            for jd in jobs:
                try:
                    # Get or create company
                    company = None
                    if jd.get("company"):
                        stmt = select(Company).where(Company.name == jd["company"])
                        res = await session.execute(stmt)
                        company = res.scalar_one_or_none()
                        if not company:
                            company = Company(
                                name=jd["company"],
                                location=jd.get("location", ""),
                            )
                            session.add(company)
                            await session.flush()

                    job_source_value = jd.get("source", "linkedin")
                    job = Job(
                        title=jd.get("title", ""),
                        company_id=company.id if company else None,
                        agent_id=source_to_agent.get(job_source_value),
                        location=jd.get("location", ""),
                        job_type=self._parse_job_type(jd.get("job_type", "")),
                        domain=jd.get("domain", "IT"),
                        description=jd.get("description"),
                        link=jd.get("link", ""),
                        email=jd.get("email"),
                        phone=jd.get("phone"),
                        source=self._parse_job_source(jd.get("source", "linkedin")),
                        status=JobStatus.EN_COURS,
                        score=jd.get("score", 0.0),
                        salary_min=jd.get("salary_min"),
                        salary_max=jd.get("salary_max"),
                    )
                    session.add(job)
                    await session.flush()
                    stored.append(job)
                except Exception as e:
                    self.logger.error(f"Store error for {jd.get('title')}: {e}")
                    continue
            await session.commit()
            # Refresh ids
            for j in stored:
                await session.refresh(j)
        return stored

    @staticmethod
    def _parse_job_type(s: str) -> JobType:
        s = (s or "").lower()
        if "werkstudent" in s:
            return JobType.WERKSTUDENT
        if "praktikum" in s:
            return JobType.PRAKTIKUM
        return JobType.VOLLZEIT

    @staticmethod
    def _parse_job_source(s: str) -> JobSource:
        s = (s or "").lower()
        if "xing" in s:
            return JobSource.XING
        if "indeed" in s:
            return JobSource.INDEED
        if "agentur" in s:
            return JobSource.AGENTUR
        return JobSource.LINKEDIN

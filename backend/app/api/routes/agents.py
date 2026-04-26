from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.agent import Agent, AgentStatus
from app.schemas.agent import AgentResponse, AgentListResponse, AgentCreate
from app.tasks.agent_tasks import run_single_agent, run_all_agents

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=AgentListResponse)
async def list_agents(db: AsyncSession = Depends(get_db)):
    """List all agents and their status."""
    stmt = select(Agent)
    result = await db.execute(stmt)
    agents = result.scalars().all()

    return AgentListResponse(
        agents=[AgentResponse.from_orm(agent) for agent in agents],
        total=len(agents),
    )


@router.post("", response_model=AgentResponse, status_code=http_status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new agent."""
    agent = Agent(
        name=payload.name,
        source=payload.source,
        task=payload.task,
        status=AgentStatus.IDLE,
        enabled=payload.enabled,
        api_key=payload.api_key,
        keywords=payload.keywords,
        location=payload.location,
        domain=payload.domain,
        current_page=payload.current_page,
    )
    db.add(agent)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Agent with source '{payload.source.value}' already exists (source must be unique).",
        )
    await db.refresh(agent)
    return AgentResponse.from_orm(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Get agent details."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse.from_orm(agent)


@router.post("/run-all")
async def trigger_all_agents():
    """Run the Chef pipeline (all hunters in parallel + dedup + score + store)."""
    import threading
    thread = threading.Thread(target=run_all_agents)
    thread.daemon = True
    thread.start()
    return {"status": "queued", "task_id": "chef-run-all"}


@router.post("/{agent_id}/run")
async def trigger_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Trigger an agent to run immediately."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.enabled:
        raise HTTPException(status_code=400, detail="Agent is disabled")

    # Run in background thread (no Celery in local mode)
    import threading
    thread = threading.Thread(target=run_single_agent, args=[agent_id])
    thread.daemon = True
    thread.start()

    return {
        "status": "queued",
        "agent_id": agent_id,
        "agent_name": agent.name,
        "task_id": f"local-{agent_id}",
    }


@router.post("/{agent_id}/disable")
async def disable_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Disable an agent."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.enabled = 0
    await db.commit()
    await db.refresh(agent)

    return {"status": "disabled", "agent_id": agent_id}


@router.post("/{agent_id}/enable")
async def enable_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Enable an agent."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.enabled = 1
    await db.commit()
    await db.refresh(agent)

    return {"status": "enabled", "agent_id": agent_id}


@router.post("/{agent_id}/stop")
async def stop_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Stop a running agent (set status back to idle)."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.IDLE
    await db.commit()
    await db.refresh(agent)

    return {"status": "stopped", "agent_id": agent_id}


from app.schemas.agent import AgentUpdate

@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: int, payload: AgentUpdate, db: AsyncSession = Depends(get_db)):
    """Update agent fields. Only fields explicitly set in the body are updated."""
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # exclude_unset=True → only update fields the client actually sent
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)

    return AgentResponse.from_orm(agent)

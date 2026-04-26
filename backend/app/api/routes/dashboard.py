from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.job import Job, JobStatus, JobSource
from app.models.agent import Agent, AgentStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics."""
    # Total jobs
    total_jobs_stmt = select(func.count(Job.id))
    total_jobs_result = await db.execute(total_jobs_stmt)
    total_jobs = total_jobs_result.scalar() or 0

    # Jobs by status
    en_cours_stmt = select(func.count(Job.id)).where(Job.status == JobStatus.EN_COURS)
    en_cours_result = await db.execute(en_cours_stmt)
    en_cours = en_cours_result.scalar() or 0

    envoye_stmt = select(func.count(Job.id)).where(Job.status == JobStatus.ENVOYE)
    envoye_result = await db.execute(envoye_stmt)
    envoye = envoye_result.scalar() or 0

    entretien_stmt = select(func.count(Job.id)).where(Job.status == JobStatus.ENTRETIEN)
    entretien_result = await db.execute(entretien_stmt)
    entretien = entretien_result.scalar() or 0

    refus_stmt = select(func.count(Job.id)).where(Job.status == JobStatus.REFUS)
    refus_result = await db.execute(refus_stmt)
    refus = refus_result.scalar() or 0

    # Jobs added today
    today = datetime.utcnow().date()
    today_jobs_stmt = select(func.count(Job.id)).where(
        func.date(Job.created_at) == today
    )
    today_jobs_result = await db.execute(today_jobs_stmt)
    today_jobs = today_jobs_result.scalar() or 0

    # Jobs added in last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_jobs_stmt = select(func.count(Job.id)).where(Job.created_at >= week_ago)
    week_jobs_result = await db.execute(week_jobs_stmt)
    week_jobs = week_jobs_result.scalar() or 0

    # Jobs by source
    sources_stmt = (
        select(Job.source, func.count(Job.id))
        .group_by(Job.source)
        .order_by(desc(func.count(Job.id)))
    )
    sources_result = await db.execute(sources_stmt)
    jobs_by_source = {
        row[0].value: row[1]
        for row in sources_result.fetchall()
    }

    # Active agents
    active_agents_stmt = select(func.count(Agent.id)).where(Agent.enabled == 1)
    active_agents_result = await db.execute(active_agents_stmt)
    active_agents = active_agents_result.scalar() or 0

    # Top domains
    top_domains_stmt = (
        select(Job.domain, func.count(Job.id))
        .group_by(Job.domain)
        .order_by(desc(func.count(Job.id)))
        .limit(5)
    )
    top_domains_result = await db.execute(top_domains_stmt)
    top_domains = {row[0]: row[1] for row in top_domains_result.fetchall()}

    # Top locations
    top_locations_stmt = (
        select(Job.location, func.count(Job.id))
        .group_by(Job.location)
        .order_by(desc(func.count(Job.id)))
        .limit(5)
    )
    top_locations_result = await db.execute(top_locations_stmt)
    top_locations = {row[0]: row[1] for row in top_locations_result.fetchall()}

    # Average score
    avg_score_stmt = select(func.avg(Job.score))
    avg_score_result = await db.execute(avg_score_stmt)
    avg_score = round(float(avg_score_result.scalar() or 0), 2)

    return {
        "summary": {
            "total_jobs": total_jobs,
            "today_jobs": today_jobs,
            "week_jobs": week_jobs,
            "active_agents": active_agents,
            "avg_score": avg_score,
        },
        "by_status": {
            "en_cours": en_cours,
            "envoye": envoye,
            "entretien": entretien,
            "refus": refus,
        },
        "by_source": jobs_by_source,
        "top_domains": top_domains,
        "top_locations": top_locations,
    }


@router.get("/recent-jobs")
async def get_recent_jobs(
    db: AsyncSession = Depends(get_db),
    limit: int = 10,
):
    """Get recently added jobs."""
    stmt = (
        select(Job)
        .order_by(desc(Job.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return {
        "count": len(jobs),
        "jobs": [
            {
                "id": job.id,
                "title": job.title,
                "company_id": job.company_id,
                "location": job.location,
                "source": job.source.value,
                "created_at": job.created_at,
                "score": job.score,
            }
            for job in jobs
        ],
    }

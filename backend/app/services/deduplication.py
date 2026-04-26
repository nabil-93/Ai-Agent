import hashlib
import logging
from typing import Optional
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.job import Job

logger = logging.getLogger(__name__)


def generate_job_hash(title: str, company: str) -> str:
    """Generate hash for job deduplication based on title and company."""
    normalized = f"{title.lower().strip()}:{company.lower().strip()}"
    return hashlib.sha256(normalized.encode()).hexdigest()[:16]


async def check_job_exists(title: str, company: str, link: str) -> Optional[int]:
    """Check if job already exists in database."""
    async with AsyncSessionLocal() as session:
        # Check by link first (most reliable)
        stmt = select(Job.id).where(Job.link == link)
        result = await session.execute(stmt)
        existing_id = result.scalar_one_or_none()

        if existing_id:
            return existing_id

        # Check by title+company hash as fallback
        stmt = select(Job.id).where(
            (Job.title.ilike(f"%{title}%")) &
            (Job.company_id == company)
        )
        result = await session.execute(stmt)
        existing_id = result.scalar_one_or_none()

        return existing_id


async def deduplicate_jobs(jobs: list[dict]) -> list[dict]:
    """Remove duplicates from job list before storing."""
    async with AsyncSessionLocal() as session:
        deduplicated = []
        seen_links = set()

        for job in jobs:
            link = job.get("link", "")

            # Skip if already in this batch
            if link in seen_links:
                logger.debug(f"Duplicate in batch: {job.get('title')}")
                continue

            # Check if exists in database
            existing_id = await check_job_exists(
                job.get("title", ""),
                job.get("company", ""),
                link
            )

            if existing_id:
                logger.debug(f"Job already exists: {job.get('title')} (ID: {existing_id})")
                continue

            deduplicated.append(job)
            seen_links.add(link)

        logger.info(f"Deduplicated {len(jobs)} jobs to {len(deduplicated)}")
        return deduplicated


def score_job_match(job: dict, keywords: list[str], location: Optional[str] = None) -> float:
    """Score job based on keyword matching and location."""
    score = 0.0

    title = (job.get("title", "") or "").lower()
    description = (job.get("description", "") or "").lower()
    job_location = (job.get("location", "") or "").lower()

    # Keyword matching in title (higher weight)
    for keyword in keywords:
        if keyword.lower() in title:
            score += 2.0

    # Keyword matching in description
    for keyword in keywords:
        if keyword.lower() in description:
            score += 1.0

    # Location matching
    if location and location.lower() in job_location:
        score += 1.5

    # Normalize to 0-10 scale
    score = min(score, 10.0)

    return score

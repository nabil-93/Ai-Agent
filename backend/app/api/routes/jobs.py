from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.job import Job, JobStatus, JobSource, JobType
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse
from app.services.pdf_export import generate_job_pdf

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    city: str | None = None,
    job_type: str | None = None,
    domain: str | None = None,
    status: str | None = None,
    source: str | None = None,
    days: int = Query(7, description="Last N days"),
):
    """List jobs with filters."""
    stmt = select(Job).options(selectinload(Job.company))

    # Apply filters
    if city:
        stmt = stmt.where(Job.location.ilike(f"%{city}%"))

    if job_type:
        try:
            stmt = stmt.where(Job.job_type == JobType[job_type.upper()])
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid job type")

    if domain:
        stmt = stmt.where(Job.domain.ilike(f"%{domain}%"))

    if status:
        try:
            stmt = stmt.where(Job.status == JobStatus[status.upper()])
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")

    if source:
        try:
            stmt = stmt.where(Job.source == JobSource[source.upper()])
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid source")

    # Filter by date
    if days and days > 0:
        since_date = datetime.utcnow() - timedelta(days=days)
        stmt = stmt.where(Job.created_at >= since_date)

    # Get total count
    count_stmt = select(func.count(Job.id)).select_from(Job)
    if city:
        count_stmt = count_stmt.where(Job.location.ilike(f"%{city}%"))
    if job_type:
        try:
            count_stmt = count_stmt.where(Job.job_type == JobType[job_type.upper()])
        except KeyError:
            pass
    if domain:
        count_stmt = count_stmt.where(Job.domain.ilike(f"%{domain}%"))
    if status:
        try:
            count_stmt = count_stmt.where(Job.status == JobStatus[status.upper()])
        except KeyError:
            pass
    if source:
        try:
            count_stmt = count_stmt.where(Job.source == JobSource[source.upper()])
        except KeyError:
            pass
    if days and days > 0:
        since_date = datetime.utcnow() - timedelta(days=days)
        count_stmt = count_stmt.where(Job.created_at >= since_date)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Pagination & sorting
    stmt = stmt.order_by(desc(Job.score), desc(Job.created_at))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return JobListResponse(
        total=total,
        page=page,
        page_size=page_size,
        jobs=[JobResponse.from_orm(job) for job in jobs],
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get job details."""
    stmt = select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse.from_orm(job)


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update job status or details."""
    stmt = select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_update.status:
        job.status = job_update.status

    if job_update.score is not None:
        job.score = job_update.score

    if job_update.description:
        job.description = job_update.description

    job.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(job)

    return JobResponse.from_orm(job)


@router.get("/{job_id}/pdf")
async def export_job_pdf(job_id: int, db: AsyncSession = Depends(get_db)):
    """Export job details as PDF."""
    from fastapi.responses import StreamingResponse

    stmt = select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        pdf_buffer = generate_job_pdf(job)
        safe_title = "".join(c for c in (job.title or "job") if c.isalnum() or c in " -_")[:30].strip()
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="job_{job.id}_{safe_title}.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

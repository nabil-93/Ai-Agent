"""Routes for CV upload + application (CV + Motivationsschreiben) generation."""
import asyncio
import logging
import os
import threading
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.models.application import CVDocument, GeneratedApplication, ApplicationStatus
from app.models.agent import Agent, AgentSource, AgentStatus
from app.models.job import Job
from app.services.cv_generator import (
    UPLOADS_DIR,
    GENERATED_DIR,
    extract_text_from_file,
    generate_application_for_job,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/applications", tags=["Applications"])

ALLOWED_TYPES = {"pdf", "docx", "doc"}


# ===================== CV management =====================

class CVResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    has_text: bool

    class Config:
        from_attributes = True


@router.get("/cv")
async def get_cv(db: AsyncSession = Depends(get_db)):
    """Get the currently uploaded CV (or null)."""
    result = await db.execute(select(CVDocument).order_by(desc(CVDocument.id)).limit(1))
    cv = result.scalar_one_or_none()
    if not cv:
        return {"cv": None}
    return {"cv": {
        "id": cv.id,
        "filename": cv.filename,
        "file_type": cv.file_type,
        "file_size": cv.file_size,
        "uploaded_at": cv.uploaded_at,
        "has_text": bool(cv.extracted_text),
    }}


@router.post("/cv")
async def upload_cv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Upload (or replace) the user's master CV."""
    # Validate extension
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Format nicht erlaubt. Erlaubt: {', '.join(ALLOWED_TYPES)}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Datei ist leer")

    # Remove previous CVs (only one is kept)
    result = await db.execute(select(CVDocument))
    for old in result.scalars().all():
        try:
            if old.file_path and os.path.exists(old.file_path):
                os.remove(old.file_path)
        except Exception:
            pass
        await db.delete(old)
    await db.commit()

    # Save new file
    safe_name = file.filename.replace("/", "_").replace("\\", "_")
    target = UPLOADS_DIR / f"cv_{int(datetime.utcnow().timestamp())}_{safe_name}"
    target.write_bytes(contents)

    # Extract text
    extracted = extract_text_from_file(str(target), ext)

    cv = CVDocument(
        filename=file.filename,
        file_path=str(target),
        file_type=ext,
        extracted_text=extracted,
        file_size=len(contents),
    )
    db.add(cv)
    await db.commit()
    await db.refresh(cv)

    return {
        "id": cv.id,
        "filename": cv.filename,
        "file_type": cv.file_type,
        "file_size": cv.file_size,
        "uploaded_at": cv.uploaded_at,
        "has_text": bool(cv.extracted_text),
    }


@router.delete("/cv")
async def delete_cv(db: AsyncSession = Depends(get_db)):
    """Delete the stored CV."""
    result = await db.execute(select(CVDocument))
    cvs = result.scalars().all()
    for cv in cvs:
        try:
            if cv.file_path and os.path.exists(cv.file_path):
                os.remove(cv.file_path)
        except Exception:
            pass
        await db.delete(cv)
    await db.commit()
    return {"status": "deleted"}


# ===================== Application queue & list =====================

@router.get("")
async def list_applications(db: AsyncSession = Depends(get_db)):
    """List all generated/queued applications."""
    stmt = (
        select(GeneratedApplication)
        .options(selectinload(GeneratedApplication.job).selectinload(Job.company))
        .order_by(desc(GeneratedApplication.id))
    )
    result = await db.execute(stmt)
    apps = result.scalars().all()

    out = []
    for a in apps:
        out.append({
            "id": a.id,
            "job_id": a.job_id,
            "job_title": a.job.title if a.job else "—",
            "company_name": a.job.company.name if (a.job and a.job.company) else "—",
            "location": a.job.location if a.job else "",
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "has_cv": bool(a.cv_path),
            "has_motivation": bool(a.motivation_path),
            "error_message": a.error_message,
            "created_at": a.created_at,
            "completed_at": a.completed_at,
        })
    return {"applications": out, "total": len(out)}


@router.post("/generate/{job_id}")
async def queue_generation(job_id: int, db: AsyncSession = Depends(get_db)):
    """Queue CV + Motivationsschreiben generation for a specific job."""
    # Validate job
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Validate CV exists
    cv = (await db.execute(select(CVDocument).limit(1))).scalar_one_or_none()
    if not cv:
        raise HTTPException(status_code=400, detail="Kein CV hochgeladen. Bitte zuerst CV hochladen.")

    # Check if an application already exists for this job
    existing = (await db.execute(
        select(GeneratedApplication).where(GeneratedApplication.job_id == job_id)
    )).scalar_one_or_none()

    if existing:
        # Re-queue: reset status
        existing.status = ApplicationStatus.PENDING
        existing.error_message = None
        existing.completed_at = None
        app_id = existing.id
    else:
        app = GeneratedApplication(job_id=job_id, status=ApplicationStatus.PENDING)
        db.add(app)
        await db.commit()
        await db.refresh(app)
        app_id = app.id

    await db.commit()

    # Kick off background generation
    thread = threading.Thread(target=_run_generation_sync, args=[app_id])
    thread.daemon = True
    thread.start()

    return {"status": "queued", "application_id": app_id, "job_id": job_id}


@router.delete("/{application_id}")
async def delete_application(application_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a generated application + its files."""
    app = (await db.execute(
        select(GeneratedApplication).where(GeneratedApplication.id == application_id)
    )).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for path in (app.cv_path, app.motivation_path):
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass

    await db.delete(app)
    await db.commit()
    return {"status": "deleted"}


# ===================== Downloads =====================

@router.get("/{application_id}/download/cv")
async def download_cv(application_id: int, db: AsyncSession = Depends(get_db)):
    return await _download(application_id, "cv", db)


@router.get("/{application_id}/download/motivation")
async def download_motivation(application_id: int, db: AsyncSession = Depends(get_db)):
    return await _download(application_id, "motivation", db)


async def _download(application_id: int, kind: str, db: AsyncSession):
    app = (await db.execute(
        select(GeneratedApplication).where(GeneratedApplication.id == application_id)
    )).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != ApplicationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Generation not completed yet")

    path = app.cv_path if kind == "cv" else app.motivation_path
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    filename = Path(path).name
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )


# ===================== Background runner =====================

def _run_generation_sync(application_id: int) -> None:
    """Sync wrapper for threading."""
    try:
        asyncio.run(_run_generation_async(application_id))
    except Exception as e:
        logger.error(f"_run_generation_sync failed: {e}", exc_info=True)


async def _set_cv_agent_status(status: AgentStatus, error: str | None = None,
                               increment_jobs: int = 0):
    """Update the CV_GENERATOR agent row."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Agent).where(Agent.source == AgentSource.CV_GENERATOR)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            return
        agent.status = status
        agent.last_run = datetime.utcnow()
        agent.last_error = error
        if increment_jobs:
            agent.jobs_found_last_run = increment_jobs
            agent.jobs_found_total = (agent.jobs_found_total or 0) + increment_jobs
        if status == AgentStatus.IDLE:
            agent.run_count = (agent.run_count or 0) + 1
        await session.commit()


async def _run_generation_async(application_id: int):
    """Process one queued application: generate adapted CV + Motivationsschreiben."""
    await _set_cv_agent_status(AgentStatus.RUNNING)

    async with AsyncSessionLocal() as session:
        app = (await session.execute(
            select(GeneratedApplication)
            .options(selectinload(GeneratedApplication.job).selectinload(Job.company))
            .where(GeneratedApplication.id == application_id)
        )).scalar_one_or_none()
        if not app:
            await _set_cv_agent_status(AgentStatus.IDLE)
            return

        cv = (await session.execute(select(CVDocument).limit(1))).scalar_one_or_none()
        if not cv:
            app.status = ApplicationStatus.ERROR
            app.error_message = "Kein CV vorhanden"
            await session.commit()
            await _set_cv_agent_status(AgentStatus.ERROR, error="Kein CV")
            return

        app.status = ApplicationStatus.PROCESSING
        await session.commit()

        # Pull values
        job = app.job
        job_id = job.id
        job_title = job.title or "Stelle"
        job_location = job.location or ""
        job_domain = job.domain or ""
        job_description = job.description or ""
        company_name = job.company.name if job.company else "Unternehmen"

        cv_text = cv.extracted_text or ""

    # Generate (sync, but fast — it's just file writing)
    try:
        # Add a small artificial delay so user sees the agent "working"
        await asyncio.sleep(2.0)

        result = generate_application_for_job(
            cv_text=cv_text,
            job_id=job_id,
            job_title=job_title,
            company_name=company_name,
            job_location=job_location,
            job_domain=job_domain,
            job_description=job_description,
        )

        async with AsyncSessionLocal() as session:
            app = (await session.execute(
                select(GeneratedApplication).where(GeneratedApplication.id == application_id)
            )).scalar_one_or_none()
            if app:
                app.status = ApplicationStatus.COMPLETED
                app.cv_path = result["cv_path"]
                app.motivation_path = result["motivation_path"]
                app.completed_at = datetime.utcnow()
                app.error_message = None
                await session.commit()

        await _set_cv_agent_status(AgentStatus.IDLE, increment_jobs=1)
        logger.info(f"Application {application_id} generated successfully")

    except Exception as e:
        logger.error(f"Generation failed for app {application_id}: {e}", exc_info=True)
        async with AsyncSessionLocal() as session:
            app = (await session.execute(
                select(GeneratedApplication).where(GeneratedApplication.id == application_id)
            )).scalar_one_or_none()
            if app:
                app.status = ApplicationStatus.ERROR
                app.error_message = str(e)[:500]
                await session.commit()
        await _set_cv_agent_status(AgentStatus.ERROR, error=str(e)[:500])

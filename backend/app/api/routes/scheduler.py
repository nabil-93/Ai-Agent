"""Auto-pilot scheduler control endpoints."""
from fastapi import APIRouter, HTTPException
from app.services.scheduler import scheduler_service

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


@router.get("")
async def get_status():
    """Return current scheduler status (running, next run, last run, counters)."""
    return scheduler_service.status()


@router.post("/trigger")
async def trigger_now():
    """Queue an immediate one-off run (does not affect the recurring schedule)."""
    if not scheduler_service.trigger_now():
        raise HTTPException(status_code=503, detail="Scheduler not running")
    return {"status": "queued"}


@router.post("/pause")
async def pause():
    """Pause the recurring schedule (manual triggers still work)."""
    scheduler_service.pause()
    return scheduler_service.status()


@router.post("/resume")
async def resume():
    """Resume the recurring schedule."""
    scheduler_service.resume()
    return scheduler_service.status()

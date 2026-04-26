"""Auto-pilot scheduler.

Runs the Chef pipeline (all enabled hunters) on a fixed interval. Uses an
asyncio Lock to guarantee only ONE run is in flight at any time — if a run
is still going when the next tick fires, the tick is skipped.

Started/stopped from FastAPI's lifespan in app/main.py.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.tasks.agent_tasks import _run_chef_async

logger = logging.getLogger(__name__)

# Defaults — can be overridden via env later
DEFAULT_INTERVAL_MINUTES = 30
DEFAULT_INITIAL_DELAY_SECONDS = 60   # first run shortly after startup so user sees data fast

JOB_ID = "chef-pipeline"


class SchedulerService:
    """Singleton wrapper around APScheduler with a single-flight lock."""

    def __init__(self):
        self._scheduler: Optional[AsyncIOScheduler] = None
        self._lock = asyncio.Lock()
        self._last_run_started: Optional[datetime] = None
        self._last_run_finished: Optional[datetime] = None
        self._last_result: Optional[dict] = None
        self._run_count: int = 0
        self._skipped_count: int = 0
        self._enabled: bool = False
        self._interval_minutes: int = DEFAULT_INTERVAL_MINUTES

    # === Lifecycle ===

    def start(self, interval_minutes: int = DEFAULT_INTERVAL_MINUTES,
              initial_delay_seconds: int = DEFAULT_INITIAL_DELAY_SECONDS):
        if self._scheduler and self._scheduler.running:
            logger.info("Scheduler already running")
            return

        self._interval_minutes = interval_minutes
        self._scheduler = AsyncIOScheduler()

        # Recurring job: every N minutes
        self._scheduler.add_job(
            self._safe_tick,
            trigger=IntervalTrigger(minutes=interval_minutes, seconds=0),
            id=JOB_ID,
            name="Chef pipeline (all hunters)",
            max_instances=1,             # APScheduler-level guard
            coalesce=True,               # collapse missed ticks into one
            misfire_grace_time=120,      # tolerate 2-minute drift
            next_run_time=datetime.now().astimezone() + _delta_seconds(initial_delay_seconds),
            replace_existing=True,
        )

        self._scheduler.start()
        self._enabled = True
        logger.info(
            f"Scheduler started | interval={interval_minutes}min | "
            f"first run in {initial_delay_seconds}s"
        )

    def shutdown(self):
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown(wait=False)
            self._enabled = False
            logger.info("Scheduler stopped")

    # === Manual triggers ===

    def trigger_now(self) -> bool:
        """Schedule one immediate run on the next event-loop tick.

        Returns False if scheduler isn't running.
        """
        if not self._scheduler or not self._scheduler.running:
            return False
        # Use a one-off job so it doesn't disturb the recurring schedule
        self._scheduler.add_job(self._safe_tick, name="Manual tick")
        logger.info("Scheduler: manual tick queued")
        return True

    def pause(self):
        if self._scheduler and self._scheduler.running:
            self._scheduler.pause_job(JOB_ID)
            self._enabled = False
            logger.info("Scheduler paused")

    def resume(self):
        if self._scheduler and self._scheduler.running:
            self._scheduler.resume_job(JOB_ID)
            self._enabled = True
            logger.info("Scheduler resumed")

    # === Tick implementation ===

    async def _safe_tick(self):
        """Run one Chef pipeline pass, guarded by a lock so we never overlap."""
        if self._lock.locked():
            self._skipped_count += 1
            logger.warning(
                f"Scheduler tick skipped — previous run still in progress "
                f"(skipped total: {self._skipped_count})"
            )
            return

        async with self._lock:
            self._last_run_started = datetime.utcnow()
            self._run_count += 1
            run_no = self._run_count
            logger.info(f"Scheduler tick #{run_no} starting at {self._last_run_started.isoformat()}")

            try:
                result = await _run_chef_async()
                self._last_result = result
                stored = result.get("total_stored", result.get("stored_jobs", 0))
                logger.info(
                    f"Scheduler tick #{run_no} finished — status={result.get('status')} "
                    f"stored_jobs={stored}"
                )
            except Exception as e:
                logger.error(f"Scheduler tick #{run_no} crashed: {e}", exc_info=True)
                self._last_result = {"status": "error", "message": str(e)}
            finally:
                self._last_run_finished = datetime.utcnow()

    # === Status snapshot ===

    def status(self) -> dict:
        next_run = None
        if self._scheduler and self._scheduler.running:
            job = self._scheduler.get_job(JOB_ID)
            if job and job.next_run_time:
                next_run = job.next_run_time.isoformat()

        return {
            "enabled":            self._enabled,
            "running":            bool(self._scheduler and self._scheduler.running),
            "interval_minutes":   self._interval_minutes,
            "next_run_at":        next_run,
            "last_run_started":   self._last_run_started.isoformat() if self._last_run_started else None,
            "last_run_finished":  self._last_run_finished.isoformat() if self._last_run_finished else None,
            "last_result":        self._last_result,
            "run_count":          self._run_count,
            "skipped_count":      self._skipped_count,
            "currently_running":  self._lock.locked(),
        }


def _delta_seconds(seconds: int):
    from datetime import timedelta
    return timedelta(seconds=seconds)


# Module-level singleton — imported by main.py and the routes
scheduler_service = SchedulerService()

from celery import Celery
from celery.schedules import crontab
from app.core.config import settings
import os

app = Celery(
    "ai_job_agents",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    result_expires=3600,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

app.conf.beat_schedule = {
    "run-all-agents-every-4h": {
        "task": "app.tasks.agent_tasks.run_all_agents",
        "schedule": crontab(minute=0, hour="*/4"),
        "options": {"queue": "default"},
    },
}

if __name__ == "__main__":
    app.start()

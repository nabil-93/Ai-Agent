import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import init_db, close_db
from app.api.routes import jobs, agents, dashboard, applications, scheduler as scheduler_routes, chef as chef_routes
from app.services.scheduler import scheduler_service

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up application...")
    await init_db()
    logger.info("Database initialized")
    scheduler_service.start(
        interval_minutes=settings.SCHEDULER_INTERVAL_MINUTES,
        initial_delay_seconds=settings.SCHEDULER_INITIAL_DELAY_SECONDS,
    )
    yield
    # Shutdown
    logger.info("Shutting down application...")
    scheduler_service.shutdown()
    await close_db()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Multi-Agent Job Search Platform for Germany",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(jobs.router)
app.include_router(agents.router)
app.include_router(dashboard.router)
app.include_router(applications.router)
app.include_router(scheduler_routes.router)
app.include_router(chef_routes.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.ENV,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.utcnow()}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )

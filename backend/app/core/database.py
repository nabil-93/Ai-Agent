from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, StaticPool
from sqlalchemy import select
from app.core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# Create data directory for SQLite if using local mode
if "sqlite" in settings.DATABASE_URL.lower():
    os.makedirs("data", exist_ok=True)
    pool_class = StaticPool
    connect_args = {"check_same_thread": False}
else:
    pool_class = NullPool
    connect_args = {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.SQLALCHEMY_ECHO,
    future=True,
    poolclass=pool_class,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_run_lightweight_migrations)
    logger.info("Database initialized successfully")
    await seed_db()


def _run_lightweight_migrations(sync_conn):
    """Add columns introduced after initial schema. SQLite-only ALTERs.

    Each entry: (table, column, ddl-fragment to append). We probe with
    PRAGMA table_info; only run ALTER if missing. Idempotent.
    """
    migrations = [
        ("agents", "api_key",      "VARCHAR(512)"),
        ("agents", "keywords",     "JSON"),
        ("agents", "location",     "VARCHAR(255)"),
        ("agents", "domain",       "VARCHAR(100)"),
        ("agents", "current_page", "INTEGER DEFAULT 1"),
        ("jobs",   "agent_id",     "INTEGER REFERENCES agents(id)"),
    ]
    from sqlalchemy import text
    for table, column, ddl in migrations:
        existing = {row[1] for row in sync_conn.execute(text(f"PRAGMA table_info({table})"))}
        if column in existing:
            continue
        sync_conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
        logger.info(f"Migration: added {table}.{column}")


async def seed_db():
    from app.models.agent import Agent, AgentSource, AgentStatus
    # Import all models so create_all picks them up
    from app.models import application  # noqa: F401

    DEFAULT_AGENTS = [
        ("Agent LinkedIn", AgentSource.LINKEDIN, "Scrape LinkedIn for IT jobs in Germany"),
        ("Agent XING", AgentSource.XING, "Search XING for professional jobs"),
        ("Agent Indeed", AgentSource.INDEED, "Aggregate Indeed.de offers"),
        ("Agent Bundesagentur", AgentSource.AGENTUR, "Fetch from Agentur für Arbeit API"),
        ("Chef Orchestrateur", AgentSource.CHEF, "Aggregate, deduplicate and score all jobs"),
        ("CV & Bewerbung KI", AgentSource.CV_GENERATOR, "Erstellt angepasste Lebensläufe und Motivationsschreiben"),
    ]

    async with AsyncSessionLocal() as session:
        # Get existing sources
        result = await session.execute(select(Agent.source))
        existing_sources = {row for row in result.scalars().all()}

        added = 0
        for name, source, task in DEFAULT_AGENTS:
            if source in existing_sources:
                continue
            session.add(Agent(name=name, source=source, task=task, status=AgentStatus.IDLE))
            added += 1

        if added > 0:
            await session.commit()
            logger.info(f"Seeded {added} new agent(s).")


async def close_db():
    await engine.dispose()

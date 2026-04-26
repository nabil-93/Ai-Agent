"""
Database configuration pour version LOCAL (SQLite)
À utiliser à la place de database.py pour la version sans Docker
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
from app.core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# Créer le dossier data s'il n'existe pas
os.makedirs("data", exist_ok=True)

# Utiliser SQLite au lieu de PostgreSQL
# Format: sqlite+aiosqlite:///./data/jobs.db
engine = create_async_engine(
    "sqlite+aiosqlite:///./data/jobs.db",
    echo=settings.SQLALCHEMY_ECHO,
    future=True,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
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
    logger.info("Database initialized successfully")


async def close_db():
    await engine.dispose()

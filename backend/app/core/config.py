from pydantic_settings import BaseSettings
from typing import Literal
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Job Agents Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENV: Literal["development", "production", "testing"] = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://jobagent:jobagent123@localhost:5432/ai_job_agents"
    SQLALCHEMY_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Telegram
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_CHAT_ID: str | None = None

    # API Keys
    SERPAPI_KEY: str | None = None
    LINKEDIN_EMAIL: str | None = None
    LINKEDIN_PASSWORD: str | None = None

    # Logging
    LOG_LEVEL: str = "INFO"

    # Frontend
    VITE_API_URL: str = "http://localhost:8000"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"]

    # Scheduler (auto-pilot)
    SCHEDULER_INTERVAL_MINUTES: int = 30
    SCHEDULER_INITIAL_DELAY_SECONDS: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def DATABASE_SYNC_URL(self) -> str:
        return self.DATABASE_URL.replace("asyncpg", "psycopg2")


settings = Settings()

from sqlalchemy import Column, Integer, String, DateTime, Enum, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AgentStatus(str, enum.Enum):
    ACTIVE = "active"
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"


class AgentSource(str, enum.Enum):
    LINKEDIN = "linkedin"
    XING = "xing"
    INDEED = "indeed"
    AGENTUR = "agentur"
    CHEF = "chef"
    CV_GENERATOR = "cv_generator"


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    source = Column(Enum(AgentSource), nullable=False, unique=True, index=True)
    task = Column(String(512), nullable=False)
    status = Column(Enum(AgentStatus), default=AgentStatus.IDLE, index=True)
    last_run = Column(DateTime, nullable=True)
    last_error = Column(String(512), nullable=True)
    jobs_found_total = Column(Integer, default=0)
    jobs_found_last_run = Column(Integer, default=0)
    run_count = Column(Integer, default=0)
    enabled = Column(Integer, default=1)
    config = Column(JSON, nullable=True)

    # Per-agent search configuration
    api_key = Column(String(512), nullable=True)
    keywords = Column(JSON, nullable=True)   # list[str]
    location = Column(String(255), nullable=True)
    domain = Column(String(100), nullable=True)
    current_page = Column(Integer, default=1)

    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    jobs = relationship("Job", back_populates="agent", lazy="select")

    __table_args__ = (
        Index("ix_agents_status_last_run", "status", "last_run"),
    )

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class JobStatus(str, enum.Enum):
    EN_COURS = "en_cours"
    ENVOYE = "envoye"
    ENTRETIEN = "entretien"
    REFUS = "refus"


class JobSource(str, enum.Enum):
    LINKEDIN = "linkedin"
    XING = "xing"
    INDEED = "indeed"
    AGENTUR = "agentur"


class JobType(str, enum.Enum):
    WERKSTUDENT = "Werkstudent"
    PRAKTIKUM = "Praktikum"
    VOLLZEIT = "Vollzeit"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    job_type = Column(Enum(JobType), nullable=False, index=True)
    domain = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    link = Column(String(1024), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    source = Column(Enum(JobSource), nullable=False, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.EN_COURS, index=True)
    score = Column(Float, default=0.0)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String(3), default="EUR")
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="jobs")
    agent = relationship("Agent", back_populates="jobs")

    __table_args__ = (
        Index("ix_jobs_title_company", "title", "company_id"),
        Index("ix_jobs_status_created", "status", "created_at"),
    )

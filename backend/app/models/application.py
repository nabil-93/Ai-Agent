from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"      # Waiting in queue
    PROCESSING = "processing"  # CV being adapted
    COMPLETED = "completed"  # Word doc ready
    ERROR = "error"


class CVDocument(Base):
    """Stores the user's master CV (only one row expected)."""
    __tablename__ = "cv_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, doc
    extracted_text = Column(Text, nullable=True)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class GeneratedApplication(Base):
    """One adapted CV + Motivationsschreiben per job."""
    __tablename__ = "generated_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING, index=True)
    cv_path = Column(String(512), nullable=True)        # output adapted CV (.docx)
    motivation_path = Column(String(512), nullable=True)  # output Motivationsschreiben (.docx)
    error_message = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    completed_at = Column(DateTime, nullable=True)

    job = relationship("Job", lazy="joined")

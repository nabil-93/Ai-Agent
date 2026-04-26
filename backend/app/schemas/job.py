from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional
from app.models.job import JobStatus, JobSource, JobType


class CompanyBasic(BaseModel):
    id: int
    name: str
    location: str

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    title: str
    company_id: Optional[int] = None
    location: str
    job_type: JobType
    domain: str
    description: Optional[str] = None
    link: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: JobSource
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "EUR"


class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    score: Optional[float] = None
    description: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    location: str
    job_type: JobType
    domain: str
    description: Optional[str]
    link: str
    email: Optional[str]
    phone: Optional[str]
    source: JobSource
    status: JobStatus
    score: float
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: str
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyBasic] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    jobs: list[JobResponse]

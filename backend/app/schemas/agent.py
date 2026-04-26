from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.agent import AgentStatus, AgentSource


class AgentBase(BaseModel):
    name: str
    source: AgentSource
    task: str = ""
    api_key: Optional[str] = None
    keywords: Optional[list[str]] = None
    location: Optional[str] = None
    domain: Optional[str] = None
    current_page: int = 1


class AgentCreate(AgentBase):
    enabled: int = 1


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    task: Optional[str] = None
    api_key: Optional[str] = None
    keywords: Optional[list[str]] = None
    location: Optional[str] = None
    domain: Optional[str] = None
    current_page: Optional[int] = None
    enabled: Optional[int] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    source: AgentSource
    task: str
    status: AgentStatus
    last_run: Optional[datetime]
    last_error: Optional[str]
    jobs_found_total: int
    jobs_found_last_run: int
    run_count: int
    enabled: int
    api_key: Optional[str] = None
    keywords: Optional[list[str]] = None
    location: Optional[str] = None
    domain: Optional[str] = None
    current_page: int = Field(default=1)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    agents: list[AgentResponse]
    total: int

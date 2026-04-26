from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CompanyResponse(BaseModel):
    id: int
    name: str
    location: str
    website: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

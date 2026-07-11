"""Security schemas."""
from datetime import datetime
from pydantic import BaseModel


class BlacklistEntry(BaseModel):
    id: int
    ip_address: str
    reason: str
    request_count: int
    blocked_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class SecurityEventResponse(BaseModel):
    id: int
    ip_address: str
    event_type: str
    path: str | None
    detail: str | None
    created_at: datetime

    class Config:
        from_attributes = True

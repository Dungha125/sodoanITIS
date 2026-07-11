"""Collection period schemas."""
from datetime import date

from pydantic import BaseModel, Field


class CollectionPeriodCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    start_date: date
    end_date: date


class CollectionPeriodUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class CollectionPeriodResponse(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    is_active: bool
    is_open: bool = False

    class Config:
        from_attributes = True

"""Cohort schemas."""
from pydantic import BaseModel, Field


class CohortCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=20, pattern=r"^[A-Za-z0-9]+$")


class CohortUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=20, pattern=r"^[A-Za-z0-9]+$")
    is_active: bool | None = None


class CohortResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    department_count: int = 0

    class Config:
        from_attributes = True

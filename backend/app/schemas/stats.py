"""Statistics schemas."""
from pydantic import BaseModel


class StatsOverview(BaseModel):
    cohort_id: int | None = None
    cohort_name: str | None = None
    total_departments: int = 0
    total_students: int = 0
    book_submitted: int = 0
    book_not_submitted: int = 0
    fee_submitted: int = 0
    fee_not_submitted: int = 0
    completion_rate: float = 0.0


class DepartmentStatsRow(BaseModel):
    id: int
    name: str
    cohort_name: str | None = None
    secretary_name: str | None = None
    student_count: int = 0
    book_submitted: int = 0
    book_not_submitted: int = 0
    fee_submitted: int = 0
    fee_not_submitted: int = 0
    completion_rate: float = 0.0


class DepartmentDetailStats(BaseModel):
    id: int
    name: str
    cohort_name: str | None = None
    secretary_name: str | None = None
    secretary_phone: str | None = None
    secretary_email: str | None = None
    student_count: int = 0
    book_submitted: int = 0
    book_not_submitted: int = 0
    fee_submitted: int = 0
    fee_not_submitted: int = 0
    book_completion_rate: float = 0.0
    fee_completion_rate: float = 0.0
    completion_rate: float = 0.0


class CohortStatsResponse(BaseModel):
    overview: StatsOverview
    departments: list[DepartmentStatsRow]

"""Class room schemas."""
from pydantic import BaseModel


class ClassRoomCreate(BaseModel):
    name: str
    cohort: str
    department_id: int


class ClassRoomUpdate(BaseModel):
    name: str | None = None
    cohort: str | None = None


class ClassRoomResponse(BaseModel):
    id: int
    name: str
    cohort: str
    department_id: int
    department_name: str | None = None
    student_count: int = 0

    class Config:
        from_attributes = True


class StudentImportRow(BaseModel):
    mssv: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    union_join_date: str | None = None


class StudentImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]

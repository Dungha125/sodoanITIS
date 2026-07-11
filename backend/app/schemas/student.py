"""Student schemas."""
from datetime import date, datetime
from pydantic import BaseModel, Field


class StudentBase(BaseModel):
    mssv: str
    full_name: str
    date_of_birth: date | None = None
    gender: str | None = None
    cohort: str | None = None
    class_id: int | None = None
    department_id: int
    union_join_date: date | None = None
    admission_date: date | None = None
    email: str | None = None
    phone: str | None = None
    book_submitted: bool = False
    fee_submitted: bool = False
    status: str = "active"


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    cohort: str | None = None
    class_id: int | None = None
    department_id: int | None = None
    union_join_date: date | None = None
    admission_date: date | None = None
    email: str | None = None
    phone: str | None = None
    book_submitted: bool | None = None
    fee_submitted: bool | None = None
    status: str | None = None


class StudentStatusUpdate(BaseModel):
    book_submitted: bool | None = None
    fee_submitted: bool | None = None


class AvailableStudentAccount(BaseModel):
    mssv: str
    full_name: str
    email: str
    phone: str | None = None


class AddDepartmentMemberRequest(BaseModel):
    mssv: str


class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    department_name: str | None = None
    class_name: str | None = None
    book_status_label: str = "Chưa nộp"
    fee_status_label: str = "Chưa nộp"
    gender_label: str | None = None

    class Config:
        from_attributes = True

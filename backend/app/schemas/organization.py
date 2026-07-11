"""Organization schemas — Liên chi & Chi đoàn."""
import re

from pydantic import BaseModel, Field, field_validator


class LienChiCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[A-Z0-9_]+$")


class LienChiUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    code: str | None = Field(None, min_length=2, max_length=50, pattern=r"^[A-Z0-9_]+$")
    is_active: bool | None = None


class LienChiResponse(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool
    department_count: int = 0

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    cohort_id: int
    lien_chi_id: int | None = None
    secretary_name: str = Field(..., min_length=2, max_length=255)
    secretary_mssv: str = Field(..., min_length=5, max_length=20)
    secretary_phone: str = Field(..., min_length=9, max_length=20)
    secretary_email: str = Field(..., min_length=5, max_length=255)

    @field_validator("secretary_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email không hợp lệ")
        return v.strip().lower()

    @field_validator("secretary_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 9 or len(digits) > 11:
            raise ValueError("Số điện thoại không hợp lệ")
        return v.strip()


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    cohort_id: int | None = None
    secretary_name: str | None = Field(None, min_length=2, max_length=255)
    secretary_phone: str | None = Field(None, min_length=9, max_length=20)
    secretary_email: str | None = Field(None, min_length=5, max_length=255)
    is_active: bool | None = None

    @field_validator("secretary_email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email không hợp lệ")
        return v.strip().lower() if v else v

    @field_validator("secretary_phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v:
            digits = re.sub(r"\D", "", v)
            if len(digits) < 9 or len(digits) > 11:
                raise ValueError("Số điện thoại không hợp lệ")
        return v.strip() if v else v


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    cohort_id: int | None = None
    cohort_name: str | None = None
    faculty: str | None = None
    lien_chi_id: int | None = None
    lien_chi_name: str | None = None
    secretary_name: str | None = None
    secretary_mssv: str | None = None
    secretary_phone: str | None = None
    secretary_email: str | None = None
    student_count: int = 0
    is_active: bool

    class Config:
        from_attributes = True


class DepartmentDetailResponse(DepartmentResponse):
    book_submitted: int = 0
    book_not_submitted: int = 0
    fee_submitted: int = 0
    fee_not_submitted: int = 0
    book_completion_rate: float = 0.0
    fee_completion_rate: float = 0.0
    completion_rate: float = 0.0

"""Book schemas."""
from datetime import datetime
from pydantic import BaseModel


class BookCreate(BaseModel):
    student_id: int


class BookResponse(BaseModel):
    id: int
    book_code: str
    qr_code: str
    barcode: str
    student_id: int
    student_name: str | None = None
    student_mssv: str | None = None
    department_id: int
    department_name: str | None = None
    cohort: str
    status: str
    location_path: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusLogResponse(BaseModel):
    id: int
    from_status: str | None
    to_status: str
    actor_name: str | None = None
    note: str | None = None
    ip_address: str | None = None
    device: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class BookDetailResponse(BookResponse):
    status_logs: list[StatusLogResponse] = []


class ReceiveRequest(BaseModel):
    campaign_id: int | None = None
    note: str | None = None


class InventoryRequest(BaseModel):
    missing_photo: bool = False
    missing_stamp: bool = False
    missing_signature: bool = False
    wrong_info: bool = False
    torn: bool = False
    missing_pages: bool = False
    other_notes: str | None = None


class StoreRequest(BaseModel):
    box_id: int


class StatusChangeRequest(BaseModel):
    to_status: str
    note: str | None = None

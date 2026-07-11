"""Campaign & collection schemas."""
from datetime import date, datetime, time
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    lien_chi_id: int
    appointment_date: date
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    note: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    lien_chi_id: int
    lien_chi_name: str | None = None
    appointment_date: date
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    note: str | None = None

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    name: str
    semester: str
    start_date: date
    end_date: date
    department_ids: list[int]
    appointments: list[AppointmentCreate] = Field(default_factory=list)


class CampaignResponse(BaseModel):
    id: int
    name: str
    semester: str
    start_date: date
    end_date: date
    manager_id: int
    manager_name: str | None = None
    status: str
    total_students: int = 0
    total_collected: int = 0
    total_submitted: int = 0
    total_received: int = 0
    progress_percent: float = 0.0
    appointments: list[AppointmentResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CollectStudentRequest(BaseModel):
    student_id: int
    collected: bool = True


class UpdateStatusRequest(BaseModel):
    status: str
    note: str | None = None


class ClassCollectionStudent(BaseModel):
    student_id: int
    mssv: str
    full_name: str
    status: str
    status_label: str
    collected_at: datetime | None = None


class ClassCollectionResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    class_id: int
    class_name: str
    department_name: str | None = None
    submission_status: str | None = None
    students: list[ClassCollectionStudent]
    stats: dict


class ClassSubmissionResponse(BaseModel):
    id: int
    class_id: int
    class_name: str
    department_name: str | None = None
    submitted_at: datetime | None = None
    submitted_by_name: str | None = None
    collected_count: int = 0
    total_students: int = 0
    status: str

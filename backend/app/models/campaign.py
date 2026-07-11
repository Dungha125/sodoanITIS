"""Collection campaign models — thu sổ theo lớp/đoàn viên."""
from datetime import date, datetime, time, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Trạng thái thu sổ từng đoàn viên trong đợt
COLLECTION_PENDING = "pending"
COLLECTION_CHI_DOAN = "chi_doan_collected"
COLLECTION_SUBMITTED = "submitted"
COLLECTION_LIEN_CHI = "lien_chi_received"

COLLECTION_STATUS_LABELS = {
    COLLECTION_PENDING: "Chưa thu",
    COLLECTION_CHI_DOAN: "Chi đoàn đã thu sổ",
    COLLECTION_SUBMITTED: "Đã nộp Liên chi",
    COLLECTION_LIEN_CHI: "Liên chi tiếp nhận sổ",
}


class CollectionCampaign(Base):
    __tablename__ = "collection_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    semester: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    manager: Mapped["User"] = relationship()
    departments: Mapped[list["CampaignDepartment"]] = relationship(back_populates="campaign")
    appointments: Mapped[list["CampaignAppointment"]] = relationship(back_populates="campaign")
    records: Mapped[list["StudentCollectionRecord"]] = relationship(back_populates="campaign")
    submissions: Mapped[list["ClassSubmission"]] = relationship(back_populates="campaign")


class CampaignDepartment(Base):
    __tablename__ = "campaign_departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("collection_campaigns.id"), nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)

    campaign: Mapped["CollectionCampaign"] = relationship(back_populates="departments")
    department: Mapped["Department"] = relationship()


class CampaignAppointment(Base):
    __tablename__ = "campaign_appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("collection_campaigns.id"), nullable=False)
    lien_chi_id: Mapped[int] = mapped_column(ForeignKey("lien_chi_doan.id"), nullable=False)
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)
    location: Mapped[str | None] = mapped_column(String(255))
    note: Mapped[str | None] = mapped_column(String(500))

    campaign: Mapped["CollectionCampaign"] = relationship(back_populates="appointments")
    lien_chi: Mapped["LienChiDoan"] = relationship()


class StudentCollectionRecord(Base):
    __tablename__ = "student_collection_records"
    __table_args__ = (UniqueConstraint("campaign_id", "student_id", name="uq_campaign_student"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("collection_campaigns.id"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    class_id: Mapped[int | None] = mapped_column(ForeignKey("classes.id"), index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default=COLLECTION_PENDING, index=True)
    collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    collected_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    campaign: Mapped["CollectionCampaign"] = relationship(back_populates="records")
    student: Mapped["Student"] = relationship()
    class_room: Mapped["ClassRoom | None"] = relationship()


class ClassSubmission(Base):
    __tablename__ = "class_submissions"
    __table_args__ = (UniqueConstraint("campaign_id", "class_id", name="uq_campaign_class_submit"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("collection_campaigns.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confirmed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | confirmed

    campaign: Mapped["CollectionCampaign"] = relationship(back_populates="submissions")
    class_room: Mapped["ClassRoom"] = relationship()


# Legacy — giữ bảng cũ nếu DB đã có
class CollectionDetail(Base):
    __tablename__ = "collection_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("collection_campaigns.id"), nullable=False, index=True)
    book_id: Mapped[int | None] = mapped_column(ForeignKey("union_books.id"), nullable=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    registered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)


from app.models.user import User  # noqa: E402
from app.models.student import Department, Student, ClassRoom  # noqa: E402
from app.models.lien_chi import LienChiDoan  # noqa: E402
from app.models.book import UnionBook  # noqa: E402

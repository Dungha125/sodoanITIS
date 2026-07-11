"""Student, Department, Class models."""
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lien_chi_id: Mapped[int | None] = mapped_column(ForeignKey("lien_chi_doan.id"), index=True)
    cohort_id: Mapped[int | None] = mapped_column(ForeignKey("cohorts.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    faculty: Mapped[str | None] = mapped_column(String(255))
    secretary_name: Mapped[str | None] = mapped_column(String(255))
    secretary_mssv: Mapped[str | None] = mapped_column(String(20), index=True)
    secretary_phone: Mapped[str | None] = mapped_column(String(20))
    secretary_email: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)

    lien_chi: Mapped["LienChiDoan | None"] = relationship(back_populates="departments")
    cohort: Mapped["Cohort | None"] = relationship(back_populates="departments")
    classes: Mapped[list["ClassRoom"]] = relationship(back_populates="department")
    students: Mapped[list["Student"]] = relationship(back_populates="department")
    users: Mapped[list["User"]] = relationship(back_populates="department")


class ClassRoom(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    cohort: Mapped[str] = mapped_column(String(10), nullable=False)

    department: Mapped["Department"] = relationship(back_populates="classes")
    students: Mapped[list["Student"]] = relationship(back_populates="class_room")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mssv: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    cohort: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    class_id: Mapped[int | None] = mapped_column(ForeignKey("classes.id"))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False, index=True)
    union_join_date: Mapped[date | None] = mapped_column(Date)
    admission_date: Mapped[date | None] = mapped_column(Date)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    gender: Mapped[str | None] = mapped_column(String(10))
    book_submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    fee_submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    class_room: Mapped["ClassRoom | None"] = relationship(back_populates="students")
    department: Mapped["Department"] = relationship(back_populates="students")
    union_book: Mapped["UnionBook | None"] = relationship(back_populates="student", uselist=False)


from app.models.user import User  # noqa: E402
from app.models.book import UnionBook  # noqa: E402
from app.models.lien_chi import LienChiDoan  # noqa: E402
from app.models.cohort import Cohort  # noqa: E402

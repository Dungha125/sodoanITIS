"""Union book and status log models."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Book lifecycle statuses
BOOK_STATUSES = [
    "AT_CHI_DOAN",
    "REGISTERED",
    "RECEIVED",
    "INVENTORY",
    "NEED_SUPPLEMENT",
    "INVENTORY_DONE",
    "IN_STORAGE",
    "BORROWED",
    "RETURNED_TO_STORAGE",
    "PENDING_HANDOVER",
    "HANDED_OVER",
    "MISSING",
    "DAMAGED",
]

VALID_TRANSITIONS = {
    "AT_CHI_DOAN": ["REGISTERED"],
    "REGISTERED": ["INVENTORY"],
    "INVENTORY": ["NEED_SUPPLEMENT", "INVENTORY_DONE"],
    "NEED_SUPPLEMENT": ["AT_CHI_DOAN", "INVENTORY"],
    "INVENTORY_DONE": ["HANDED_OVER"],
    "HANDED_OVER": ["AT_CHI_DOAN"],
}

MARKABLE_STATUSES = {"AT_CHI_DOAN", "REGISTERED", "INVENTORY", "NEED_SUPPLEMENT", "INVENTORY_DONE"}


class UnionBook(Base):
    __tablename__ = "union_books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    qr_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    barcode: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False, index=True)
    cohort: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="AT_CHI_DOAN", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    student: Mapped["Student"] = relationship(back_populates="union_book")
    department: Mapped["Department"] = relationship()
    status_logs: Mapped[list["BookStatusLog"]] = relationship(back_populates="book", order_by="BookStatusLog.created_at.desc()")
    location: Mapped["BookLocation | None"] = relationship(back_populates="book", uselist=False)
    inventory_checks: Mapped[list["InventoryCheck"]] = relationship(back_populates="book")


class BookStatusLog(Base):
    __tablename__ = "book_status_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("union_books.id"), nullable=False, index=True)
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    device: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    book: Mapped["UnionBook"] = relationship(back_populates="status_logs")
    actor: Mapped["User"] = relationship()


class InventoryCheck(Base):
    __tablename__ = "inventory_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("union_books.id"), nullable=False)
    checker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    missing_photo: Mapped[bool] = mapped_column(Boolean, default=False)
    missing_stamp: Mapped[bool] = mapped_column(Boolean, default=False)
    missing_signature: Mapped[bool] = mapped_column(Boolean, default=False)
    wrong_info: Mapped[bool] = mapped_column(Boolean, default=False)
    torn: Mapped[bool] = mapped_column(Boolean, default=False)
    missing_pages: Mapped[bool] = mapped_column(Boolean, default=False)
    other_notes: Mapped[str | None] = mapped_column(Text)
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # pass | fail
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    book: Mapped["UnionBook"] = relationship(back_populates="inventory_checks")
    checker: Mapped["User"] = relationship()


from app.models.student import Student, Department  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.storage import BookLocation  # noqa: E402

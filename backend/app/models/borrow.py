"""Borrow form models."""
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BorrowForm(Base):
    __tablename__ = "borrow_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    borrower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    borrow_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | returned | overdue
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    borrower: Mapped["User"] = relationship()
    items: Mapped[list["BorrowItem"]] = relationship(back_populates="borrow_form")


class BorrowItem(Base):
    __tablename__ = "borrow_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    borrow_form_id: Mapped[int] = mapped_column(ForeignKey("borrow_forms.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("union_books.id"), nullable=False)

    borrow_form: Mapped["BorrowForm"] = relationship(back_populates="items")
    book: Mapped["UnionBook"] = relationship()


from app.models.user import User  # noqa: E402
from app.models.book import UnionBook  # noqa: E402

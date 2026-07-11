"""Handover form models."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HandoverForm(Base):
    __tablename__ = "handover_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    giver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | signed | completed
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    giver: Mapped["User"] = relationship(foreign_keys=[giver_id])
    receiver: Mapped["User"] = relationship(foreign_keys=[receiver_id])
    department: Mapped["Department"] = relationship()
    items: Mapped[list["HandoverItem"]] = relationship(back_populates="handover_form")


class HandoverItem(Base):
    __tablename__ = "handover_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    handover_form_id: Mapped[int] = mapped_column(ForeignKey("handover_forms.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("union_books.id"), nullable=False)

    handover_form: Mapped["HandoverForm"] = relationship(back_populates="items")
    book: Mapped["UnionBook"] = relationship()


from app.models.user import User  # noqa: E402
from app.models.student import Department  # noqa: E402
from app.models.book import UnionBook  # noqa: E402

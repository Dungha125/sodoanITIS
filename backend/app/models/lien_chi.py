"""Liên Chi đoàn model - nhóm các Chi đoàn."""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LienChiDoan(Base):
    __tablename__ = "lien_chi_doan"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)

    departments: Mapped[list["Department"]] = relationship(back_populates="lien_chi")
    users: Mapped[list["User"]] = relationship(back_populates="lien_chi")


from app.models.student import Department  # noqa: E402
from app.models.user import User  # noqa: E402

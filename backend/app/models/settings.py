"""System settings — khoảng thời gian cập nhật trạng thái."""
from datetime import date

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CollectionPeriod(Base):
    """Khoảng thời gian Bí thư được cập nhật trạng thái nộp sổ/phí."""
    __tablename__ = "collection_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)

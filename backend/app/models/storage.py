"""Storage location models."""
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StorageCabinet(Base):
    __tablename__ = "storage_cabinets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    location_note: Mapped[str | None] = mapped_column(String(255))

    shelves: Mapped[list["StorageShelf"]] = relationship(back_populates="cabinet")


class StorageShelf(Base):
    __tablename__ = "storage_shelves"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cabinet_id: Mapped[int] = mapped_column(ForeignKey("storage_cabinets.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    cabinet: Mapped["StorageCabinet"] = relationship(back_populates="shelves")
    boxes: Mapped[list["StorageBox"]] = relationship(back_populates="shelf")


class StorageBox(Base):
    __tablename__ = "storage_boxes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shelf_id: Mapped[int] = mapped_column(ForeignKey("storage_shelves.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=50)

    shelf: Mapped["StorageShelf"] = relationship(back_populates="boxes")
    locations: Mapped[list["BookLocation"]] = relationship(back_populates="box")


class BookLocation(Base):
    __tablename__ = "book_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    box_id: Mapped[int] = mapped_column(ForeignKey("storage_boxes.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("union_books.id"), unique=True, nullable=False)
    full_path: Mapped[str] = mapped_column(String(255), nullable=False)

    box: Mapped["StorageBox"] = relationship(back_populates="locations")
    book: Mapped["UnionBook"] = relationship(back_populates="location")


from app.models.book import UnionBook  # noqa: E402

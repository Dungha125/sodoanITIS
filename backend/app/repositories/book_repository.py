"""Book repository."""
from sqlalchemy.orm import Session, joinedload

from app.models.book import UnionBook, BookStatusLog
from app.repositories.base_repository import BaseRepository


class BookRepository(BaseRepository[UnionBook]):
    def __init__(self, db: Session):
        super().__init__(UnionBook, db)

    def get_by_code(self, code: str) -> UnionBook | None:
        return (
            self.db.query(UnionBook)
            .options(
                joinedload(UnionBook.student),
                joinedload(UnionBook.department),
                joinedload(UnionBook.location),
                joinedload(UnionBook.status_logs),
            )
            .filter(
                (UnionBook.qr_code == code)
                | (UnionBook.barcode == code)
                | (UnionBook.book_code == code)
            )
            .first()
        )

    def get_detail(self, book_id: int) -> UnionBook | None:
        return (
            self.db.query(UnionBook)
            .options(
                joinedload(UnionBook.student),
                joinedload(UnionBook.department),
                joinedload(UnionBook.location),
                joinedload(UnionBook.status_logs).joinedload(BookStatusLog.actor),
            )
            .filter(UnionBook.id == book_id)
            .first()
        )

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        department_id: int | None = None,
        department_ids: list[int] | None = None,
        cohort: str | None = None,
        status: str | None = None,
    ) -> tuple[list[UnionBook], int]:
        query = self.db.query(UnionBook).options(
            joinedload(UnionBook.student), joinedload(UnionBook.department)
        )
        if department_ids is not None:
            query = query.filter(UnionBook.department_id.in_(department_ids))
        elif department_id:
            query = query.filter(UnionBook.department_id == department_id)
        if search:
            query = query.filter(
                (UnionBook.book_code.ilike(f"%{search}%"))
                | (UnionBook.qr_code.ilike(f"%{search}%"))
            )
        if cohort:
            query = query.filter(UnionBook.cohort == cohort)
        if status:
            query = query.filter(UnionBook.status == status)
        total = query.count()
        items = query.order_by(UnionBook.id.desc()).offset(skip).limit(limit).all()
        return items, total

    def count_by_status(self) -> dict[str, int]:
        from sqlalchemy import func
        rows = self.db.query(UnionBook.status, func.count(UnionBook.id)).group_by(UnionBook.status).all()
        return {status: count for status, count in rows}

    def add_status_log(self, log: BookStatusLog) -> BookStatusLog:
        self.db.add(log)
        self.db.flush()
        return log

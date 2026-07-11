"""Borrow/Return service."""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.borrow import BorrowForm, BorrowItem
from app.models.book import UnionBook
from app.services.book_service import BookService


class BorrowService:
    def __init__(self, db: Session):
        self.db = db
        self.book_service = BookService(db)

    def create_borrow(self, book_ids: list[int], borrower_id: int, reason: str, due_date: date, actor_id: int):
        form = BorrowForm(
            borrower_id=borrower_id,
            reason=reason,
            borrow_date=date.today(),
            due_date=due_date,
        )
        self.db.add(form)
        self.db.flush()
        for book_id in book_ids:
            book = self.db.query(UnionBook).filter(UnionBook.id == book_id).first()
            if not book or book.status != "IN_STORAGE":
                raise HTTPException(status_code=400, detail=f"Sổ {book_id} không ở trạng thái lưu kho")
            self.db.add(BorrowItem(borrow_form_id=form.id, book_id=book_id))
            self.book_service.change_status(book_id, "BORROWED", actor_id, f"Mượn: {reason}")
        self.db.commit()
        return {"id": form.id, "message": "Tạo phiếu mượn thành công"}

    def return_books(self, form_id: int, actor_id: int):
        form = self.db.query(BorrowForm).options(joinedload(BorrowForm.items)).filter(BorrowForm.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Phiếu mượn không tồn tại")
        for item in form.items:
            self.book_service.change_status(item.book_id, "RETURNED_TO_STORAGE", actor_id, "Trả sổ về kho")
        form.status = "returned"
        form.return_date = date.today()
        self.db.commit()
        return {"message": "Trả sổ thành công"}

    def list_borrows(self, status: str | None = None) -> list[dict]:
        query = self.db.query(BorrowForm).options(joinedload(BorrowForm.borrower), joinedload(BorrowForm.items))
        if status:
            query = query.filter(BorrowForm.status == status)
        forms = query.order_by(BorrowForm.id.desc()).limit(50).all()
        return [
            {
                "id": f.id,
                "borrower_name": f.borrower.full_name,
                "reason": f.reason,
                "borrow_date": str(f.borrow_date),
                "due_date": str(f.due_date),
                "return_date": str(f.return_date) if f.return_date else None,
                "status": f.status,
                "book_count": len(f.items),
            }
            for f in forms
        ]

    def get_overdue(self) -> list[dict]:
        today = date.today()
        forms = (
            self.db.query(BorrowForm)
            .options(joinedload(BorrowForm.borrower))
            .filter(BorrowForm.status == "active", BorrowForm.due_date < today)
            .all()
        )
        return [{"id": f.id, "borrower": f.borrower.full_name, "due_date": str(f.due_date)} for f in forms]

"""Borrow controller."""
from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.borrow_service import BorrowService

router = APIRouter(prefix="/borrows", tags=["Borrow"])


class BorrowCreate(BaseModel):
    book_ids: list[int]
    borrower_id: int
    reason: str
    due_date: date


@router.get("")
def list_borrows(status: str | None = None, db: Session = Depends(get_db), _=Depends(require_permission("borrow.manage"))):
    return BorrowService(db).list_borrows(status)


@router.post("")
def create_borrow(data: BorrowCreate, db: Session = Depends(get_db), user=Depends(require_permission("borrow.manage"))):
    return BorrowService(db).create_borrow(data.book_ids, data.borrower_id, data.reason, data.due_date, user.id)


@router.post("/{form_id}/return")
def return_books(form_id: int, db: Session = Depends(get_db), user=Depends(require_permission("borrow.manage"))):
    return BorrowService(db).return_books(form_id, user.id)


@router.get("/overdue")
def overdue(db: Session = Depends(get_db), _=Depends(require_permission("borrow.manage"))):
    return BorrowService(db).get_overdue()

"""QR lookup controller."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.book_service import BookService
from app.repositories.student_repository import StudentRepository

router = APIRouter(prefix="/qr", tags=["QR"])


@router.get("/{code}")
def lookup_qr(code: str, db: Session = Depends(get_db), user=Depends(require_permission("books.view"))):
    return BookService(db).get_by_code(code, user)


@router.get("/student/{mssv}")
def lookup_by_mssv(mssv: str, db: Session = Depends(get_db), user=Depends(require_permission("books.view"))):
    student = StudentRepository(db).get_by_mssv(mssv)
    if not student or not student.union_book:
        raise HTTPException(status_code=404, detail="Không tìm thấy sổ của MSSV này")
    return BookService(db).get_book(student.union_book.id, user)

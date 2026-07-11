"""Union book controller."""
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.book import BookCreate, BookDetailResponse, InventoryRequest, StatusChangeRequest
from app.services.book_service import BookService
from app.utils.qr_generator import generate_qr_code

router = APIRouter(prefix="/books", tags=["Union Books"])


def _client_info(request: Request) -> tuple[str | None, str | None]:
    return request.client.host if request.client else None, request.headers.get("User-Agent")


@router.get("")
def list_books(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    department_id: int | None = None,
    cohort: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("books.view")),
):
    return BookService(db).list_books(user, page=page, size=size, search=search, department_id=department_id, cohort=cohort, status=status)


@router.get("/{book_id}", response_model=BookDetailResponse)
def get_book(book_id: int, db: Session = Depends(get_db), user=Depends(require_permission("books.view"))):
    return BookService(db).get_book(book_id, user)


@router.post("")
def create_book(data: BookCreate, db: Session = Depends(get_db), user=Depends(require_permission("books.manage"))):
    return BookService(db).create_book(data, user.id, user)


@router.post("/{book_id}/inventory")
def inventory_book(book_id: int, data: InventoryRequest, request: Request, db: Session = Depends(get_db), user=Depends(require_permission("books.inventory"))):
    ip, _ = _client_info(request)
    return BookService(db).inventory_check(book_id, user.id, data, user, ip)


@router.post("/{book_id}/status")
def change_status(book_id: int, data: StatusChangeRequest, request: Request, db: Session = Depends(get_db), user=Depends(require_permission("books.manage"))):
    ip, device = _client_info(request)
    return BookService(db).change_status(book_id, data.to_status, user.id, user, data.note, ip, device)


@router.get("/{book_id}/qr")
def get_qr_image(book_id: int, db: Session = Depends(get_db), user=Depends(require_permission("books.view"))):
    book = BookService(db).get_book(book_id, user)
    png = generate_qr_code(book.qr_code)
    return Response(content=png, media_type="image/png")

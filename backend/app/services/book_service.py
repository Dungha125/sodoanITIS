"""Book lifecycle service."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.book import UnionBook, BookStatusLog, InventoryCheck, VALID_TRANSITIONS, MARKABLE_STATUSES
from app.models.campaign import CollectionDetail
from app.models.student import Student
from app.models.user import User
from app.repositories.book_repository import BookRepository
from app.repositories.audit_repository import AuditRepository
from app.permissions.scoping import assert_department_access, assert_student_access, resolve_department_filter
from app.schemas.book import BookCreate, BookResponse, BookDetailResponse, StatusLogResponse
from app.utils.qr_generator import generate_book_codes


class BookService:
    def __init__(self, db: Session):
        self.db = db
        self.book_repo = BookRepository(db)
        self.audit_repo = AuditRepository(db)

    def create_book(self, data: BookCreate, actor_id: int, user: User | None = None, skip_scope_check: bool = False) -> BookResponse:
        student = self.db.query(Student).filter(Student.id == data.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Đoàn viên không tồn tại")
        if not skip_scope_check and user:
            assert_student_access(user, self.db, student)
        existing = self.db.query(UnionBook).filter(UnionBook.student_id == data.student_id).first()
        if existing:
            raise HTTPException(status_code=409, detail={"error_code": "BOOK_ALREADY_EXISTS", "message": "Đoàn viên đã có sổ"})

        codes = generate_book_codes()
        book = UnionBook(
            book_code=codes["book_code"],
            qr_code=codes["qr_code"],
            barcode=codes["barcode"],
            student_id=student.id,
            department_id=student.department_id,
            cohort=student.cohort,
            status="AT_CHI_DOAN",
        )
        self.book_repo.create(book)
        self._log_status(book, None, "AT_CHI_DOAN", actor_id, "Tạo sổ mới")
        self.audit_repo.log(actor_id, "CREATE_BOOK", "union_book", book.id, new_value={"book_code": book.book_code})
        self.book_repo.commit()
        return self._to_response(book)

    def get_book(self, book_id: int, user: User | None = None) -> BookDetailResponse:
        book = self.book_repo.get_detail(book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Sổ không tồn tại")
        if user:
            assert_department_access(user, self.db, book.department_id)
        resp = self._to_response(book)
        logs = [
            StatusLogResponse(
                id=log.id,
                from_status=log.from_status,
                to_status=log.to_status,
                actor_name=log.actor.full_name if log.actor else None,
                note=log.note,
                ip_address=log.ip_address,
                device=log.device,
                created_at=log.created_at,
            )
            for log in (book.status_logs or [])
        ]
        return BookDetailResponse(**resp.model_dump(), status_logs=logs)

    def get_by_code(self, code: str, user: User) -> BookDetailResponse:
        book = self.book_repo.get_by_code(code)
        if not book:
            raise HTTPException(status_code=404, detail="Không tìm thấy sổ")
        return self.get_book(book.id, user)

    def list_books(self, user: User, page=1, size=20, **filters) -> dict:
        dept_ids = resolve_department_filter(user, self.db, filters.pop("department_id", None))
        if dept_ids is not None and len(dept_ids) == 0:
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
        skip = (page - 1) * size
        items, total = self.book_repo.search(skip=skip, limit=size, department_ids=dept_ids, **filters)
        return {
            "items": [self._to_response(b) for b in items],
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if size else 0,
        }

    def change_status(
        self,
        book_id: int,
        to_status: str,
        actor_id: int,
        user: User,
        note: str | None = None,
        ip: str | None = None,
        device: str | None = None,
    ):
        book = self.book_repo.get_by_id(book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Sổ không tồn tại")
        assert_department_access(user, self.db, book.department_id)

        if to_status in ("MISSING", "DAMAGED"):
            if book.status not in MARKABLE_STATUSES:
                raise HTTPException(status_code=400, detail=f"Không thể đánh dấu {to_status} từ trạng thái {book.status}")
        else:
            allowed = VALID_TRANSITIONS.get(book.status, [])
            if to_status not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail={"error_code": "INVALID_STATUS_TRANSITION", "message": f"Không thể chuyển từ {book.status} sang {to_status}"},
                )

        old_status = book.status
        book.status = to_status
        book.updated_at = datetime.now(timezone.utc)
        self._log_status(book, old_status, to_status, actor_id, note, ip, device)
        self.audit_repo.log(actor_id, "STATUS_CHANGE", "union_book", book.id, old_value={"status": old_status}, new_value={"status": to_status})
        self.book_repo.commit()
        return self._to_response(self.book_repo.get_by_id(book_id))

    def inventory_check(self, book_id: int, actor_id: int, data, user: User, ip: str | None = None):
        book = self.book_repo.get_by_id(book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Sổ không tồn tại")
        assert_department_access(user, self.db, book.department_id)

        if book.status == "REGISTERED":
            self.change_status(book_id, "INVENTORY", actor_id, user, "Bắt đầu kiểm kê", ip)
        elif book.status != "INVENTORY":
            raise HTTPException(status_code=400, detail=f"Sổ không thể kiểm kê (trạng thái: {book.status})")

        has_issues = any([
            data.missing_photo, data.missing_stamp, data.missing_signature,
            data.wrong_info, data.torn, data.missing_pages,
        ])
        result_status = "fail" if has_issues else "pass"
        check = InventoryCheck(
            book_id=book_id,
            checker_id=actor_id,
            missing_photo=data.missing_photo,
            missing_stamp=data.missing_stamp,
            missing_signature=data.missing_signature,
            wrong_info=data.wrong_info,
            torn=data.torn,
            missing_pages=data.missing_pages,
            other_notes=data.other_notes,
            result=result_status,
        )
        self.db.add(check)
        to_status = "NEED_SUPPLEMENT" if has_issues else "INVENTORY_DONE"
        result = self.change_status(book_id, to_status, actor_id, user, f"Kiểm kê: {result_status}", ip)

        if to_status == "INVENTORY_DONE":
            now = datetime.now(timezone.utc)
            for detail in self.db.query(CollectionDetail).filter(
                CollectionDetail.book_id == book_id,
                CollectionDetail.status == "registered",
            ).all():
                detail.status = "received"
                detail.received_at = now
            self.book_repo.commit()

        return {"result": result_status, "book": result}

    def _log_status(self, book, from_status, to_status, actor_id, note=None, ip=None, device=None):
        log = BookStatusLog(
            book_id=book.id,
            from_status=from_status,
            to_status=to_status,
            actor_id=actor_id,
            note=note,
            ip_address=ip,
            device=device,
        )
        self.book_repo.add_status_log(log)

    def _to_response(self, book: UnionBook) -> BookResponse:
        return BookResponse(
            id=book.id,
            book_code=book.book_code,
            qr_code=book.qr_code,
            barcode=book.barcode,
            student_id=book.student_id,
            student_name=book.student.full_name if book.student else None,
            student_mssv=book.student.mssv if book.student else None,
            department_id=book.department_id,
            department_name=book.department.name if book.department else None,
            cohort=book.cohort,
            status=book.status,
            location_path=book.location.full_path if book.location else None,
            created_at=book.created_at,
            updated_at=book.updated_at,
        )

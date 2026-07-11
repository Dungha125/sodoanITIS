"""Handover service."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.handover import HandoverForm, HandoverItem
from app.services.book_service import BookService


class HandoverService:
    def __init__(self, db: Session):
        self.db = db
        self.book_service = BookService(db)

    def create(self, giver_id: int, receiver_id: int, department_id: int, book_ids: list[int]) -> dict:
        form = HandoverForm(giver_id=giver_id, receiver_id=receiver_id, department_id=department_id)
        self.db.add(form)
        self.db.flush()
        for book_id in book_ids:
            self.db.add(HandoverItem(handover_form_id=form.id, book_id=book_id))
            self.book_service.change_status(book_id, "PENDING_HANDOVER", giver_id, "Chờ bàn giao")
        self.db.commit()
        return {"id": form.id, "message": "Tạo phiếu bàn giao thành công"}

    def sign(self, form_id: int, actor_id: int):
        form = self.db.query(HandoverForm).options(joinedload(HandoverForm.items)).filter(HandoverForm.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Phiếu bàn giao không tồn tại")
        for item in form.items:
            self.book_service.change_status(item.book_id, "HANDED_OVER", actor_id, "Đã bàn giao cho Chi đoàn")
        form.status = "signed"
        form.signed_at = datetime.now(timezone.utc)
        self.db.commit()
        return {"message": "Ký xác nhận thành công"}

    def list_handovers(self) -> list[dict]:
        forms = (
            self.db.query(HandoverForm)
            .options(joinedload(HandoverForm.giver), joinedload(HandoverForm.receiver), joinedload(HandoverForm.department))
            .order_by(HandoverForm.id.desc())
            .limit(50)
            .all()
        )
        return [
            {
                "id": f.id,
                "giver": f.giver.full_name,
                "receiver": f.receiver.full_name,
                "department": f.department.name,
                "status": f.status,
                "signed_at": f.signed_at.isoformat() if f.signed_at else None,
            }
            for f in forms
        ]

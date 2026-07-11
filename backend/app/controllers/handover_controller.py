"""Handover controller."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.handover_service import HandoverService

router = APIRouter(prefix="/handovers", tags=["Handover"])


class HandoverCreate(BaseModel):
    receiver_id: int
    department_id: int
    book_ids: list[int]


@router.get("")
def list_handovers(db: Session = Depends(get_db), _=Depends(require_permission("handover.manage"))):
    return HandoverService(db).list_handovers()


@router.post("")
def create_handover(data: HandoverCreate, db: Session = Depends(get_db), user=Depends(require_permission("handover.manage"))):
    return HandoverService(db).create(user.id, data.receiver_id, data.department_id, data.book_ids)


@router.post("/{form_id}/sign")
def sign_handover(form_id: int, db: Session = Depends(get_db), user=Depends(require_permission("handover.manage"))):
    return HandoverService(db).sign(form_id, user.id)

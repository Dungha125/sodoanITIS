"""Notification controller."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import get_current_user, require_permission
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class SendNotification(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "info"


@router.get("")
def list_notifications(unread_only: bool = False, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return NotificationService(db).list_for_user(user.id, unread_only)


@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    NotificationService(db).mark_read(notif_id, user.id)
    return {"message": "Đã đánh dấu đọc"}


@router.post("/send")
def send_notification(data: SendNotification, db: Session = Depends(get_db), _=Depends(require_permission("notifications.send"))):
    return NotificationService(db).send(data.user_id, data.title, data.message, data.type)

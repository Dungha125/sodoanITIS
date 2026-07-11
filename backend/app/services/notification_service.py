"""Notification service."""
from sqlalchemy.orm import Session

from app.models.audit import Notification


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: int, unread_only: bool = False) -> list[dict]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        notifs = query.order_by(Notification.created_at.desc()).limit(50).all()
        return [
            {"id": n.id, "title": n.title, "message": n.message, "type": n.type, "is_read": n.is_read, "created_at": n.created_at.isoformat()}
            for n in notifs
        ]

    def mark_read(self, notif_id: int, user_id: int):
        notif = self.db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user_id).first()
        if notif:
            notif.is_read = True
            self.db.commit()

    def send(self, user_id: int, title: str, message: str, type: str = "info"):
        notif = Notification(user_id=user_id, title=title, message=message, type=type)
        self.db.add(notif)
        self.db.commit()
        return {"message": "Gửi thông báo thành công"}

    def send_reminder_not_submitted(self, user_ids: list[int], campaign_name: str):
        for uid in user_ids:
            self.send(uid, "Nhắc nộp sổ", f"Đợt {campaign_name}: Vui lòng nộp sổ đoàn trước hạn.", "reminder")

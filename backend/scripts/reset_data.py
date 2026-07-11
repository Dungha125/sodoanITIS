"""Xóa toàn bộ dữ liệu nghiệp vụ, giữ roles + admin.
Chạy: python scripts/reset_data.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import *

db = SessionLocal()

TABLES = [
    AuditLog, Notification, Attachment,
    HandoverItem, HandoverForm, BorrowItem, BorrowForm,
    CollectionDetail, CampaignDepartment, CollectionCampaign,
    InventoryCheck, BookStatusLog, UnionBook,
    Student, ClassRoom, Department, LienChiDoan,
]

for model in TABLES:
    db.query(model).delete()
    print(f"Deleted {model.__tablename__}")

for u in db.query(User).filter(User.username != "admin").all():
    db.delete(u)
    print(f"Deleted user {u.username}")

db.commit()
print("Reset completed — chỉ còn roles + admin")
db.close()

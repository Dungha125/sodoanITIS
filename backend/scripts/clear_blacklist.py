"""Gỡ toàn bộ IP blacklist — chạy thủ công khi admin bị chặn nhầm.

Usage:
    python scripts/clear_blacklist.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.services.security_service import SecurityService


def main():
    db = SessionLocal()
    try:
        n = SecurityService(db).clear_all_blacklist()
        print(f"Đã gỡ chặn {n} IP khỏi blacklist.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

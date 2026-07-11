"""Khởi tạo DB an toàn — CHỈ chạy thủ công lần đầu.

Usage:
    python scripts/init_db.py

Không ghi đè dữ liệu hiện có. Chỉ tạo roles và admin nếu DB trống.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app.models import Role, User
from app.utils.security import hash_password
from app.permissions.roles import (
    ROLE_SUPER_ADMIN, ROLE_DOAN_TRUONG, ROLE_LIEN_CHI_DOAN,
    ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV, ROLE_DOAN_VIEN,
)

ROLES = [
    ("Super Admin", ROLE_SUPER_ADMIN),
    ("Đoàn trường", ROLE_DOAN_TRUONG),
    ("Liên Chi đoàn", ROLE_LIEN_CHI_DOAN),
    ("Bí thư Chi đoàn", ROLE_BI_THU),
    ("Phó Bí thư", ROLE_PHO_BI_THU),
    ("Cộng tác viên", ROLE_CTV),
    ("Đoàn viên", ROLE_DOAN_VIEN),
]

MIGRATIONS = [
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER",
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS cohort_id INTEGER",
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_name VARCHAR(255)",
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_mssv VARCHAR(20)",
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(20)",
    "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_email VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER",
    "ALTER TABLE lien_chi_doan ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(10)",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS book_submitted BOOLEAN DEFAULT FALSE",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_submitted BOOLEAN DEFAULT FALSE",
]


def run_migrations():
    import app.models.cohort  # noqa: F401
    import app.models.settings  # noqa: F401
    import app.models.security  # noqa: F401
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for stmt in MIGRATIONS:
            conn.execute(text(stmt))


def main():
    run_migrations()
    db = SessionLocal()
    try:
        for name, code in ROLES:
            if not db.query(Role).filter(Role.code == code).first():
                db.add(Role(name=name, code=code, description=name))
        db.flush()

        user_count = db.query(User).count()
        if user_count == 0:
            admin_role = db.query(Role).filter(Role.code == ROLE_SUPER_ADMIN).first()
            db.add(User(
                username="admin",
                email="admin@doan.edu.vn",
                password_hash=hash_password("admin123"),
                full_name="Quản trị viên",
                role_id=admin_role.id,
            ))
            print("Đã tạo tài khoản admin / admin123 — đổi mật khẩu ngay sau đăng nhập.")
        else:
            print(f"DB đã có {user_count} user — bỏ qua tạo admin.")

        db.commit()
        print("Init hoàn tất (không seed dữ liệu mẫu).")
    finally:
        db.close()


if __name__ == "__main__":
    main()

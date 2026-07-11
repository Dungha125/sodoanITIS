"""Seed tối thiểu: roles + tài khoản admin."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app.models import Role, User
from app.models.cohort import Cohort
from app.utils.security import hash_password
from app.permissions.roles import *

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER"))
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS cohort_id INTEGER"))
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_name VARCHAR(255)"))
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_mssv VARCHAR(20)"))
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(20)"))
    conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_email VARCHAR(255)"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER"))
    conn.execute(text("ALTER TABLE lien_chi_doan ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
    conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(10)"))
    conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS book_submitted BOOLEAN DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_submitted BOOLEAN DEFAULT FALSE"))

db = SessionLocal()

ROLES = [
    ("Super Admin", ROLE_SUPER_ADMIN),
    ("Đoàn trường", ROLE_DOAN_TRUONG),
    ("Liên Chi đoàn", ROLE_LIEN_CHI_DOAN),
    ("Bí thư Chi đoàn", ROLE_BI_THU),
    ("Phó Bí thư", ROLE_PHO_BI_THU),
    ("Cộng tác viên", ROLE_CTV),
    ("Đoàn viên", ROLE_DOAN_VIEN),
]

role_map = {}
for name, code in ROLES:
    r = db.query(Role).filter(Role.code == code).first()
    if not r:
        r = Role(name=name, code=code, description=name)
        db.add(r)
        db.flush()
    role_map[code] = r

admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    admin = User(
        username="admin",
        email="admin@doan.edu.vn",
        password_hash=hash_password("admin123"),
        full_name="Quản trị viên",
        role_id=role_map[ROLE_SUPER_ADMIN].id,
    )
    db.add(admin)

for name in ["D25", "D26", "D27"]:
    if not db.query(Cohort).filter(Cohort.name == name).first():
        db.add(Cohort(name=name))

db.commit()
print("Seed completed — roles + admin + khóa mẫu")
print("Login: admin / admin123")
print("Tạo Liên chi, Chi đoàn, tài khoản qua menu Quản trị")
db.close()

"""Phân quyền dữ liệu theo Liên chi / Chi đoàn."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import Department
from app.models.user import User
from app.permissions.roles import (
    ROLE_SUPER_ADMIN,
    ROLE_DOAN_TRUONG,
    ROLE_LIEN_CHI_DOAN,
)


def get_allowed_department_ids(user: User, db: Session) -> list[int] | None:
    """
    Trả về None nếu được xem tất cả chi đoàn.
    Trả về list id chi đoàn nếu bị giới hạn phạm vi.
    """
    role = user.role.code
    if role in (ROLE_SUPER_ADMIN, ROLE_DOAN_TRUONG):
        return None
    if role == ROLE_LIEN_CHI_DOAN:
        if user.lien_chi_id:
            ids = (
                db.query(Department.id)
                .filter(Department.lien_chi_id == user.lien_chi_id, Department.is_active == True)
                .all()
            )
            return [i[0] for i in ids]
        return []
    if user.department_id:
        return [user.department_id]
    return []


def assert_department_access(user: User, db: Session, department_id: int):
    allowed = get_allowed_department_ids(user, db)
    if allowed is not None and department_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập chi đoàn này")


def assert_student_access(user: User, db: Session, student):
    assert_department_access(user, db, student.department_id)


def resolve_department_filter(user: User, db: Session, department_id: int | None) -> list[int] | None:
    """Gộp filter từ query param với phạm vi role."""
    allowed = get_allowed_department_ids(user, db)
    if allowed is None:
        return [department_id] if department_id else None
    if department_id:
        if department_id not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền xem chi đoàn này")
        return [department_id]
    return allowed

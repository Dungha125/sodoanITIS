"""Phân quyền dữ liệu theo Liên chi / Chi đoàn."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import Department
from app.models.user import User
from app.permissions.roles import (
    ROLE_SUPER_ADMIN,
    ROLE_DOAN_TRUONG,
    ROLE_LIEN_CHI_DOAN,
    ROLE_BI_THU,
    ROLE_PHO_BI_THU,
    ROLE_CTV,
    ROLE_DOAN_VIEN,
)

LIEN_CHI_MANAGEABLE_ROLES = {ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_DOAN_VIEN}
LIEN_CHI_HIDDEN_ROLES = {ROLE_SUPER_ADMIN, ROLE_DOAN_TRUONG, ROLE_LIEN_CHI_DOAN}

# Thứ bậc: super_admin > doan_truong > lien_chi_doan > bi_thu > pho_bi_thu > doan_vien
CREATABLE_BY_SUPER_ADMIN = {
    ROLE_DOAN_TRUONG, ROLE_LIEN_CHI_DOAN, ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV, ROLE_DOAN_VIEN,
}
CREATABLE_BY_LIEN_CHI = {ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_DOAN_VIEN}


def get_creatable_role_codes(actor_code: str) -> set[str]:
    if actor_code == ROLE_SUPER_ADMIN:
        return CREATABLE_BY_SUPER_ADMIN
    if actor_code == ROLE_LIEN_CHI_DOAN:
        return CREATABLE_BY_LIEN_CHI
    return set()


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


def _lien_chi_allowed_dept_ids(actor: User, db: Session) -> list[int]:
    if not actor.lien_chi_id:
        return []
    return get_allowed_department_ids(actor, db) or []


def is_user_visible_to(actor: User, target: User, db: Session) -> bool:
    if actor.role.code == ROLE_SUPER_ADMIN:
        return True
    if actor.role.code != ROLE_LIEN_CHI_DOAN:
        return False
    if target.id == actor.id:
        return True
    if target.role.code in LIEN_CHI_HIDDEN_ROLES:
        return False
    allowed_depts = _lien_chi_allowed_dept_ids(actor, db)
    if target.department_id and target.department_id in allowed_depts:
        return target.role.code in LIEN_CHI_MANAGEABLE_ROLES
    if (
        target.role.code == ROLE_DOAN_VIEN
        and not target.department_id
        and target.lien_chi_id == actor.lien_chi_id
    ):
        return True
    return False


def assert_user_manageable(actor: User, db: Session, target: User):
    if not is_user_visible_to(actor, target, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền quản lý tài khoản này")


def assert_department_in_lien_chi_scope(actor: User, db: Session, department_id: int | None):
    if actor.role.code == ROLE_SUPER_ADMIN or department_id is None:
        return
    if actor.role.code != ROLE_LIEN_CHI_DOAN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền gán chi đoàn này")
    allowed = _lien_chi_allowed_dept_ids(actor, db)
    if department_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chi đoàn không thuộc Liên chi của bạn")


def assert_can_assign_role(actor: User, role_code: str):
    """Kiểm tra actor có được phép gán vai trò theo thứ bậc."""
    if actor.role.code == ROLE_SUPER_ADMIN:
        if role_code == ROLE_SUPER_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không thể tạo thêm Super Admin")
        return
    allowed = get_creatable_role_codes(actor.role.code)
    if role_code not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền gán vai trò này")


def assert_lien_chi_can_assign_role(actor: User, role_code: str):
    """Alias giữ tương thích — dùng assert_can_assign_role."""
    assert_can_assign_role(actor, role_code)

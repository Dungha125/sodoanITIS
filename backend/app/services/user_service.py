"""User management service (Admin)."""
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, Role
from app.repositories.audit_repository import AuditRepository
from app.schemas.user import UserCreate, UserUpdate, UserListResponse
from app.utils.security import hash_password
from app.permissions.roles import (
    ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV, ROLE_LIEN_CHI_DOAN,
    ROLE_SUPER_ADMIN, ROLE_DOAN_VIEN,
)
from app.permissions.scoping import (
    LIEN_CHI_MANAGEABLE_ROLES,
    assert_user_manageable,
    assert_department_in_lien_chi_scope,
    assert_can_assign_role,
    get_creatable_role_codes,
    _lien_chi_allowed_dept_ids,
)

DEPT_ROLES = {ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV}


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def list_users(self, actor: User) -> list[UserListResponse]:
        query = (
            self.db.query(User)
            .options(joinedload(User.role), joinedload(User.department), joinedload(User.lien_chi))
            .join(Role)
        )
        if actor.role.code != ROLE_SUPER_ADMIN:
            if actor.role.code != ROLE_LIEN_CHI_DOAN:
                return []
            allowed_depts = _lien_chi_allowed_dept_ids(actor, self.db)
            conditions = [User.id == actor.id]
            if allowed_depts:
                conditions.append(
                    (User.department_id.in_(allowed_depts))
                    & (Role.code.in_(LIEN_CHI_MANAGEABLE_ROLES))
                )
            if actor.lien_chi_id:
                conditions.append(
                    (Role.code == ROLE_DOAN_VIEN)
                    & (User.department_id.is_(None))
                    & (User.lien_chi_id == actor.lien_chi_id)
                )
            query = query.filter(or_(*conditions))
        users = query.order_by(User.id).all()
        return [self._to_response(u) for u in users]

    def create(self, data: UserCreate, actor_id: int, actor: User) -> UserListResponse:
        assert_can_assign_role(actor, data.role_code)
        assert_department_in_lien_chi_scope(actor, self.db, data.department_id)

        lien_chi_id = data.lien_chi_id
        if actor.role.code == ROLE_LIEN_CHI_DOAN:
            if data.role_code == ROLE_DOAN_VIEN and not data.department_id:
                lien_chi_id = actor.lien_chi_id
            else:
                lien_chi_id = None

        if self.db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=409, detail="Tên đăng nhập đã tồn tại")
        if self.db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=409, detail="Email đã tồn tại")
        role = self.db.query(Role).filter(Role.code == data.role_code).first()
        if not role:
            raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
        self._validate_role_scope(data.role_code, data.department_id, lien_chi_id)
        user = User(
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role_id=role.id,
            department_id=data.department_id,
            lien_chi_id=lien_chi_id,
            phone=data.phone,
        )
        self.db.add(user)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_USER", "user", user.id, new_value={"username": data.username})
        self.db.commit()
        return self._to_response(self._get(user.id))

    def update(self, user_id: int, data: UserUpdate, actor_id: int, actor: User) -> UserListResponse:
        user = self._get(user_id)
        assert_user_manageable(actor, self.db, user)

        role_code = data.role_code or user.role.code
        if data.role_code:
            assert_can_assign_role(actor, data.role_code)
            role = self.db.query(Role).filter(Role.code == data.role_code).first()
            if not role:
                raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
            user.role_id = role.id
            if role_code not in DEPT_ROLES:
                user.department_id = None
            if role_code != ROLE_LIEN_CHI_DOAN:
                user.lien_chi_id = None
        dept_id = data.department_id if data.department_id is not None else user.department_id
        if data.department_id is not None:
            assert_department_in_lien_chi_scope(actor, self.db, dept_id or None)
        lien_id = data.lien_chi_id if data.lien_chi_id is not None else user.lien_chi_id
        if actor.role.code == ROLE_LIEN_CHI_DOAN:
            lien_id = user.lien_chi_id
            if role_code == ROLE_DOAN_VIEN and not dept_id:
                lien_id = actor.lien_chi_id
        if data.role_code or data.department_id is not None or data.lien_chi_id is not None:
            self._validate_role_scope(role_code, dept_id, lien_id)
        if data.email is not None:
            user.email = data.email
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.department_id is not None:
            user.department_id = data.department_id or None
        if actor.role.code == ROLE_SUPER_ADMIN and data.lien_chi_id is not None:
            user.lien_chi_id = data.lien_chi_id or None
        elif actor.role.code == ROLE_LIEN_CHI_DOAN and role_code == ROLE_DOAN_VIEN:
            user.lien_chi_id = actor.lien_chi_id if not user.department_id else None
        if data.phone is not None:
            user.phone = data.phone
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.password:
            user.password_hash = hash_password(data.password)
        self.audit_repo.log(actor_id, "UPDATE_USER", "user", user.id)
        self.db.commit()
        return self._to_response(self._get(user_id))

    def delete(self, user_id: int, actor_id: int, actor: User):
        if user_id == actor_id:
            raise HTTPException(status_code=400, detail="Không thể xóa tài khoản của chính mình")
        user = self._get(user_id)
        assert_user_manageable(actor, self.db, user)
        if user.role.code == ROLE_SUPER_ADMIN:
            raise HTTPException(status_code=400, detail="Không thể vô hiệu hóa tài khoản admin")
        user.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_USER", "user", user.id)
        self.db.commit()

    def list_roles(self, actor: User) -> list[dict]:
        allowed = get_creatable_role_codes(actor.role.code)
        if not allowed:
            return []
        roles = self.db.query(Role).filter(Role.code.in_(allowed)).order_by(Role.id).all()
        return [{"id": r.id, "name": r.name, "code": r.code} for r in roles]

    @staticmethod
    def _validate_role_scope(role_code: str, department_id: int | None, lien_chi_id: int | None):
        if role_code in DEPT_ROLES and not department_id:
            raise HTTPException(status_code=400, detail="Vai trò này yêu cầu chọn Chi đoàn")
        if role_code == ROLE_LIEN_CHI_DOAN and not lien_chi_id:
            raise HTTPException(status_code=400, detail="Vai trò Liên chi yêu cầu chọn Liên chi")

    def _get(self, user_id: int) -> User:
        user = (
            self.db.query(User)
            .options(joinedload(User.role), joinedload(User.department), joinedload(User.lien_chi))
            .filter(User.id == user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
        return user

    @staticmethod
    def _to_response(user: User) -> UserListResponse:
        return UserListResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role_code=user.role.code,
            role_name=user.role.name,
            department_id=user.department_id,
            department_name=user.department.name if user.department else None,
            lien_chi_id=user.lien_chi_id,
            lien_chi_name=user.lien_chi.name if user.lien_chi else None,
            phone=user.phone,
            is_active=user.is_active,
        )

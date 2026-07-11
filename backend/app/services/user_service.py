"""User management service (Admin)."""
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, Role
from app.repositories.audit_repository import AuditRepository
from app.schemas.user import UserCreate, UserUpdate, UserListResponse
from app.utils.security import hash_password
from app.permissions.roles import ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV, ROLE_LIEN_CHI_DOAN

DEPT_ROLES = {ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV}


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def list_users(self) -> list[UserListResponse]:
        users = (
            self.db.query(User)
            .options(joinedload(User.role), joinedload(User.department), joinedload(User.lien_chi))
            .order_by(User.id)
            .all()
        )
        return [self._to_response(u) for u in users]

    def create(self, data: UserCreate, actor_id: int) -> UserListResponse:
        if self.db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=409, detail="Tên đăng nhập đã tồn tại")
        if self.db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=409, detail="Email đã tồn tại")
        role = self.db.query(Role).filter(Role.code == data.role_code).first()
        if not role:
            raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
        self._validate_role_scope(data.role_code, data.department_id, data.lien_chi_id)
        user = User(
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role_id=role.id,
            department_id=data.department_id,
            lien_chi_id=data.lien_chi_id,
            phone=data.phone,
        )
        self.db.add(user)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_USER", "user", user.id, new_value={"username": data.username})
        self.db.commit()
        return self._to_response(self._get(user.id))

    def update(self, user_id: int, data: UserUpdate, actor_id: int) -> UserListResponse:
        user = self._get(user_id)
        role_code = data.role_code or user.role.code
        if data.role_code:
            role = self.db.query(Role).filter(Role.code == data.role_code).first()
            if not role:
                raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
            user.role_id = role.id
            if role_code not in DEPT_ROLES:
                user.department_id = None
            if role_code != ROLE_LIEN_CHI_DOAN:
                user.lien_chi_id = None
        dept_id = data.department_id if data.department_id is not None else user.department_id
        lien_id = data.lien_chi_id if data.lien_chi_id is not None else user.lien_chi_id
        if data.role_code or data.department_id is not None or data.lien_chi_id is not None:
            self._validate_role_scope(role_code, dept_id, lien_id)
        if data.email is not None:
            user.email = data.email
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.department_id is not None:
            user.department_id = data.department_id or None
        if data.lien_chi_id is not None:
            user.lien_chi_id = data.lien_chi_id or None
        if data.phone is not None:
            user.phone = data.phone
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.password:
            user.password_hash = hash_password(data.password)
        self.audit_repo.log(actor_id, "UPDATE_USER", "user", user.id)
        self.db.commit()
        return self._to_response(self._get(user_id))

    def delete(self, user_id: int, actor_id: int):
        if user_id == actor_id:
            raise HTTPException(status_code=400, detail="Không thể xóa tài khoản của chính mình")
        user = self._get(user_id)
        user.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_USER", "user", user.id)
        self.db.commit()

    def list_roles(self) -> list[dict]:
        roles = self.db.query(Role).order_by(Role.id).all()
        return [{"id": r.id, "name": r.name, "code": r.code} for r in roles]

    @staticmethod
    def _validate_role_scope(role_code: str, department_id: int | None, lien_chi_id: int | None):
        if role_code in DEPT_ROLES and not department_id:
            raise HTTPException(status_code=400, detail="Vai trò này yêu cầu chọn Chi đoàn")
        if role_code == ROLE_LIEN_CHI_DOAN and not lien_chi_id:
            raise HTTPException(status_code=400, detail="Vai trò Liên chi yêu cầu chọn Liên chi")
        if role_code not in DEPT_ROLES and department_id and role_code not in (ROLE_LIEN_CHI_DOAN,):
            pass  # allow optional dept for some roles
        if role_code != ROLE_LIEN_CHI_DOAN and lien_chi_id and role_code not in DEPT_ROLES:
            pass

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

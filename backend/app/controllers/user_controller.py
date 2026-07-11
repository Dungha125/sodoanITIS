"""User management controller (Admin)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.user import UserCreate, UserUpdate, UserListResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserListResponse])
def list_users(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return UserService(db).list_users()


@router.post("", response_model=UserListResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), user=Depends(require_permission("admin"))):
    return UserService(db).create(data, user.id)


@router.put("/{user_id}", response_model=UserListResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), user=Depends(require_permission("admin"))):
    return UserService(db).update(user_id, data, user.id)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user=Depends(require_permission("admin"))):
    UserService(db).delete(user_id, user.id)
    return {"message": "Đã vô hiệu hóa tài khoản"}


@router.get("/roles/list")
def list_roles(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return UserService(db).list_roles()

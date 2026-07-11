"""Authentication service."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.utils.security import verify_password, create_access_token, create_refresh_token, decode_token


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def login(self, data: LoginRequest) -> LoginResponse:
        user = self.user_repo.get_by_username(data.username)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error_code": "INVALID_CREDENTIALS", "message": "Sai tài khoản hoặc mật khẩu"},
            )
        token_data = {"sub": str(user.id)}
        return LoginResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=self._to_user_response(user),
        )

    def refresh(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Refresh token không hợp lệ")
        user = self.user_repo.get_with_relations(int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
        token_data = {"sub": str(user.id)}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }

    def get_me(self, user_id: int) -> UserResponse:
        user = self.user_repo.get_with_relations(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
        return self._to_user_response(user)

    @staticmethod
    def _to_user_response(user) -> UserResponse:
        return UserResponse(
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
        )

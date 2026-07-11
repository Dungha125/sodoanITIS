"""Authentication controller."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(data)


@router.post("/refresh")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return AuthService(db).get_me(user.id)

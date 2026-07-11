"""Auth schemas."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_code: str
    role_name: str
    department_id: int | None = None
    department_name: str | None = None
    lien_chi_id: int | None = None
    lien_chi_name: str | None = None

    class Config:
        from_attributes = True


class LoginResponse(TokenResponse):
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str

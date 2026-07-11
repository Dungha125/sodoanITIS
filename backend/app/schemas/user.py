"""User management schemas."""
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role_code: str
    department_id: int | None = None
    lien_chi_id: int | None = None
    phone: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role_code: str | None = None
    department_id: int | None = None
    lien_chi_id: int | None = None
    phone: str | None = None
    password: str | None = None
    is_active: bool | None = None


class UserListResponse(BaseModel):
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
    phone: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: int
    name: str
    code: str

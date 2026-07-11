"""Security admin endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.security import BlacklistEntry, SecurityEventResponse
from app.services.security_service import SecurityService

router = APIRouter(prefix="/security", tags=["Security"])


@router.get("/blacklist", response_model=list[BlacklistEntry])
def list_blacklist(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return SecurityService(db).list_blacklist()


@router.delete("/blacklist/{ip}")
def remove_blacklist(ip: str, db: Session = Depends(get_db), user=Depends(require_permission("admin"))):
    ok = SecurityService(db).remove_from_blacklist(ip)
    if not ok:
        return {"message": "IP không có trong blacklist"}
    SecurityService(db).log_event(ip, "UNBLOCK", detail=f"Admin {user.id} gỡ chặn")
    return {"message": f"Đã gỡ chặn IP {ip}"}


@router.get("/events", response_model=list[SecurityEventResponse])
def list_events(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return SecurityService(db).list_events()

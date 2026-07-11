"""Audit log controller."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.repositories.audit_repository import AuditRepository

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_permission("audit.view")),
):
    skip = (page - 1) * size
    repo = AuditRepository(db)
    items, total = repo.get_logs(skip=skip, limit=size, entity_type=entity_type)
    return {
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "device": log.device,
                "created_at": log.created_at.isoformat(),
            }
            for log in items
        ],
        "total": total,
        "page": page,
        "size": size,
    }

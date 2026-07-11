"""Dashboard controller."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.stats_service import StatsService
from app.services.period_service import CollectionPeriodService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user=Depends(require_permission("dashboard"))):
    data = StatsService(db).dashboard_for_user(user)
    period = CollectionPeriodService(db).get_active()
    data["period"] = period.model_dump() if period else None
    return data

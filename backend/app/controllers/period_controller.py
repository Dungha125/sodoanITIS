"""Collection period controller."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.settings import CollectionPeriodCreate, CollectionPeriodUpdate, CollectionPeriodResponse
from app.services.period_service import CollectionPeriodService

router = APIRouter(prefix="/periods", tags=["Collection Periods"])


@router.get("", response_model=list[CollectionPeriodResponse])
def list_periods(db: Session = Depends(get_db), _=Depends(require_permission("dashboard"))):
    return CollectionPeriodService(db).list_periods()


@router.get("/active", response_model=CollectionPeriodResponse | None)
def active_period(db: Session = Depends(get_db), _=Depends(require_permission("dashboard"))):
    return CollectionPeriodService(db).get_active()


@router.post("", response_model=CollectionPeriodResponse)
def create_period(data: CollectionPeriodCreate, db: Session = Depends(get_db), user=Depends(require_permission("periods.manage"))):
    return CollectionPeriodService(db).create(data, user.id)


@router.put("/{period_id}", response_model=CollectionPeriodResponse)
def update_period(period_id: int, data: CollectionPeriodUpdate, db: Session = Depends(get_db), user=Depends(require_permission("periods.manage"))):
    return CollectionPeriodService(db).update(period_id, data, user.id)


@router.delete("/{period_id}")
def delete_period(period_id: int, db: Session = Depends(get_db), user=Depends(require_permission("periods.manage"))):
    CollectionPeriodService(db).delete(period_id, user.id)
    return {"message": "Đã vô hiệu hóa khoảng thời gian"}


@router.post("/{period_id}/restore", response_model=CollectionPeriodResponse)
def restore_period(period_id: int, db: Session = Depends(get_db), user=Depends(require_permission("periods.manage"))):
    return CollectionPeriodService(db).restore(period_id, user.id)

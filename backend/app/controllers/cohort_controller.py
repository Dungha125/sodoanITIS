"""Cohort controller."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.cohort import CohortCreate, CohortUpdate, CohortResponse
from app.services.cohort_service import CohortService

router = APIRouter(prefix="/cohorts", tags=["Cohorts"])


@router.get("", response_model=list[CohortResponse])
def list_cohorts(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    user=Depends(require_permission("dashboard")),
):
    inactive = include_inactive and user.role.code in ("super_admin", "lien_chi_doan")
    return CohortService(db).list_cohorts(include_inactive=inactive)


@router.get("/manage", response_model=list[CohortResponse])
def list_cohorts_manage(db: Session = Depends(get_db), _=Depends(require_permission("cohorts.manage"))):
    return CohortService(db).list_cohorts(include_inactive=True)


@router.post("", response_model=CohortResponse)
def create_cohort(data: CohortCreate, db: Session = Depends(get_db), user=Depends(require_permission("cohorts.manage"))):
    return CohortService(db).create(data, user.id)


@router.put("/{cohort_id}", response_model=CohortResponse)
def update_cohort(cohort_id: int, data: CohortUpdate, db: Session = Depends(get_db), user=Depends(require_permission("cohorts.manage"))):
    return CohortService(db).update(cohort_id, data, user.id)


@router.post("/{cohort_id}/restore", response_model=CohortResponse)
def restore_cohort(cohort_id: int, db: Session = Depends(get_db), user=Depends(require_permission("cohorts.manage"))):
    return CohortService(db).restore(cohort_id, user.id)


@router.delete("/{cohort_id}")
def delete_cohort(cohort_id: int, db: Session = Depends(get_db), user=Depends(require_permission("cohorts.manage"))):
    CohortService(db).delete(cohort_id, user.id)
    return {"message": "Đã vô hiệu hóa khóa"}

"""Statistics controller."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import get_current_user, require_permission
from app.schemas.stats import CohortStatsResponse, DepartmentDetailStats
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/cohorts/{cohort_id}", response_model=CohortStatsResponse)
def cohort_stats(cohort_id: int, db: Session = Depends(get_db), user=Depends(require_permission("stats.overview"))):
    return StatsService(db).cohort_stats(cohort_id, user)


@router.get("/departments/{dept_id}", response_model=DepartmentDetailStats)
def department_stats(dept_id: int, db: Session = Depends(get_db), user=Depends(require_permission("stats.department"))):
    return StatsService(db).department_stats(dept_id, user)

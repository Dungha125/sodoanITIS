"""Cohort service."""
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.cohort import Cohort
from app.models.student import Department
from app.repositories.audit_repository import AuditRepository
from app.schemas.cohort import CohortCreate, CohortUpdate, CohortResponse


class CohortService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def list_cohorts(self, admin: bool = False) -> list[CohortResponse]:
        query = self.db.query(Cohort).order_by(Cohort.name.desc())
        if not admin:
            query = query.filter(Cohort.is_active == True)
        return [self._to_response(c) for c in query.all()]

    def create(self, data: CohortCreate, actor_id: int) -> CohortResponse:
        name = data.name.upper()
        if self.db.query(Cohort).filter(Cohort.name == name).first():
            raise HTTPException(status_code=409, detail="Khóa đã tồn tại")
        cohort = Cohort(name=name)
        self.db.add(cohort)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_COHORT", "cohort", cohort.id, new_value={"name": name})
        self.db.commit()
        return self._to_response(cohort)

    def update(self, cohort_id: int, data: CohortUpdate, actor_id: int) -> CohortResponse:
        cohort = self._get(cohort_id)
        if data.name and data.name.upper() != cohort.name:
            if self.db.query(Cohort).filter(Cohort.name == data.name.upper()).first():
                raise HTTPException(status_code=409, detail="Khóa đã tồn tại")
            cohort.name = data.name.upper()
        if data.is_active is not None:
            cohort.is_active = data.is_active
        self.audit_repo.log(actor_id, "UPDATE_COHORT", "cohort", cohort.id)
        self.db.commit()
        return self._to_response(cohort)

    def delete(self, cohort_id: int, actor_id: int):
        cohort = self._get(cohort_id)
        dept_count = self.db.query(Department).filter(Department.cohort_id == cohort_id, Department.is_active == True).count()
        if dept_count > 0:
            raise HTTPException(status_code=400, detail="Không thể xóa khóa còn Chi đoàn hoạt động")
        cohort.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_COHORT", "cohort", cohort.id)
        self.db.commit()

    def _get(self, cohort_id: int) -> Cohort:
        cohort = self.db.query(Cohort).filter(Cohort.id == cohort_id).first()
        if not cohort:
            raise HTTPException(status_code=404, detail="Khóa không tồn tại")
        return cohort

    def _to_response(self, cohort: Cohort) -> CohortResponse:
        count = self.db.query(func.count(Department.id)).filter(
            Department.cohort_id == cohort.id, Department.is_active == True
        ).scalar() or 0
        return CohortResponse(id=cohort.id, name=cohort.name, is_active=cohort.is_active, department_count=count)

"""Statistics service."""
from sqlalchemy import func, case
from sqlalchemy.orm import Session, joinedload

from app.models.cohort import Cohort
from app.models.student import Department, Student
from app.models.user import User
from app.permissions.roles import ROLE_BI_THU, ROLE_LIEN_CHI_DOAN
from app.permissions.scoping import get_allowed_department_ids
from app.schemas.stats import StatsOverview, DepartmentStatsRow, DepartmentDetailStats, CohortStatsResponse
from fastapi import HTTPException


class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def cohort_stats(self, cohort_id: int, user: User) -> CohortStatsResponse:
        cohort = self.db.query(Cohort).filter(Cohort.id == cohort_id).first()
        if not cohort:
            raise HTTPException(status_code=404, detail="Khóa không tồn tại")

        allowed = get_allowed_department_ids(user, self.db)
        dept_query = self.db.query(Department).options(joinedload(Department.cohort)).filter(
            Department.is_active == True, Department.cohort_id == cohort_id
        )
        if allowed is not None:
            dept_query = dept_query.filter(Department.id.in_(allowed))
        departments = dept_query.order_by(Department.name).all()

        dept_ids = [d.id for d in departments]
        overview = self._compute_overview(dept_ids, cohort.id, cohort.name)
        rows = [self._dept_row(d) for d in departments]
        return CohortStatsResponse(overview=overview, departments=rows)

    def department_stats(self, dept_id: int, user: User) -> DepartmentDetailStats:
        allowed = get_allowed_department_ids(user, self.db)
        if allowed is not None and dept_id not in allowed:
            raise HTTPException(status_code=403, detail="Không có quyền xem chi đoàn này")

        dept = (
            self.db.query(Department)
            .options(joinedload(Department.cohort))
            .filter(Department.id == dept_id, Department.is_active == True)
            .first()
        )
        if not dept:
            raise HTTPException(status_code=404, detail="Chi đoàn không tồn tại")

        stats = self._student_counts(dept_id)
        total = stats["total"]
        book_rate = round(stats["book_submitted"] / total * 100, 1) if total else 0
        fee_rate = round(stats["fee_submitted"] / total * 100, 1) if total else 0
        both = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept_id, Student.status == "active",
            Student.book_submitted == True, Student.fee_submitted == True,
        ).scalar() or 0
        completion = round(both / total * 100, 1) if total else 0

        return DepartmentDetailStats(
            id=dept.id, name=dept.name,
            cohort_name=dept.cohort.name if dept.cohort else None,
            secretary_name=dept.secretary_name,
            secretary_phone=dept.secretary_phone,
            secretary_email=dept.secretary_email,
            student_count=total,
            book_submitted=stats["book_submitted"],
            book_not_submitted=stats["book_not_submitted"],
            fee_submitted=stats["fee_submitted"],
            fee_not_submitted=stats["fee_not_submitted"],
            book_completion_rate=book_rate,
            fee_completion_rate=fee_rate,
            completion_rate=completion,
        )

    def dashboard_for_user(self, user: User) -> dict:
        """Trang chủ: Liên chi xem tổng quan, Bí thư xem chi đoàn mình."""
        if user.role.code == ROLE_BI_THU and user.department_id:
            stats = self.department_stats(user.department_id, user)
            return {"type": "department", "data": stats.model_dump()}
        if user.role.code in (ROLE_LIEN_CHI_DOAN, "super_admin"):
            cohorts = self.db.query(Cohort).filter(Cohort.is_active == True).order_by(Cohort.name.desc()).all()
            if not cohorts:
                return {"type": "overview", "data": StatsOverview().model_dump(), "cohorts": []}
            latest = cohorts[0]
            result = self.cohort_stats(latest.id, user)
            return {
                "type": "overview",
                "data": result.overview.model_dump(),
                "cohorts": [{"id": c.id, "name": c.name} for c in cohorts],
                "selected_cohort_id": latest.id,
            }
        return {"type": "overview", "data": StatsOverview().model_dump(), "cohorts": []}

    def _compute_overview(self, dept_ids: list[int], cohort_id: int, cohort_name: str) -> StatsOverview:
        if not dept_ids:
            return StatsOverview(cohort_id=cohort_id, cohort_name=cohort_name)

        stats = self.db.query(
            func.count(Student.id),
            func.sum(case((Student.book_submitted == True, 1), else_=0)),
            func.sum(case((Student.fee_submitted == True, 1), else_=0)),
        ).filter(Student.department_id.in_(dept_ids), Student.status == "active").one()

        total = stats[0] or 0
        book_done = int(stats[1] or 0)
        fee_done = int(stats[2] or 0)
        both_done = self.db.query(func.count(Student.id)).filter(
            Student.department_id.in_(dept_ids), Student.status == "active",
            Student.book_submitted == True, Student.fee_submitted == True,
        ).scalar() or 0
        completion = round(both_done / total * 100, 1) if total else 0

        return StatsOverview(
            cohort_id=cohort_id, cohort_name=cohort_name,
            total_departments=len(dept_ids),
            total_students=total,
            book_submitted=book_done,
            book_not_submitted=total - book_done,
            fee_submitted=fee_done,
            fee_not_submitted=total - fee_done,
            completion_rate=completion,
        )

    def _student_counts(self, dept_id: int) -> dict:
        total = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept_id, Student.status == "active"
        ).scalar() or 0
        book_done = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept_id, Student.status == "active", Student.book_submitted == True
        ).scalar() or 0
        fee_done = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept_id, Student.status == "active", Student.fee_submitted == True
        ).scalar() or 0
        return {
            "total": total,
            "book_submitted": book_done,
            "book_not_submitted": total - book_done,
            "fee_submitted": fee_done,
            "fee_not_submitted": total - fee_done,
        }

    def _dept_row(self, dept: Department) -> DepartmentStatsRow:
        stats = self._student_counts(dept.id)
        total = stats["total"]
        both = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept.id, Student.status == "active",
            Student.book_submitted == True, Student.fee_submitted == True,
        ).scalar() or 0
        completion = round(both / total * 100, 1) if total else 0
        return DepartmentStatsRow(
            id=dept.id, name=dept.name,
            cohort_name=dept.cohort.name if dept.cohort else None,
            secretary_name=dept.secretary_name,
            student_count=total,
            book_submitted=stats["book_submitted"],
            book_not_submitted=stats["book_not_submitted"],
            fee_submitted=stats["fee_submitted"],
            fee_not_submitted=stats["fee_not_submitted"],
            completion_rate=completion,
        )

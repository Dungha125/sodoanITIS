"""Dashboard statistics — thu sổ theo đợt."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.campaign import (
    StudentCollectionRecord, CollectionCampaign,
    COLLECTION_PENDING, COLLECTION_CHI_DOAN, COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI,
)
from app.models.student import Student, Department
from app.models.user import User
from app.permissions.scoping import get_allowed_department_ids


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def _record_query(self, user: User):
        query = self.db.query(StudentCollectionRecord)
        allowed = get_allowed_department_ids(user, self.db)
        if allowed is not None:
            query = query.filter(StudentCollectionRecord.department_id.in_(allowed))
        return query

    def get_stats(self, user: User) -> dict:
        query = self._record_query(user)
        total = query.count()
        if total == 0:
            total_students = self._student_count(user)
            return {
                "total": total_students,
                "received": 0,
                "submitted": 0,
                "not_received": total_students,
                "in_inventory": 0,
                "missing": 0,
                "damaged": 0,
                "by_status": {},
            }

        status_rows = (
            self._record_query(user)
            .with_entities(StudentCollectionRecord.status, func.count(StudentCollectionRecord.id))
            .group_by(StudentCollectionRecord.status)
            .all()
        )
        status_counts = dict(status_rows)
        received = status_counts.get(COLLECTION_LIEN_CHI, 0)
        submitted = sum(status_counts.get(s, 0) for s in [COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI])
        not_received = status_counts.get(COLLECTION_PENDING, 0)
        collected = status_counts.get(COLLECTION_CHI_DOAN, 0)

        return {
            "total": total,
            "received": received,
            "submitted": submitted,
            "not_received": not_received,
            "collected_pending_submit": collected,
            "in_inventory": collected + status_counts.get(COLLECTION_SUBMITTED, 0),
            "missing": not_received + collected,
            "damaged": 0,
            "by_status": status_counts,
        }

    def get_chart_by_status(self, user: User) -> list[dict]:
        rows = (
            self._record_query(user)
            .with_entities(StudentCollectionRecord.status, func.count(StudentCollectionRecord.id))
            .group_by(StudentCollectionRecord.status)
            .all()
        )
        return [{"status": s, "count": c} for s, c in rows]

    def get_chart_by_cohort(self, user: User) -> list[dict]:
        allowed = get_allowed_department_ids(user, self.db)
        query = (
            self.db.query(Student.cohort, func.count(Student.id))
            .filter(Student.status == "active")
        )
        if allowed is not None:
            query = query.filter(Student.department_id.in_(allowed))
        rows = query.group_by(Student.cohort).order_by(Student.cohort).all()
        return [{"cohort": c, "count": n} for c, n in rows]

    def get_chart_by_department(self, user: User) -> list[dict]:
        allowed = get_allowed_department_ids(user, self.db)
        query = (
            self.db.query(Department.name, func.count(StudentCollectionRecord.id))
            .join(StudentCollectionRecord, StudentCollectionRecord.department_id == Department.id)
        )
        if allowed is not None:
            query = query.filter(Department.id.in_(allowed))
        rows = query.group_by(Department.name).order_by(func.count(StudentCollectionRecord.id).desc()).limit(10).all()
        return [{"department": name, "count": count} for name, count in rows]

    def get_top_departments(self, user: User) -> dict:
        allowed = get_allowed_department_ids(user, self.db)
        dept_query = self.db.query(Department).filter(Department.is_active == True)
        if allowed is not None:
            dept_query = dept_query.filter(Department.id.in_(allowed))
        all_depts = dept_query.all()
        submitted, missing = [], []
        for dept in all_depts:
            total_students = self.db.query(func.count(Student.id)).filter(
                Student.department_id == dept.id, Student.status == "active"
            ).scalar() or 0
            received = self.db.query(func.count(StudentCollectionRecord.id)).filter(
                StudentCollectionRecord.department_id == dept.id,
                StudentCollectionRecord.status == COLLECTION_LIEN_CHI,
            ).scalar() or 0
            rate = (received / total_students * 100) if total_students else 0
            entry = {"department": dept.name, "received": received, "total": total_students, "rate": round(rate, 1)}
            submitted.append(entry)
            if received < total_students:
                missing.append({**entry, "remaining": total_students - received})
        submitted.sort(key=lambda x: x["rate"], reverse=True)
        missing.sort(key=lambda x: x["remaining"], reverse=True)
        return {"top_submitted": submitted[:5], "top_missing": missing[:5]}

    def _student_count(self, user: User) -> int:
        allowed = get_allowed_department_ids(user, self.db)
        query = self.db.query(func.count(Student.id)).filter(Student.status == "active")
        if allowed is not None:
            query = query.filter(Student.department_id.in_(allowed))
        return query.scalar() or 0

"""Organization service — Liên chi & Chi đoàn."""
import re
import unicodedata

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.cohort import Cohort
from app.models.lien_chi import LienChiDoan
from app.models.student import Department, Student
from app.models.user import User
from app.permissions.roles import ROLE_LIEN_CHI_DOAN
from app.permissions.scoping import assert_department_access, get_allowed_department_ids
from app.repositories.audit_repository import AuditRepository
from app.schemas.organization import (
    LienChiCreate, LienChiUpdate, LienChiResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentDetailResponse,
)


class OrganizationService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    # --- Liên chi ---

    def list_lien_chi(self, admin: bool = False) -> list[LienChiResponse]:
        query = self.db.query(LienChiDoan).order_by(LienChiDoan.name)
        if not admin:
            query = query.filter(LienChiDoan.is_active == True)
        items = query.all()
        return [self._lien_chi_response(lc) for lc in items]

    def create_lien_chi(self, data: LienChiCreate, actor_id: int) -> LienChiResponse:
        if self.db.query(LienChiDoan).filter(LienChiDoan.code == data.code).first():
            raise HTTPException(status_code=409, detail="Mã Liên chi đã tồn tại")
        lc = LienChiDoan(name=data.name, code=data.code.upper())
        self.db.add(lc)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_LIEN_CHI", "lien_chi", lc.id, new_value={"code": data.code})
        self.db.commit()
        return self._lien_chi_response(lc)

    def update_lien_chi(self, lc_id: int, data: LienChiUpdate, actor_id: int) -> LienChiResponse:
        lc = self._get_lien_chi(lc_id)
        if data.code and data.code.upper() != lc.code:
            if self.db.query(LienChiDoan).filter(LienChiDoan.code == data.code.upper()).first():
                raise HTTPException(status_code=409, detail="Mã Liên chi đã tồn tại")
            lc.code = data.code.upper()
        if data.name is not None:
            lc.name = data.name
        if data.is_active is not None:
            lc.is_active = data.is_active
        self.audit_repo.log(actor_id, "UPDATE_LIEN_CHI", "lien_chi", lc.id)
        self.db.commit()
        return self._lien_chi_response(lc)

    def delete_lien_chi(self, lc_id: int, actor_id: int):
        lc = self._get_lien_chi(lc_id)
        active_depts = (
            self.db.query(Department)
            .filter(Department.lien_chi_id == lc_id, Department.is_active == True)
            .count()
        )
        if active_depts > 0:
            raise HTTPException(status_code=400, detail="Không thể xóa Liên chi còn Chi đoàn hoạt động")
        lc.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_LIEN_CHI", "lien_chi", lc.id)
        self.db.commit()

    # --- Chi đoàn ---

    def list_departments(self, allowed_ids: list[int] | None, admin: bool = False, cohort_id: int | None = None) -> list[DepartmentResponse]:
        query = self.db.query(Department).options(joinedload(Department.lien_chi), joinedload(Department.cohort))
        if not admin:
            query = query.filter(Department.is_active == True)
        if allowed_ids is not None:
            query = query.filter(Department.id.in_(allowed_ids))
        if cohort_id:
            query = query.filter(Department.cohort_id == cohort_id)
        depts = query.order_by(Department.name).all()
        return [self._dept_response(d) for d in depts]

    def get_department_detail(self, dept_id: int, user: User) -> DepartmentDetailResponse:
        assert_department_access(user, self.db, dept_id)
        dept = self._get_department(dept_id)
        base = self._dept_response(dept)
        from app.services.stats_service import StatsService
        stats = StatsService(self.db).department_stats(dept_id, user)
        return DepartmentDetailResponse(
            **base.model_dump(),
            book_submitted=stats.book_submitted,
            book_not_submitted=stats.book_not_submitted,
            fee_submitted=stats.fee_submitted,
            fee_not_submitted=stats.fee_not_submitted,
            book_completion_rate=stats.book_completion_rate,
            fee_completion_rate=stats.fee_completion_rate,
            completion_rate=stats.completion_rate,
        )

    def create_department(self, data: DepartmentCreate, actor_id: int, user: User) -> DepartmentResponse:
        lien_chi_id = data.lien_chi_id or user.lien_chi_id
        if not lien_chi_id:
            raise HTTPException(status_code=400, detail="Thiếu Liên chi")
        lc = self._get_lien_chi(lien_chi_id)
        if not lc.is_active:
            raise HTTPException(status_code=400, detail="Liên chi không hoạt động")

        cohort = self.db.query(Cohort).filter(Cohort.id == data.cohort_id, Cohort.is_active == True).first()
        if not cohort:
            raise HTTPException(status_code=404, detail="Khóa không tồn tại")

        existing = self.db.query(Department).filter(
            Department.name == data.name, Department.cohort_id == data.cohort_id, Department.is_active == True
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Tên Chi đoàn đã tồn tại trong khóa này")

        other_dept = self.db.query(Department).filter(
            Department.secretary_mssv == data.secretary_mssv, Department.is_active == True
        ).first()
        if other_dept:
            raise HTTPException(status_code=409, detail="MSV Bí thư đã được gán cho Chi đoàn khác")

        code = self._generate_code(data.name, cohort.name)
        dept = Department(
            name=data.name,
            code=code,
            cohort_id=data.cohort_id,
            lien_chi_id=lien_chi_id,
            secretary_name=data.secretary_name,
            secretary_mssv=data.secretary_mssv.strip(),
            secretary_phone=data.secretary_phone,
            secretary_email=data.secretary_email,
        )
        self.db.add(dept)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_DEPARTMENT", "department", dept.id, new_value={"name": data.name})
        self.db.commit()
        return self._dept_response(self._get_department(dept.id))

    def update_department(self, dept_id: int, data: DepartmentUpdate, actor_id: int, user: User) -> DepartmentResponse:
        assert_department_access(user, self.db, dept_id)
        dept = self._get_department(dept_id)

        if data.name and data.name != dept.name:
            cohort_id = data.cohort_id or dept.cohort_id
            existing = self.db.query(Department).filter(
                Department.name == data.name, Department.cohort_id == cohort_id,
                Department.is_active == True, Department.id != dept_id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail="Tên Chi đoàn đã tồn tại trong khóa này")
            dept.name = data.name

        if data.cohort_id is not None:
            cohort = self.db.query(Cohort).filter(Cohort.id == data.cohort_id).first()
            if not cohort:
                raise HTTPException(status_code=404, detail="Khóa không tồn tại")
            dept.cohort_id = data.cohort_id

        if data.secretary_name is not None:
            dept.secretary_name = data.secretary_name
        if data.secretary_phone is not None:
            dept.secretary_phone = data.secretary_phone
        if data.secretary_email is not None:
            dept.secretary_email = data.secretary_email
        if data.is_active is not None:
            dept.is_active = data.is_active

        self.audit_repo.log(actor_id, "UPDATE_DEPARTMENT", "department", dept.id)
        self.db.commit()
        return self._dept_response(self._get_department(dept_id))

    def delete_department(self, dept_id: int, actor_id: int, user: User):
        assert_department_access(user, self.db, dept_id)
        dept = self._get_department(dept_id)
        dept.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_DEPARTMENT", "department", dept.id)
        self.db.commit()

    def _get_lien_chi(self, lc_id: int) -> LienChiDoan:
        lc = self.db.query(LienChiDoan).filter(LienChiDoan.id == lc_id).first()
        if not lc:
            raise HTTPException(status_code=404, detail="Liên chi không tồn tại")
        return lc

    def _get_department(self, dept_id: int) -> Department:
        dept = (
            self.db.query(Department)
            .options(joinedload(Department.lien_chi), joinedload(Department.cohort))
            .filter(Department.id == dept_id)
            .first()
        )
        if not dept:
            raise HTTPException(status_code=404, detail="Chi đoàn không tồn tại")
        return dept

    def _lien_chi_response(self, lc: LienChiDoan) -> LienChiResponse:
        count = (
            self.db.query(Department)
            .filter(Department.lien_chi_id == lc.id, Department.is_active == True)
            .count()
        )
        return LienChiResponse(
            id=lc.id, name=lc.name, code=lc.code,
            is_active=lc.is_active, department_count=count,
        )

    def _dept_response(self, dept: Department) -> DepartmentResponse:
        student_count = self.db.query(func.count(Student.id)).filter(
            Student.department_id == dept.id, Student.status == "active"
        ).scalar() or 0
        return DepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            cohort_id=dept.cohort_id,
            cohort_name=dept.cohort.name if dept.cohort else None,
            faculty=dept.faculty,
            lien_chi_id=dept.lien_chi_id,
            lien_chi_name=dept.lien_chi.name if dept.lien_chi else None,
            secretary_name=dept.secretary_name,
            secretary_mssv=dept.secretary_mssv,
            secretary_phone=dept.secretary_phone,
            secretary_email=dept.secretary_email,
            student_count=student_count,
            is_active=dept.is_active,
        )

    @staticmethod
    def _generate_code(name: str, cohort_name: str) -> str:
        slug = unicodedata.normalize("NFD", name)
        slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
        slug = re.sub(r"[^A-Za-z0-9]+", "_", slug).strip("_").upper()
        base = f"{cohort_name}_{slug}"[:45]
        return base or f"CD_{cohort_name}"

"""Departments and Liên chi endpoints."""
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.permissions.dependencies import get_current_user, require_permission
from app.permissions.scoping import get_allowed_department_ids
from app.schemas.organization import (
    LienChiCreate, LienChiUpdate, LienChiResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentDetailResponse,
)
from app.schemas.student import StudentResponse, AddDepartmentMemberRequest
from app.services.organization_service import OrganizationService
from app.services.student_service import StudentService

router = APIRouter(tags=["Organization"])


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    cohort_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("departments.view")),
):
    allowed = get_allowed_department_ids(user, db)
    return OrganizationService(db).list_departments(allowed, admin=False, cohort_id=cohort_id)


@router.get("/departments/{dept_id}", response_model=DepartmentDetailResponse)
def get_department(dept_id: int, db: Session = Depends(get_db), user=Depends(require_permission("departments.view"))):
    return OrganizationService(db).get_department_detail(dept_id, user)


@router.get("/departments/all", response_model=list[DepartmentResponse])
def list_all_departments(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return OrganizationService(db).list_departments(None, admin=True)


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("departments.manage")),
):
    return OrganizationService(db).create_department(data, user.id, user)


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("departments.manage")),
):
    return OrganizationService(db).update_department(dept_id, data, user.id, user)


@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("departments.manage")),
):
    OrganizationService(db).delete_department(dept_id, user.id, user)
    return {"message": "Đã vô hiệu hóa Chi đoàn"}


@router.post("/departments/{dept_id}/import-students")
async def import_students(
    dept_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.import")),
):
    return await StudentService(db).import_excel(dept_id, file, user)


@router.post("/departments/{dept_id}/members", response_model=StudentResponse)
def add_department_member(
    dept_id: int,
    data: AddDepartmentMemberRequest,
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.manage")),
):
    return StudentService(db).add_to_department(dept_id, data.mssv, user.id, user)


@router.get("/lien-chi", response_model=list[LienChiResponse])
def list_lien_chi(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    admin = user.role.code == "super_admin"
    if user.lien_chi_id and not admin:
        svc = OrganizationService(db)
        items = svc.list_lien_chi(admin=False)
        return [lc for lc in items if lc.id == user.lien_chi_id]
    return OrganizationService(db).list_lien_chi(admin=admin)


@router.get("/lien-chi/all", response_model=list[LienChiResponse])
def list_all_lien_chi(db: Session = Depends(get_db), _=Depends(require_permission("admin"))):
    return OrganizationService(db).list_lien_chi(admin=True)


@router.post("/lien-chi", response_model=LienChiResponse)
def create_lien_chi(
    data: LienChiCreate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("admin")),
):
    return OrganizationService(db).create_lien_chi(data, user.id)


@router.put("/lien-chi/{lc_id}", response_model=LienChiResponse)
def update_lien_chi(
    lc_id: int,
    data: LienChiUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("admin")),
):
    return OrganizationService(db).update_lien_chi(lc_id, data, user.id)


@router.delete("/lien-chi/{lc_id}")
def delete_lien_chi(
    lc_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("admin")),
):
    OrganizationService(db).delete_lien_chi(lc_id, user.id)
    return {"message": "Đã vô hiệu hóa Liên chi"}

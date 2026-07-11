"""Student controller."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.student import (
    StudentCreate, StudentUpdate, StudentResponse, StudentStatusUpdate,
    AvailableStudentAccount, AddDepartmentMemberRequest,
)
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/available-accounts", response_model=list[AvailableStudentAccount])
def list_available_accounts(db: Session = Depends(get_db), user=Depends(require_permission("students.manage"))):
    return StudentService(db).list_available_accounts(user)


@router.get("")
def list_students(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    department_id: int | None = None,
    class_id: int | None = None,
    cohort: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.view")),
):
    return StudentService(db).list(
        user, page=page, size=size, search=search,
        department_id=department_id, class_id=class_id, cohort=cohort, status=status,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db), user=Depends(require_permission("students.view"))):
    return StudentService(db).get(student_id, user)


@router.post("", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db), user=Depends(require_permission("students.manage"))):
    return StudentService(db).create(data, user.id, user)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db), user=Depends(require_permission("students.manage"))):
    return StudentService(db).update(student_id, data, user.id, user)


@router.patch("/{student_id}/status", response_model=StudentResponse)
def update_student_status(
    student_id: int, data: StudentStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.status")),
):
    return StudentService(db).update_status(student_id, data, user.id, user)


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), user=Depends(require_permission("students.manage"))):
    StudentService(db).delete(student_id, user.id, user)
    return {"message": "Xóa đoàn viên thành công"}

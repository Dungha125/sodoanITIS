"""Class room controller."""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import get_current_user, require_permission
from app.schemas.classroom import ClassRoomCreate, ClassRoomUpdate, ClassRoomResponse, StudentImportResult
from app.services.classroom_service import ClassRoomService

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.get("", response_model=list[ClassRoomResponse])
def list_classes(
    department_id: int | None = None,
    cohort: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.view")),
):
    return ClassRoomService(db).list_classes(user, department_id, cohort)


@router.post("", response_model=ClassRoomResponse)
def create_class(
    data: ClassRoomCreate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("classes.manage")),
):
    return ClassRoomService(db).create(data, user)


@router.put("/{class_id}", response_model=ClassRoomResponse)
def update_class(
    class_id: int,
    data: ClassRoomUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_permission("classes.manage")),
):
    return ClassRoomService(db).update(class_id, data, user)


@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("classes.manage")),
):
    ClassRoomService(db).delete(class_id, user)
    return {"message": "Xóa lớp thành công"}


@router.post("/{class_id}/import-students", response_model=StudentImportResult)
async def import_students(
    class_id: int,
    file: UploadFile = File(...),
    auto_create_books: bool = Query(False),
    db: Session = Depends(get_db),
    user=Depends(require_permission("students.manage")),
):
    return await ClassRoomService(db).import_students_excel(class_id, file, user, auto_create_books)

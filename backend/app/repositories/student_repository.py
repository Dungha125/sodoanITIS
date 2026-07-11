"""Student repository."""
from sqlalchemy.orm import Session, joinedload

from app.models.student import Student
from app.repositories.base_repository import BaseRepository


class StudentRepository(BaseRepository[Student]):
    def __init__(self, db: Session):
        super().__init__(Student, db)

    def get_by_id(self, id: int) -> Student | None:
        return (
            self.db.query(Student)
            .options(joinedload(Student.department), joinedload(Student.class_room))
            .filter(Student.id == id)
            .first()
        )

    def get_by_mssv(self, mssv: str) -> Student | None:
        return (
            self.db.query(Student)
            .options(joinedload(Student.department), joinedload(Student.class_room))
            .filter(Student.mssv == mssv)
            .first()
        )

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        department_id: int | None = None,
        department_ids: list[int] | None = None,
        cohort: str | None = None,
        class_id: int | None = None,
        status: str | None = None,
    ) -> tuple[list[Student], int]:
        query = self.db.query(Student).options(
            joinedload(Student.department), joinedload(Student.class_room)
        )
        if department_ids is not None:
            query = query.filter(Student.department_id.in_(department_ids))
        elif department_id:
            query = query.filter(Student.department_id == department_id)
        if class_id:
            query = query.filter(Student.class_id == class_id)
        if search:
            query = query.filter(
                (Student.mssv.ilike(f"%{search}%")) | (Student.full_name.ilike(f"%{search}%"))
            )
        if cohort:
            query = query.filter(Student.cohort == cohort)
        if status:
            query = query.filter(Student.status == status)
        total = query.count()
        items = query.order_by(Student.id.desc()).offset(skip).limit(limit).all()
        return items, total

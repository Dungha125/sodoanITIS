"""Report export service — báo cáo thu sổ."""
import io
from sqlalchemy.orm import Session, joinedload

from app.models.campaign import StudentCollectionRecord, COLLECTION_STATUS_LABELS
from app.models.student import Student
from app.models.user import User
from app.permissions.scoping import get_allowed_department_ids


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(
        self,
        user: User,
        department_id: int | None = None,
        cohort: str | None = None,
        status: str | None = None,
        campaign_id: int | None = None,
    ) -> dict:
        allowed = get_allowed_department_ids(user, self.db)
        query = (
            self.db.query(StudentCollectionRecord)
            .options(joinedload(StudentCollectionRecord.student), joinedload(StudentCollectionRecord.class_room))
        )
        if campaign_id:
            query = query.filter(StudentCollectionRecord.campaign_id == campaign_id)
        if allowed is not None:
            if len(allowed) == 0:
                return {"total": 0, "items": []}
            query = query.filter(StudentCollectionRecord.department_id.in_(allowed))
        if department_id:
            if allowed is not None and department_id not in allowed:
                return {"total": 0, "items": []}
            query = query.filter(StudentCollectionRecord.department_id == department_id)
        if cohort:
            query = query.join(Student).filter(Student.cohort == cohort)
        if status:
            query = query.filter(StudentCollectionRecord.status == status)
        records = query.all()
        return {
            "total": len(records),
            "items": [
                {
                    "mssv": r.student.mssv if r.student else "",
                    "student_name": r.student.full_name if r.student else "",
                    "class_name": r.class_room.name if r.class_room else "",
                    "cohort": r.student.cohort if r.student else "",
                    "status": r.status,
                    "status_label": COLLECTION_STATUS_LABELS.get(r.status, r.status),
                }
                for r in records
            ],
        }

    def export_excel(self, user: User, department_id: int | None = None, campaign_id: int | None = None) -> bytes:
        from openpyxl import Workbook
        summary = self.get_summary(user, department_id=department_id, campaign_id=campaign_id)
        wb = Workbook()
        ws = wb.active
        ws.title = "Bao cao thu so"
        ws.append(["MSSV", "Họ tên", "Lớp", "Khóa", "Trạng thái"])
        for item in summary["items"]:
            ws.append([item["mssv"], item["student_name"], item["class_name"], item["cohort"], item["status_label"]])
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()

    def export_pdf(self, user: User, department_id: int | None = None, campaign_id: int | None = None) -> bytes:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        summary = self.get_summary(user, department_id=department_id, campaign_id=campaign_id)
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 800, "Bao cao thu so doan")
        c.setFont("Helvetica", 10)
        y = 770
        c.drawString(50, y, f"Tong so: {summary['total']}")
        y -= 30
        for item in summary["items"][:50]:
            line = f"{item['mssv']} | {item['student_name']} | {item['status_label']}"
            c.drawString(50, y, line)
            y -= 15
            if y < 50:
                c.showPage()
                y = 800
        c.save()
        return buffer.getvalue()

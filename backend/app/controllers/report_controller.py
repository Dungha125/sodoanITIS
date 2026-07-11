"""Report controller."""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def summary(
    department_id: int | None = None,
    cohort: str | None = None,
    status: str | None = None,
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("reports")),
):
    return ReportService(db).get_summary(user, department_id, cohort, status, campaign_id)


@router.get("/export/excel")
def export_excel(
    department_id: int | None = None,
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("reports")),
):
    data = ReportService(db).export_excel(user, department_id, campaign_id)
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=bao_cao_so_doan.xlsx"})


@router.get("/export/pdf")
def export_pdf(
    department_id: int | None = None,
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_permission("reports")),
):
    data = ReportService(db).export_pdf(user, department_id, campaign_id)
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=bao_cao_so_doan.pdf"})

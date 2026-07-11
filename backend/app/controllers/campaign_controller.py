"""Campaign controller — thu sổ theo lớp."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.schemas.campaign import (
    CampaignCreate, CampaignResponse, CollectStudentRequest, UpdateStatusRequest,
    ClassCollectionResponse, ClassSubmissionResponse,
)
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("", response_model=list[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db), user=Depends(require_permission("campaigns.view"))):
    return CampaignService(db).list_campaigns(user)


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), user=Depends(require_permission("campaigns.view"))):
    return CampaignService(db).get(campaign_id, user)


@router.post("", response_model=CampaignResponse)
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db), user=Depends(require_permission("campaigns.manage"))):
    return CampaignService(db).create(data, user.id, user)


@router.get("/{campaign_id}/classes/{class_id}", response_model=ClassCollectionResponse)
def get_class_collection(
    campaign_id: int, class_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.view")),
):
    return CampaignService(db).get_class_collection(campaign_id, class_id, user)


@router.post("/{campaign_id}/collect")
def collect_student(
    campaign_id: int, data: CollectStudentRequest,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.collect")),
):
    return CampaignService(db).collect_student(campaign_id, data.student_id, data.collected, user)


@router.post("/{campaign_id}/classes/{class_id}/submit")
def submit_class(
    campaign_id: int, class_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.submit")),
):
    return CampaignService(db).submit_class(campaign_id, class_id, user)


@router.put("/{campaign_id}/students/{student_id}/status")
def update_student_status(
    campaign_id: int, student_id: int, data: UpdateStatusRequest,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.status")),
):
    return CampaignService(db).update_student_status(campaign_id, student_id, data.status, user, data.note)


@router.get("/{campaign_id}/pending-submissions", response_model=list[ClassSubmissionResponse])
def pending_submissions(
    campaign_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.confirm")),
):
    return CampaignService(db).list_pending_submissions(campaign_id, user)


@router.post("/{campaign_id}/classes/{class_id}/confirm")
def confirm_class(
    campaign_id: int, class_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.confirm")),
):
    return CampaignService(db).confirm_class(campaign_id, class_id, user)


@router.get("/{campaign_id}/missing")
def missing_report(
    campaign_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("campaigns.view")),
):
    return CampaignService(db).get_missing_report(campaign_id, user)

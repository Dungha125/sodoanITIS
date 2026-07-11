"""Campaign & class-based collection service."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.campaign import (
    CollectionCampaign, CampaignDepartment, CampaignAppointment,
    StudentCollectionRecord, ClassSubmission,
    COLLECTION_PENDING, COLLECTION_CHI_DOAN, COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI,
    COLLECTION_STATUS_LABELS,
)
from app.models.student import Student, ClassRoom, Department
from app.models.user import User
from app.permissions.scoping import assert_department_access, get_allowed_department_ids
from app.permissions.roles import ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN, ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV
from app.repositories.audit_repository import AuditRepository
from app.schemas.campaign import (
    CampaignCreate, CampaignResponse, AppointmentResponse,
    ClassCollectionResponse, ClassCollectionStudent, ClassSubmissionResponse,
)


class CampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def create(self, data: CampaignCreate, manager_id: int, user: User) -> CampaignResponse:
        if not data.department_ids:
            raise HTTPException(status_code=400, detail="Chọn ít nhất một chi đoàn")
        if data.end_date < data.start_date:
            raise HTTPException(status_code=400, detail="Ngày kết thúc phải sau ngày bắt đầu")
        for dept_id in data.department_ids:
            assert_department_access(user, self.db, dept_id)

        campaign = CollectionCampaign(
            name=data.name, semester=data.semester,
            start_date=data.start_date, end_date=data.end_date,
            manager_id=manager_id,
        )
        self.db.add(campaign)
        self.db.flush()

        for dept_id in data.department_ids:
            self.db.add(CampaignDepartment(campaign_id=campaign.id, department_id=dept_id))

        for appt in data.appointments:
            self.db.add(CampaignAppointment(
                campaign_id=campaign.id,
                lien_chi_id=appt.lien_chi_id,
                appointment_date=appt.appointment_date,
                start_time=appt.start_time,
                end_time=appt.end_time,
                location=appt.location,
                note=appt.note,
            ))

        students = (
            self.db.query(Student)
            .filter(Student.department_id.in_(data.department_ids), Student.status == "active")
            .all()
        )
        for s in students:
            self.db.add(StudentCollectionRecord(
                campaign_id=campaign.id,
                student_id=s.id,
                class_id=s.class_id,
                department_id=s.department_id,
                status=COLLECTION_PENDING,
            ))

        self.audit_repo.log(manager_id, "CREATE_CAMPAIGN", "campaign", campaign.id)
        self.db.commit()
        return self._to_response(campaign)

    def list_campaigns(self, user: User) -> list[CampaignResponse]:
        allowed = get_allowed_department_ids(user, self.db)
        campaigns = (
            self.db.query(CollectionCampaign)
            .options(
                joinedload(CollectionCampaign.departments),
                joinedload(CollectionCampaign.appointments).joinedload(CampaignAppointment.lien_chi),
                joinedload(CollectionCampaign.manager),
            )
            .order_by(CollectionCampaign.id.desc())
            .all()
        )
        if allowed is not None:
            campaigns = [
                c for c in campaigns
                if any(cd.department_id in allowed for cd in c.departments)
            ]
        return [self._to_response(c) for c in campaigns]

    def get(self, campaign_id: int, user: User) -> CampaignResponse:
        campaign = self._get_campaign(campaign_id)
        self._assert_campaign_access(campaign, user)
        return self._to_response(campaign)

    def get_class_collection(self, campaign_id: int, class_id: int, user: User) -> ClassCollectionResponse:
        campaign = self._get_campaign(campaign_id)
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Đợt thu không còn hoạt động")
        cls = self.db.query(ClassRoom).options(joinedload(ClassRoom.department)).filter(ClassRoom.id == class_id).first()
        if not cls:
            raise HTTPException(status_code=404, detail="Lớp không tồn tại")
        assert_department_access(user, self.db, cls.department_id)
        self._assert_class_in_campaign(campaign, cls.department_id)

        students = self.db.query(Student).filter(Student.class_id == class_id, Student.status == "active").order_by(Student.mssv).all()
        records = {
            r.student_id: r
            for r in self.db.query(StudentCollectionRecord).filter(
                StudentCollectionRecord.campaign_id == campaign_id,
                StudentCollectionRecord.class_id == class_id,
            ).all()
        }
        for s in students:
            if s.id not in records:
                rec = StudentCollectionRecord(
                    campaign_id=campaign_id, student_id=s.id,
                    class_id=class_id, department_id=cls.department_id,
                    status=COLLECTION_PENDING,
                )
                self.db.add(rec)
                records[s.id] = rec
        self.db.flush()

        submission = self.db.query(ClassSubmission).filter(
            ClassSubmission.campaign_id == campaign_id,
            ClassSubmission.class_id == class_id,
        ).first()

        student_list = []
        for s in students:
            rec = records[s.id]
            student_list.append(ClassCollectionStudent(
                student_id=s.id, mssv=s.mssv, full_name=s.full_name,
                status=rec.status,
                status_label=COLLECTION_STATUS_LABELS.get(rec.status, rec.status),
                collected_at=rec.collected_at,
            ))

        stats = self._class_stats(campaign_id, class_id, len(students))
        self.db.commit()

        return ClassCollectionResponse(
            campaign_id=campaign_id,
            campaign_name=campaign.name,
            class_id=class_id,
            class_name=cls.name,
            department_name=cls.department.name if cls.department else None,
            submission_status=submission.status if submission else None,
            students=student_list,
            stats=stats,
        )

    def collect_student(self, campaign_id: int, student_id: int, collected: bool, user: User):
        campaign = self._get_campaign(campaign_id)
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Đợt thu không còn hoạt động")
        rec = self.db.query(StudentCollectionRecord).filter(
            StudentCollectionRecord.campaign_id == campaign_id,
            StudentCollectionRecord.student_id == student_id,
        ).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Đoàn viên không thuộc đợt thu")
        assert_department_access(user, self.db, rec.department_id)

        submission = self.db.query(ClassSubmission).filter(
            ClassSubmission.campaign_id == campaign_id,
            ClassSubmission.class_id == rec.class_id,
            ClassSubmission.status == "confirmed",
        ).first()
        if submission:
            raise HTTPException(status_code=400, detail="Lớp đã được Liên chi xác nhận, không thể sửa")

        if collected:
            if rec.status not in (COLLECTION_PENDING, COLLECTION_CHI_DOAN):
                raise HTTPException(status_code=400, detail="Không thể đánh dấu thu ở trạng thái hiện tại")
            rec.status = COLLECTION_CHI_DOAN
            rec.collected_at = datetime.now(timezone.utc)
            rec.collected_by = user.id
        else:
            if rec.status != COLLECTION_CHI_DOAN:
                raise HTTPException(status_code=400, detail="Chỉ hủy thu khi chưa nộp Liên chi")
            rec.status = COLLECTION_PENDING
            rec.collected_at = None
            rec.collected_by = None

        self.db.commit()
        return {"message": "Cập nhật thành công", "status": rec.status}

    def submit_class(self, campaign_id: int, class_id: int, user: User):
        campaign = self._get_campaign(campaign_id)
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Đợt thu không còn hoạt động")
        cls = self._get_class(class_id)
        assert_department_access(user, self.db, cls.department_id)
        self._assert_class_in_campaign(campaign, cls.department_id)

        submission = self.db.query(ClassSubmission).filter(
            ClassSubmission.campaign_id == campaign_id,
            ClassSubmission.class_id == class_id,
        ).first()
        if submission and submission.status == "confirmed":
            raise HTTPException(status_code=400, detail="Lớp đã được Liên chi xác nhận")

        collected = self.db.query(StudentCollectionRecord).filter(
            StudentCollectionRecord.campaign_id == campaign_id,
            StudentCollectionRecord.class_id == class_id,
            StudentCollectionRecord.status == COLLECTION_CHI_DOAN,
        ).all()
        if not collected:
            raise HTTPException(status_code=400, detail="Chưa có đoàn viên nào được thu sổ")

        now = datetime.now(timezone.utc)
        for rec in collected:
            rec.status = COLLECTION_SUBMITTED
            rec.submitted_at = now

        if not submission:
            submission = ClassSubmission(campaign_id=campaign_id, class_id=class_id)
            self.db.add(submission)
        submission.submitted_at = now
        submission.submitted_by = user.id
        submission.status = "pending"
        submission.confirmed_at = None
        submission.confirmed_by = None

        self.audit_repo.log(user.id, "SUBMIT_CLASS", "class_submission", submission.id or 0)
        self.db.commit()
        return {"message": f"Đã nộp {len(collected)} sổ cho Liên chi", "count": len(collected)}

    def list_pending_submissions(self, campaign_id: int, user: User) -> list[ClassSubmissionResponse]:
        campaign = self._get_campaign(campaign_id)
        self._assert_campaign_access(campaign, user)

        submissions = (
            self.db.query(ClassSubmission)
            .options(joinedload(ClassSubmission.class_room).joinedload(ClassRoom.department))
            .filter(ClassSubmission.campaign_id == campaign_id, ClassSubmission.status == "pending")
            .order_by(ClassSubmission.submitted_at.desc())
            .all()
        )
        result = []
        for sub in submissions:
            cls = sub.class_room
            total = self.db.query(func.count(Student.id)).filter(Student.class_id == sub.class_id, Student.status == "active").scalar() or 0
            collected = self.db.query(func.count(StudentCollectionRecord.id)).filter(
                StudentCollectionRecord.campaign_id == campaign_id,
                StudentCollectionRecord.class_id == sub.class_id,
                StudentCollectionRecord.status.in_([COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI]),
            ).scalar() or 0
            submitter = self.db.query(User).filter(User.id == sub.submitted_by).first()
            result.append(ClassSubmissionResponse(
                id=sub.id, class_id=sub.class_id,
                class_name=cls.name if cls else "",
                department_name=cls.department.name if cls and cls.department else None,
                submitted_at=sub.submitted_at,
                submitted_by_name=submitter.full_name if submitter else None,
                collected_count=collected, total_students=total,
                status=sub.status,
            ))
        return result

    def confirm_class(self, campaign_id: int, class_id: int, user: User):
        campaign = self._get_campaign(campaign_id)
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Đợt thu không còn hoạt động")

        cls = self._get_class(class_id)
        dept = self.db.query(Department).filter(Department.id == cls.department_id).first()
        if user.role.code == "lien_chi_doan" and user.lien_chi_id and dept and dept.lien_chi_id != user.lien_chi_id:
            raise HTTPException(status_code=403, detail="Không có quyền xác nhận lớp này")

        submission = self.db.query(ClassSubmission).filter(
            ClassSubmission.campaign_id == campaign_id,
            ClassSubmission.class_id == class_id,
            ClassSubmission.status == "pending",
        ).first()
        if not submission:
            raise HTTPException(status_code=400, detail="Lớp chưa nộp hoặc đã xác nhận")

        now = datetime.now(timezone.utc)
        submitted_records = self.db.query(StudentCollectionRecord).filter(
            StudentCollectionRecord.campaign_id == campaign_id,
            StudentCollectionRecord.class_id == class_id,
            StudentCollectionRecord.status == COLLECTION_SUBMITTED,
        ).all()
        for rec in submitted_records:
            rec.status = COLLECTION_LIEN_CHI
            rec.received_at = now
            rec.received_by = user.id

        submission.status = "confirmed"
        submission.confirmed_at = now
        submission.confirmed_by = user.id

        self.audit_repo.log(user.id, "CONFIRM_CLASS", "class_submission", submission.id)
        self.db.commit()
        missing = self.db.query(func.count(StudentCollectionRecord.id)).filter(
            StudentCollectionRecord.campaign_id == campaign_id,
            StudentCollectionRecord.class_id == class_id,
            StudentCollectionRecord.status.in_([COLLECTION_PENDING, COLLECTION_CHI_DOAN]),
        ).scalar() or 0
        return {
            "message": f"Liên chi tiếp nhận {len(submitted_records)} sổ",
            "received": len(submitted_records),
            "missing": missing,
        }

    def get_missing_report(self, campaign_id: int, user: User) -> dict:
        campaign = self._get_campaign(campaign_id)
        self._assert_campaign_access(campaign, user)
        allowed = get_allowed_department_ids(user, self.db)

        query = (
            self.db.query(StudentCollectionRecord)
            .options(joinedload(StudentCollectionRecord.student), joinedload(StudentCollectionRecord.class_room))
            .filter(
                StudentCollectionRecord.campaign_id == campaign_id,
                StudentCollectionRecord.status.in_([COLLECTION_PENDING, COLLECTION_CHI_DOAN, COLLECTION_SUBMITTED]),
            )
        )
        if allowed is not None:
            query = query.filter(StudentCollectionRecord.department_id.in_(allowed))

        records = query.all()
        items = []
        for r in records:
            items.append({
                "mssv": r.student.mssv if r.student else "",
                "full_name": r.student.full_name if r.student else "",
                "class_name": r.class_room.name if r.class_room else "",
                "status": r.status,
                "status_label": COLLECTION_STATUS_LABELS.get(r.status, r.status),
            })
        return {"total_missing": len(items), "items": items}

    def update_student_status(self, campaign_id: int, student_id: int, new_status: str, user: User, note: str | None = None):
        """Cập nhật trạng thái thủ công theo quyền role."""
        valid = {COLLECTION_PENDING, COLLECTION_CHI_DOAN, COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI}
        if new_status not in valid:
            raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")

        campaign = self._get_campaign(campaign_id)
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Đợt thu không còn hoạt động")

        rec = self.db.query(StudentCollectionRecord).filter(
            StudentCollectionRecord.campaign_id == campaign_id,
            StudentCollectionRecord.student_id == student_id,
        ).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Đoàn viên không thuộc đợt thu")
        assert_department_access(user, self.db, rec.department_id)

        submission = self.db.query(ClassSubmission).filter(
            ClassSubmission.campaign_id == campaign_id,
            ClassSubmission.class_id == rec.class_id,
            ClassSubmission.status == "confirmed",
        ).first()
        if submission and user.role.code != ROLE_SUPER_ADMIN:
            raise HTTPException(status_code=400, detail="Lớp đã xác nhận — chỉ admin mới sửa được")

        role = user.role.code
        chi_doan_roles = {ROLE_BI_THU, ROLE_PHO_BI_THU, ROLE_CTV}
        if role in chi_doan_roles and new_status not in (COLLECTION_PENDING, COLLECTION_CHI_DOAN):
            raise HTTPException(status_code=403, detail="Bí thư/CTV chỉ cập nhật: Chưa thu hoặc Chi đoàn đã thu")
        if role == ROLE_LIEN_CHI_DOAN and new_status not in (COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI, COLLECTION_CHI_DOAN, COLLECTION_PENDING):
            raise HTTPException(status_code=403, detail="Liên chi không có quyền đặt trạng thái này")
        if role == ROLE_LIEN_CHI_DOAN:
            dept = self.db.query(Department).filter(Department.id == rec.department_id).first()
            if user.lien_chi_id and dept and dept.lien_chi_id != user.lien_chi_id:
                raise HTTPException(status_code=403, detail="Không có quyền sửa đoàn viên này")

        now = datetime.now(timezone.utc)
        old_status = rec.status
        rec.status = new_status
        if new_status == COLLECTION_PENDING:
            rec.collected_at = rec.collected_by = rec.submitted_at = rec.received_at = rec.received_by = None
        elif new_status == COLLECTION_CHI_DOAN:
            rec.collected_at = now
            rec.collected_by = user.id
            rec.submitted_at = rec.received_at = rec.received_by = None
        elif new_status == COLLECTION_SUBMITTED:
            rec.collected_at = rec.collected_at or now
            rec.collected_by = rec.collected_by or user.id
            rec.submitted_at = now
            rec.received_at = rec.received_by = None
        elif new_status == COLLECTION_LIEN_CHI:
            rec.collected_at = rec.collected_at or now
            rec.collected_by = rec.collected_by or user.id
            rec.submitted_at = rec.submitted_at or now
            rec.received_at = now
            rec.received_by = user.id

        self.audit_repo.log(user.id, "UPDATE_COLLECTION_STATUS", "student_collection", rec.id,
                            old_value={"status": old_status}, new_value={"status": new_status, "note": note})
        self.db.commit()
        return {"message": "Cập nhật trạng thái thành công", "status": new_status,
                "status_label": COLLECTION_STATUS_LABELS.get(new_status, new_status)}

    def _get_campaign(self, campaign_id: int) -> CollectionCampaign:
        campaign = (
            self.db.query(CollectionCampaign)
            .options(
                joinedload(CollectionCampaign.departments),
                joinedload(CollectionCampaign.appointments).joinedload(CampaignAppointment.lien_chi),
                joinedload(CollectionCampaign.manager),
            )
            .filter(CollectionCampaign.id == campaign_id)
            .first()
        )
        if not campaign:
            raise HTTPException(status_code=404, detail="Đợt thu không tồn tại")
        return campaign

    def _get_class(self, class_id: int) -> ClassRoom:
        cls = self.db.query(ClassRoom).filter(ClassRoom.id == class_id).first()
        if not cls:
            raise HTTPException(status_code=404, detail="Lớp không tồn tại")
        return cls

    def _assert_campaign_access(self, campaign: CollectionCampaign, user: User):
        allowed = get_allowed_department_ids(user, self.db)
        if allowed is not None:
            camp_depts = [cd.department_id for cd in campaign.departments]
            if not any(d in allowed for d in camp_depts):
                raise HTTPException(status_code=403, detail="Không có quyền xem đợt thu này")

    def _assert_class_in_campaign(self, campaign: CollectionCampaign, department_id: int):
        camp_depts = [cd.department_id for cd in campaign.departments]
        if department_id not in camp_depts:
            raise HTTPException(status_code=400, detail="Lớp không thuộc phạm vi đợt thu")

    def _class_stats(self, campaign_id: int, class_id: int, total: int) -> dict:
        rows = (
            self.db.query(StudentCollectionRecord.status, func.count(StudentCollectionRecord.id))
            .filter(StudentCollectionRecord.campaign_id == campaign_id, StudentCollectionRecord.class_id == class_id)
            .group_by(StudentCollectionRecord.status)
            .all()
        )
        counts = dict(rows)
        return {
            "total": total,
            "pending": counts.get(COLLECTION_PENDING, 0),
            "collected": counts.get(COLLECTION_CHI_DOAN, 0),
            "submitted": counts.get(COLLECTION_SUBMITTED, 0),
            "received": counts.get(COLLECTION_LIEN_CHI, 0),
        }

    def _to_response(self, campaign: CollectionCampaign) -> CampaignResponse:
        total = self.db.query(func.count(StudentCollectionRecord.id)).filter(
            StudentCollectionRecord.campaign_id == campaign.id
        ).scalar() or 0
        collected = self.db.query(func.count(StudentCollectionRecord.id)).filter(
            StudentCollectionRecord.campaign_id == campaign.id,
            StudentCollectionRecord.status.in_([COLLECTION_CHI_DOAN, COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI]),
        ).scalar() or 0
        submitted = self.db.query(func.count(StudentCollectionRecord.id)).filter(
            StudentCollectionRecord.campaign_id == campaign.id,
            StudentCollectionRecord.status.in_([COLLECTION_SUBMITTED, COLLECTION_LIEN_CHI]),
        ).scalar() or 0
        received = self.db.query(func.count(StudentCollectionRecord.id)).filter(
            StudentCollectionRecord.campaign_id == campaign.id,
            StudentCollectionRecord.status == COLLECTION_LIEN_CHI,
        ).scalar() or 0

        appointments = []
        for a in (campaign.appointments or []):
            lc = a.lien_chi if hasattr(a, "lien_chi") and a.lien_chi else None
            if not lc:
                from app.models.lien_chi import LienChiDoan
                lc = self.db.query(LienChiDoan).filter(LienChiDoan.id == a.lien_chi_id).first()
            appointments.append(AppointmentResponse(
                id=a.id, lien_chi_id=a.lien_chi_id,
                lien_chi_name=lc.name if lc else None,
                appointment_date=a.appointment_date,
                start_time=a.start_time, end_time=a.end_time,
                location=a.location, note=a.note,
            ))

        return CampaignResponse(
            id=campaign.id, name=campaign.name, semester=campaign.semester,
            start_date=campaign.start_date, end_date=campaign.end_date,
            manager_id=campaign.manager_id,
            manager_name=campaign.manager.full_name if campaign.manager else None,
            status=campaign.status,
            total_students=total,
            total_collected=collected,
            total_submitted=submitted,
            total_received=received,
            progress_percent=round(received / total * 100, 1) if total else 0,
            appointments=appointments,
            created_at=campaign.created_at,
        )

"""Collection period service."""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.settings import CollectionPeriod
from app.repositories.audit_repository import AuditRepository
from app.schemas.settings import CollectionPeriodCreate, CollectionPeriodUpdate, CollectionPeriodResponse


class CollectionPeriodService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def list_periods(self) -> list[CollectionPeriodResponse]:
        today = date.today()
        items = self.db.query(CollectionPeriod).order_by(CollectionPeriod.start_date.desc()).all()
        return [self._to_response(p, today) for p in items]

    def get_active(self) -> CollectionPeriodResponse | None:
        today = date.today()
        period = self.db.query(CollectionPeriod).filter(CollectionPeriod.is_active == True).order_by(
            CollectionPeriod.start_date.desc()
        ).first()
        return self._to_response(period, today) if period else None

    def is_update_open(self) -> bool:
        today = date.today()
        period = self.db.query(CollectionPeriod).filter(
            CollectionPeriod.is_active == True,
            CollectionPeriod.start_date <= today,
            CollectionPeriod.end_date >= today,
        ).first()
        return period is not None

    def create(self, data: CollectionPeriodCreate, actor_id: int) -> CollectionPeriodResponse:
        if data.end_date < data.start_date:
            raise HTTPException(status_code=400, detail="Ngày kết thúc phải sau ngày bắt đầu")
        period = CollectionPeriod(**data.model_dump())
        self.db.add(period)
        self.db.flush()
        self.audit_repo.log(actor_id, "CREATE_PERIOD", "collection_period", period.id)
        self.db.commit()
        return self._to_response(period, date.today())

    def update(self, period_id: int, data: CollectionPeriodUpdate, actor_id: int) -> CollectionPeriodResponse:
        period = self._get(period_id)
        if data.start_date and data.end_date and data.end_date < data.start_date:
            raise HTTPException(status_code=400, detail="Ngày kết thúc phải sau ngày bắt đầu")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(period, key, value)
        self.audit_repo.log(actor_id, "UPDATE_PERIOD", "collection_period", period.id)
        self.db.commit()
        return self._to_response(period, date.today())

    def delete(self, period_id: int, actor_id: int):
        period = self._get(period_id)
        period.is_active = False
        self.audit_repo.log(actor_id, "DEACTIVATE_PERIOD", "collection_period", period.id)
        self.db.commit()

    def _get(self, period_id: int) -> CollectionPeriod:
        period = self.db.query(CollectionPeriod).filter(CollectionPeriod.id == period_id).first()
        if not period:
            raise HTTPException(status_code=404, detail="Khoảng thời gian không tồn tại")
        return period

    @staticmethod
    def _to_response(period: CollectionPeriod, today: date) -> CollectionPeriodResponse:
        is_open = period.is_active and period.start_date <= today <= period.end_date
        return CollectionPeriodResponse(
            id=period.id, name=period.name,
            start_date=period.start_date, end_date=period.end_date,
            is_active=period.is_active, is_open=is_open,
        )

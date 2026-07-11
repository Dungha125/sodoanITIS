"""Storage controller."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.permissions.dependencies import require_permission
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Storage"])


class CabinetCreate(BaseModel):
    name: str
    location_note: str | None = None


class ShelfCreate(BaseModel):
    cabinet_id: int
    name: str


class BoxCreate(BaseModel):
    shelf_id: int
    name: str
    capacity: int = 50


@router.get("/tree")
def storage_tree(db: Session = Depends(get_db), _=Depends(require_permission("storage.manage"))):
    return StorageService(db).list_tree()


@router.get("/cabinets")
def list_cabinets(db: Session = Depends(get_db), _=Depends(require_permission("storage.manage"))):
    return StorageService(db).list_cabinets()


@router.post("/cabinets")
def create_cabinet(data: CabinetCreate, db: Session = Depends(get_db), _=Depends(require_permission("storage.manage"))):
    return StorageService(db).create_cabinet(data.name, data.location_note)


@router.post("/shelves")
def create_shelf(data: ShelfCreate, db: Session = Depends(get_db), _=Depends(require_permission("storage.manage"))):
    return StorageService(db).create_shelf(data.cabinet_id, data.name)


@router.post("/boxes")
def create_box(data: BoxCreate, db: Session = Depends(get_db), _=Depends(require_permission("storage.manage"))):
    return StorageService(db).create_box(data.shelf_id, data.name, data.capacity)

"""Storage management service."""
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.storage import StorageCabinet, StorageShelf, StorageBox


class StorageService:
    def __init__(self, db: Session):
        self.db = db

    def list_cabinets(self) -> list[dict]:
        cabinets = self.db.query(StorageCabinet).all()
        return [{"id": c.id, "name": c.name, "location_note": c.location_note} for c in cabinets]

    def create_cabinet(self, name: str, location_note: str | None = None) -> dict:
        cab = StorageCabinet(name=name, location_note=location_note)
        self.db.add(cab)
        self.db.commit()
        return {"id": cab.id, "name": cab.name}

    def create_shelf(self, cabinet_id: int, name: str) -> dict:
        shelf = StorageShelf(cabinet_id=cabinet_id, name=name)
        self.db.add(shelf)
        self.db.commit()
        return {"id": shelf.id, "name": shelf.name}

    def create_box(self, shelf_id: int, name: str, capacity: int = 50) -> dict:
        box = StorageBox(shelf_id=shelf_id, name=name, capacity=capacity)
        self.db.add(box)
        self.db.commit()
        return {"id": box.id, "name": box.name}

    def list_tree(self) -> list[dict]:
        cabinets = (
            self.db.query(StorageCabinet)
            .options(joinedload(StorageCabinet.shelves).joinedload(StorageShelf.boxes))
            .all()
        )
        result = []
        for cab in cabinets:
            cab_data = {"id": cab.id, "name": cab.name, "shelves": []}
            for shelf in cab.shelves:
                shelf_data = {"id": shelf.id, "name": shelf.name, "boxes": []}
                for box in shelf.boxes:
                    shelf_data["boxes"].append({"id": box.id, "name": box.name, "capacity": box.capacity})
                cab_data["shelves"].append(shelf_data)
            result.append(cab_data)
        return result

    def get_box(self, box_id: int) -> StorageBox:
        box = self.db.query(StorageBox).filter(StorageBox.id == box_id).first()
        if not box:
            raise HTTPException(status_code=404, detail="Hộp không tồn tại")
        return box

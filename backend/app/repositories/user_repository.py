"""User repository."""
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_username(self, username: str) -> User | None:
        return (
            self.db.query(User)
            .options(joinedload(User.role), joinedload(User.department), joinedload(User.lien_chi))
            .filter(User.username == username, User.is_active == True)
            .first()
        )

    def get_with_relations(self, user_id: int) -> User | None:
        return (
            self.db.query(User)
            .options(joinedload(User.role), joinedload(User.department), joinedload(User.lien_chi))
            .filter(User.id == user_id)
            .first()
        )

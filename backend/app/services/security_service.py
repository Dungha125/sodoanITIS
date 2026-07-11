"""Security service — IP blacklist & rate tracking."""
import threading
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.security import IpBlacklist, SecurityEvent


class SecurityService:
    """In-memory rate tracker + DB-backed blacklist."""

    _lock = threading.Lock()
    _blacklist_cache: set[str] = set()
    _request_log: dict[str, list[float]] = defaultdict(list)
    _cache_loaded = False

    def __init__(self, db: Session):
        self.db = db

    @classmethod
    def load_blacklist_cache(cls, db: Session):
        with cls._lock:
            now = datetime.now(timezone.utc)
            rows = db.query(IpBlacklist).filter(IpBlacklist.is_active == True).all()
            cls._blacklist_cache = set()
            for row in rows:
                if row.expires_at and row.expires_at < now:
                    row.is_active = False
                else:
                    cls._blacklist_cache.add(row.ip_address)
            db.commit()
            cls._cache_loaded = True

    def is_blacklisted(self, ip: str) -> bool:
        return ip in self._blacklist_cache

    def record_request(self, ip: str, window_seconds: float, max_requests: int) -> tuple[bool, int]:
        """Returns (should_blacklist, current_count_in_window)."""
        import time
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = [t for t in self._request_log[ip] if t > cutoff]
            timestamps.append(now)
            self._request_log[ip] = timestamps
            count = len(timestamps)
            if count > max_requests:
                return True, count
            return False, count

    def blacklist_ip(self, ip: str, reason: str, request_count: int = 0) -> IpBlacklist:
        with self._lock:
            if ip in self._blacklist_cache:
                entry = self.db.query(IpBlacklist).filter(IpBlacklist.ip_address == ip).first()
                return entry

            existing = self.db.query(IpBlacklist).filter(IpBlacklist.ip_address == ip).first()
            if existing:
                existing.is_active = True
                existing.reason = reason
                existing.request_count = request_count
                existing.blocked_at = datetime.now(timezone.utc)
                entry = existing
            else:
                entry = IpBlacklist(
                    ip_address=ip, reason=reason, request_count=request_count, is_active=True,
                )
                self.db.add(entry)

            self._blacklist_cache.add(ip)
            self.db.commit()
            self.db.refresh(entry)
            return entry

    def remove_from_blacklist(self, ip: str) -> bool:
        entry = self.db.query(IpBlacklist).filter(IpBlacklist.ip_address == ip).first()
        if not entry:
            return False
        entry.is_active = False
        with self._lock:
            self._blacklist_cache.discard(ip)
            self._request_log.pop(ip, None)
        self.db.commit()
        return True

    def log_event(self, ip: str, event_type: str, path: str | None = None,
                  user_agent: str | None = None, detail: str | None = None):
        event = SecurityEvent(
            ip_address=ip, event_type=event_type, path=path,
            user_agent=user_agent, detail=detail,
        )
        self.db.add(event)
        self.db.commit()

    def list_blacklist(self) -> list[IpBlacklist]:
        return (
            self.db.query(IpBlacklist)
            .filter(IpBlacklist.is_active == True)
            .order_by(IpBlacklist.blocked_at.desc())
            .all()
        )

    def list_events(self, limit: int = 100) -> list[SecurityEvent]:
        return (
            self.db.query(SecurityEvent)
            .order_by(SecurityEvent.created_at.desc())
            .limit(limit)
            .all()
        )

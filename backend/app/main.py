"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.middleware.security import SecurityMiddleware
from app.services.security_service import SecurityService
from app.controllers import (
    auth_controller,
    dashboard_controller,
    student_controller,
    report_controller,
    notification_controller,
    audit_controller,
    department_controller,
    user_controller,
    cohort_controller,
    stats_controller,
    period_controller,
    security_controller,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API quản lý nộp sổ đoàn và phí đoàn",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts_list,
    )

app.add_middleware(SecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

API_PREFIX = "/api/v1"

app.include_router(auth_controller.router, prefix=API_PREFIX)
app.include_router(dashboard_controller.router, prefix=API_PREFIX)
app.include_router(student_controller.router, prefix=API_PREFIX)
app.include_router(report_controller.router, prefix=API_PREFIX)
app.include_router(notification_controller.router, prefix=API_PREFIX)
app.include_router(audit_controller.router, prefix=API_PREFIX)
app.include_router(user_controller.router, prefix=API_PREFIX)
app.include_router(department_controller.router, prefix=API_PREFIX)
app.include_router(cohort_controller.router, prefix=API_PREFIX)
app.include_router(stats_controller.router, prefix=API_PREFIX)
app.include_router(period_controller.router, prefix=API_PREFIX)
app.include_router(security_controller.router, prefix=API_PREFIX)


def _run_migrations():
    """Thêm cột/bảng mới cho DB đã tồn tại (dev)."""
    stmts = [
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS cohort_id INTEGER",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_name VARCHAR(255)",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_mssv VARCHAR(20)",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(20)",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS secretary_email VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS lien_chi_id INTEGER",
        "ALTER TABLE lien_chi_doan ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(10)",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS book_submitted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_submitted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE collection_details ALTER COLUMN book_id DROP NOT NULL",
    ]
    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))


@app.on_event("startup")
def startup():
    import app.models.cohort  # noqa: F401
    import app.models.settings  # noqa: F401
    import app.models.security  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    db = SessionLocal()
    try:
        SecurityService.load_blacklist_cache(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

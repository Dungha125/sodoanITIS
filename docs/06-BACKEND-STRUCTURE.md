# 9. Cấu trúc thư mục Backend

```
backend/
├── app/
│   ├── controllers/          # Presentation layer - HTTP handlers
│   │   ├── auth_controller.py
│   │   ├── dashboard_controller.py
│   │   ├── student_controller.py
│   │   ├── book_controller.py
│   │   ├── qr_controller.py
│   │   ├── campaign_controller.py
│   │   ├── storage_controller.py
│   │   ├── borrow_controller.py
│   │   ├── handover_controller.py
│   │   ├── report_controller.py
│   │   ├── notification_controller.py
│   │   └── audit_controller.py
│   ├── services/             # Business logic
│   │   ├── auth_service.py
│   │   ├── book_service.py
│   │   ├── student_service.py
│   │   ├── campaign_service.py
│   │   ├── inventory_service.py
│   │   ├── storage_service.py
│   │   ├── borrow_service.py
│   │   ├── handover_service.py
│   │   ├── report_service.py
│   │   ├── notification_service.py
│   │   └── qr_service.py
│   ├── repositories/         # Data access
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   ├── student_repository.py
│   │   ├── book_repository.py
│   │   ├── campaign_repository.py
│   │   └── audit_repository.py
│   ├── models/               # SQLAlchemy ORM
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── book.py
│   │   ├── campaign.py
│   │   ├── storage.py
│   │   ├── borrow.py
│   │   ├── handover.py
│   │   └── audit.py
│   ├── schemas/              # Pydantic DTOs
│   │   ├── auth.py
│   │   ├── student.py
│   │   ├── book.py
│   │   ├── campaign.py
│   │   └── common.py
│   ├── utils/
│   │   ├── security.py       # JWT, bcrypt
│   │   ├── qr_generator.py
│   │   ├── excel_export.py
│   │   └── pdf_export.py
│   ├── middlewares/
│   │   └── audit_middleware.py
│   ├── permissions/
│   │   ├── roles.py
│   │   └── dependencies.py
│   ├── config.py
│   ├── database.py
│   └── main.py
├── alembic/
│   ├── env.py
│   └── versions/
├── scripts/
│   └── seed_data.py
├── requirements.txt
└── Dockerfile
```

## Luồng xử lý (Clean Architecture)

```
Request → Controller → Service → Repository → Database
                ↓
            Schema (DTO) validation
                ↓
            Permission check
                ↓
            Audit log
```

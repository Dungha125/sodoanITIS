# Hệ thống Quản lý Sổ Đoàn Điện tử

Số hóa quy trình quản lý **vòng đời** sổ đoàn cho Liên Chi đoàn, Đoàn khoa và Đoàn trường.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React, Vite, Bootstrap 5, React Query, Axios |
| Backend | FastAPI, SQLAlchemy, JWT, Pydantic |
| Database | PostgreSQL |
| Deploy | Docker Compose |

## Quick Start (Docker)

```bash
cd so-doan-dien-tu
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Tài khoản mặc định

| Username | Password | Vai trò |
|----------|----------|---------|
| admin | admin123 | Super Admin |

Các tài khoản khác tạo qua menu **Tài khoản**. Liên chi & Chi đoàn tạo qua menu **Tổ chức**.

## Khởi tạo lần đầu

1. Đăng nhập `admin`
2. **Tổ chức** → Tạo Liên chi → Tạo Chi đoàn
3. **Tài khoản** → Tạo user (Bí thư, Liên chi, CTV...)
4. Bắt đầu quản lý lớp, đoàn viên, sổ đoàn

Xóa data cũ: `docker compose exec backend python scripts/reset_data.py`

## Triển khai Production

Domain: **https://sodoan.lcdkhoacntt1.com**

```bash
cp .env.production.example .env   # cập nhật DB_PASSWORD, SECRET_KEY
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Chi tiết: [Hướng dẫn triển khai VPS](docs/09-HUONG-DAN-TRIEN-KHAI.md)

## Chạy local (không Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Cần PostgreSQL chạy sẵn, cập nhật DATABASE_URL trong .env
copy .env.example .env
python scripts/init_db.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Cấu trúc dự án

```
so-doan-dien-tu/
├── backend/          # FastAPI - Clean Architecture
├── frontend/         # React Admin Dashboard
├── docs/             # Tài liệu phân tích, ERD, API
├── storage/          # File upload local
└── docker-compose.yml
```

## Module chính

- **Dashboard** — Thống kê realtime, biểu đồ
- **Quản lý lớp** — CRUD lớp, import danh sách Excel
- **Đoàn viên** — CRUD đoàn viên theo phạm vi chi đoàn
- **Sổ đoàn** — CRUD, QR/Barcode, timeline
- **Đợt thu** — Quản lý đợt thu sổ
- **Kiểm kê** — Checklist lỗi
- **Báo cáo** — Export Excel/PDF
- **Tổ chức** — Tạo Liên chi, Chi đoàn
- **Tài khoản** — Tạo user, phân quyền theo vai trò
- **Audit** — Lịch sử đầy đủ IP/device

## Vòng đời sổ

```
Chi đoàn → Đăng ký nộp → Kiểm kê → Bàn giao
```

## Tài liệu

Xem thư mục [`docs/`](docs/):

1. [Phân tích yêu cầu](docs/01-PHAN-TICH-YEU-CAU.md)
2. [Diagrams (Use Case, Activity, Sequence)](docs/02-DIAGRAMS.md)
3. [ERD & Database](docs/03-ERD-DATABASE.md)
4. [API Design](docs/04-API-DESIGN.md)
5. [Frontend Structure](docs/05-FRONTEND-STRUCTURE.md)
6. [Backend Structure](docs/06-BACKEND-STRUCTURE.md)
7. [UI/UX Design](docs/07-UI-UX-DESIGN.md)
8. [Test Plan & Future](docs/08-TEST-PLAN-FUTURE.md)
9. [Hướng dẫn triển khai VPS](docs/09-HUONG-DAN-TRIEN-KHAI.md)

## License

MIT

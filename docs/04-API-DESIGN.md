# 7. Thiết kế RESTful API

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <JWT>`

## Authentication

| Method | Endpoint | Mô tả | Roles |
|--------|----------|-------|-------|
| POST | `/auth/login` | Đăng nhập | Public |
| POST | `/auth/refresh` | Refresh token | Authenticated |
| GET | `/auth/me` | Thông tin user hiện tại | Authenticated |
| POST | `/auth/logout` | Đăng xuất | Authenticated |

**POST /auth/login**
```json
// Request
{ "username": "admin", "password": "admin123" }
// Response 200
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "user": {...} }
// Error 401: INVALID_CREDENTIALS
```

## Dashboard

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/dashboard/stats` | Tổng hợp số liệu |
| GET | `/dashboard/charts/status` | Biểu đồ theo trạng thái |
| GET | `/dashboard/charts/cohort` | Biểu đồ theo khóa |
| GET | `/dashboard/charts/department` | Biểu đồ theo chi đoàn |
| GET | `/dashboard/charts/campaign/{id}` | Tiến độ đợt thu |

## Students

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/students` | Danh sách (pagination, filter) |
| GET | `/students/{id}` | Chi tiết |
| POST | `/students` | Tạo mới |
| PUT | `/students/{id}` | Cập nhật |
| DELETE | `/students/{id}` | Xóa |
| POST | `/students/import` | Import Excel |
| GET | `/students/export` | Export Excel |

Query params: `page`, `size`, `search`, `department_id`, `cohort`, `status`

## Union Books

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/books` | Danh sách |
| GET | `/books/{id}` | Chi tiết + timeline |
| POST | `/books` | Tạo sổ mới (sinh QR) |
| PUT | `/books/{id}` | Cập nhật |
| POST | `/books/{id}/receive` | Tiếp nhận |
| POST | `/books/{id}/inventory` | Kiểm kê |
| POST | `/books/{id}/store` | Lưu kho |
| POST | `/books/{id}/status` | Chuyển trạng thái |
| GET | `/books/{id}/qr` | Tải QR image |

## QR

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/qr/{code}` | Tra cứu bằng QR/barcode/book_code |
| GET | `/qr/student/{mssv}` | Tra cứu theo MSSV |

## Campaigns

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/campaigns` | Danh sách đợt thu |
| POST | `/campaigns` | Tạo đợt |
| GET | `/campaigns/{id}` | Chi tiết + tiến độ |
| PUT | `/campaigns/{id}` | Cập nhật |
| POST | `/campaigns/{id}/register` | Chi đoàn đăng ký nộp |

## Storage

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/storage/cabinets` | Danh sách tủ |
| POST | `/storage/cabinets` | Tạo tủ |
| GET | `/storage/shelves` | Danh sách ngăn |
| POST | `/storage/shelves` | Tạo ngăn |
| GET | `/storage/boxes` | Danh sách hộp |
| POST | `/storage/boxes` | Tạo hộp |

## Borrow / Return

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/borrows` | Danh sách phiếu mượn |
| POST | `/borrows` | Tạo phiếu mượn |
| POST | `/borrows/{id}/return` | Trả sổ |
| GET | `/borrows/overdue` | Quá hạn |

## Handover

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/handovers` | Danh sách |
| POST | `/handovers` | Tạo phiếu |
| GET | `/handovers/{id}` | Chi tiết |
| POST | `/handovers/{id}/sign` | Ký xác nhận |
| GET | `/handovers/{id}/pdf` | Xuất PDF |

## Reports

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/reports/summary` | Báo cáo tổng hợp |
| GET | `/reports/export/excel` | Export Excel |
| GET | `/reports/export/pdf` | Export PDF |

## Notifications

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/notifications` | Danh sách |
| PUT | `/notifications/{id}/read` | Đánh dấu đã đọc |
| POST | `/notifications/send` | Gửi thông báo |

## Audit Logs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/audit-logs` | Lịch sử hệ thống |
| GET | `/books/{id}/history` | Timeline sổ |

## Upload

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/upload` | Upload file (MinIO/local) |

## Error Codes

| Code | HTTP | Mô tả |
|------|------|-------|
| INVALID_CREDENTIALS | 401 | Sai tài khoản/mật khẩu |
| FORBIDDEN | 403 | Không đủ quyền |
| NOT_FOUND | 404 | Không tìm thấy |
| VALIDATION_ERROR | 422 | Dữ liệu không hợp lệ |
| INVALID_STATUS_TRANSITION | 400 | Chuyển trạng thái không hợp lệ |
| BOOK_ALREADY_EXISTS | 409 | Sổ đã tồn tại |
| CAMPAIGN_CLOSED | 400 | Đợt thu đã đóng |

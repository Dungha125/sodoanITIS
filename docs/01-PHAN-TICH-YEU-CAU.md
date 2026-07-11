# 1. Phân tích yêu cầu nghiệp vụ

## 1.1 Bối cảnh

Hệ thống **Quản lý Sổ Đoàn Điện tử** số hóa quy trình quản lý **vòng đời** cuốn sổ đoàn (không số hóa nội dung bên trong sổ), phục vụ Liên Chi đoàn, Đoàn khoa và Đoàn trường.

## 1.2 Stakeholders

| Vai trò | Mô tả |
|---------|-------|
| Super Admin | Quản trị toàn hệ thống |
| Đoàn trường | Giám sát toàn trường, báo cáo tổng hợp |
| Liên Chi đoàn | Quản lý thu/kiểm kê/kho/bàn giao cấp khoa |
| Bí thư Chi đoàn | Đăng ký nộp sổ, theo dõi tiến độ chi đoàn |
| Phó Bí thư | Hỗ trợ thu sổ, tra cứu |
| CTV | Tiếp nhận, kiểm kê, lưu kho |
| Đoàn viên | Tra cứu trạng thái sổ cá nhân |

## 1.3 Vòng đời sổ đoàn (State Machine)

```
AT_CHI_DOAN → REGISTERED → RECEIVED → INVENTORY → NEED_SUPPLEMENT
    → INVENTORY_DONE → IN_STORAGE → BORROWED → RETURNED_TO_STORAGE
    → PENDING_HANDOVER → HANDED_OVER → AT_CHI_DOAN (chu kỳ mới)
```

Trạng thái đặc biệt: `MISSING`, `DAMAGED`

## 1.4 Yêu cầu chức năng (Functional Requirements)

| ID | Module | Mô tả | Ưu tiên |
|----|--------|-------|---------|
| FR-01 | Auth | Đăng nhập JWT, phân quyền RBAC | Cao |
| FR-02 | Dashboard | Thống kê realtime, biểu đồ | Cao |
| FR-03 | Đoàn viên | CRUD, import/export Excel | Cao |
| FR-04 | Sổ đoàn | CRUD, QR/Barcode, tra cứu | Cao |
| FR-05 | Đợt thu | Tạo đợt, theo dõi tiến độ | Cao |
| FR-06 | Tiếp nhận | Quét QR / nhập MSSV | Cao |
| FR-07 | Kiểm kê | Checklist lỗi, ghi chú | Cao |
| FR-08 | Kho | Quản lý Tủ/Ngăn/Hộp | Trung bình |
| FR-09 | Mượn/Trả | Phiếu mượn, hạn trả | Trung bình |
| FR-10 | Bàn giao | Phiếu bàn giao, PDF | Cao |
| FR-11 | Lịch sử | Timeline audit đầy đủ | Cao |
| FR-12 | Báo cáo | Excel/PDF theo nhiều tiêu chí | Trung bình |
| FR-13 | Thông báo | Email + in-app | Thấp |
| FR-14 | QR Scanner | Quét liên tục camera | Cao |

## 1.5 Yêu cầu phi chức năng (Non-Functional)

- **Bảo mật**: JWT, bcrypt, RBAC, audit log IP/device
- **Hiệu năng**: API < 500ms, pagination, index DB
- **Khả dụng**: Responsive mobile (quét QR)
- **Mở rộng**: Clean Architecture, Docker
- **Sao lưu**: PostgreSQL volume, export Excel

## 1.6 Quy tắc nghiệp vụ

1. Mỗi đoàn viên có tối đa 1 sổ active tại một thời điểm
2. Chỉ sổ ở trạng thái `REGISTERED` mới được tiếp nhận
3. Kiểm kê bắt buộc trước khi lưu kho
4. Mượn sổ chỉ khi sổ ở trạng thái `IN_STORAGE`
5. Mọi chuyển trạng thái phải ghi `book_status_logs` + `audit_logs`

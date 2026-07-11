# 16. Kế hoạch kiểm thử

## 16.1 Unit Tests (Backend)

| Module | Test cases |
|--------|-----------|
| AuthService | Login success/fail, token refresh, invalid token |
| BookService | Status transitions valid/invalid, QR generation |
| StudentService | CRUD, duplicate MSSV |
| CampaignService | Create, register, progress calculation |
| InventoryService | Checklist save, supplement flow |
| Permissions | Role-based access for each endpoint |

## 16.2 Integration Tests

| Flow | Steps |
|------|-------|
| Thu sổ end-to-end | Register → Receive → Inventory → Store |
| Mượn/Trả | Borrow → Overdue check → Return |
| Bàn giao | Create form → Sign → PDF export |
| Import Excel | Upload → Validate → Insert |

## 16.3 Frontend Tests

| Component | Test |
|-----------|------|
| LoginPage | Form validation, redirect after login |
| QRScanner | Mock camera, decode callback |
| DataTable | Pagination, sort, filter |
| StatusBadge | Correct color per status |

## 16.4 E2E Tests (Manual checklist)

- [ ] Đăng nhập với từng role, verify menu hiển thị đúng
- [ ] Tạo đợt thu, đăng ký nộp từ Chi đoàn
- [ ] Quét QR tiếp nhận sổ trên mobile
- [ ] Kiểm kê với checklist lỗi → NEED_SUPPLEMENT
- [ ] Kiểm kê pass → lưu kho Tủ A/Ngăn 2/Hộp 5
- [ ] Mượn sổ, trả sổ, verify overdue notification
- [ ] Tạo phiếu bàn giao, xuất PDF
- [ ] Dashboard số liệu khớp với DB
- [ ] Export Excel/PDF báo cáo
- [ ] Dark mode toggle
- [ ] Responsive trên mobile/tablet

## 16.5 Security Tests

- [ ] JWT expired → 401
- [ ] Role không đủ quyền → 403
- [ ] SQL injection trên search params
- [ ] XSS trên input fields
- [ ] Rate limiting login

## 16.6 Performance Tests

- [ ] 1000 sổ: list API < 500ms
- [ ] Dashboard stats < 1s
- [ ] Import 500 students < 10s

---

# 17. Đề xuất cải tiến tương lai

## Phase 2
- **AI OCR**: Quét trang đầu sổ, so sánh MSSV/họ tên tự động
- **AI Assistant**: Chatbot trả lời câu hỏi bằng dữ liệu hệ thống (RAG)
- **Mobile App**: React Native cho quét QR offline
- **Push Notification**: Firebase/APNs

## Phase 3
- **Multi-tenant**: Nhiều trường trên 1 hệ thống
- **Blockchain**: Hash lịch sử bàn giao không thể sửa
- **Digital Signature**: Ký số điện tử trên phiếu bàn giao
- **BI Dashboard**: Apache Superset / Metabase integration

## Phase 4
- **Tích hợp hệ thống sinh viên**: Sync MSSV, lớp, khóa tự động
- **SMS Gateway**: Nhắc nộp sổ qua SMS
- **Workflow Engine**: Camunda cho quy trình phức tạp
- **Elasticsearch**: Full-text search nâng cao

# 10. Thiết kế UI/UX

## Design System

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#DC3545` (Đoàn đỏ) | `#FF6B6B` |
| Secondary | `#0D6EFD` | `#6EA8FE` |
| Background | `#F8F9FA` | `#212529` |
| Surface | `#FFFFFF` | `#343A40` |
| Text | `#212529` | `#F8F9FA` |
| Success | `#198754` | `#75B798` |
| Warning | `#FFC107` | `#FFDA6A` |
| Danger | `#DC3545` | `#EA868F` |

## Layout

```
┌─────────────────────────────────────────────────────┐
│ Topbar: Logo | Search | 🌙 Dark | 🔔 Notif | User  │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Main Content                            │
│          │  ┌─────────────────────────────────────┐ │
│ Dashboard│  │ Breadcrumb                          │ │
│ Sổ đoàn  │  ├─────────────────────────────────────┤ │
│ Đoàn viên│  │ Page Title          [Actions]       │ │
│ Thu sổ   │  ├─────────────────────────────────────┤ │
│ Kiểm kê  │  │                                     │ │
│ Kho      │  │ Content Area                        │ │
│ Mượn     │  │                                     │ │
│ Bàn giao │  │                                     │ │
│ Báo cáo  │  └─────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

## Status Badge Colors

| Trạng thái | Màu | Bootstrap class |
|------------|-----|-----------------|
| AT_CHI_DOAN | Xanh dương | `bg-primary` |
| REGISTERED | Vàng | `bg-warning` |
| RECEIVED | Xanh lá nhạt | `bg-info` |
| INVENTORY | Cam | `bg-warning` |
| IN_STORAGE | Xanh lá | `bg-success` |
| BORROWED | Tím | `bg-purple` |
| MISSING | Đỏ | `bg-danger` |
| DAMAGED | Đỏ đậm | `bg-dark` |

## Responsive Breakpoints

- Mobile (< 768px): Sidebar collapse, bottom nav for QR scan
- Tablet (768-992px): Collapsed sidebar icons only
- Desktop (> 992px): Full sidebar

## UX Patterns

1. **Quét QR liên tục**: Màn Receive dùng camera fullscreen, auto-submit sau quét
2. **Skeleton loading**: Tất cả bảng dữ liệu
3. **Toast notifications**: Mọi action CRUD
4. **Confirm modal**: Xóa, chuyển trạng thái quan trọng
5. **Empty state**: Illustration + CTA khi chưa có dữ liệu

## Màn hình chính

### Dashboard
- 4 stat cards hàng trên (Tổng sổ, Đã thu, Chưa thu, Đang mượn)
- 4 stat cards hàng dưới (Thiếu, Hỏng, Mất, Đang kiểm kê)
- 2 biểu đồ pie/bar: theo trạng thái, theo khóa
- Bảng top chi đoàn nộp nhanh / còn thiếu

### Tiếp nhận sổ
- Tab 1: Quét QR (camera viewfinder)
- Tab 2: Nhập MSSV
- Panel phải: Thông tin sổ preview
- Nút "Tiếp nhận" lớn, màu xanh

### Chi tiết sổ
- Header: Mã sổ + QR + Status badge
- Tabs: Thông tin | Lịch sử | Kiểm kê | Vị trí kho
- Timeline dọc bên phải

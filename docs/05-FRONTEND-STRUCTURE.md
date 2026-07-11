# 8. Cấu trúc thư mục Frontend

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + interceptors
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── students.js
│   │   ├── campaigns.js
│   │   ├── dashboard.js
│   │   ├── storage.js
│   │   ├── borrows.js
│   │   ├── handovers.js
│   │   ├── reports.js
│   │   └── notifications.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── common/
│   │   │   ├── DataTable.jsx
│   │   │   ├── SearchFilter.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── books/
│   │   │   ├── BookTimeline.jsx
│   │   │   └── QRScanner.jsx
│   │   └── charts/
│   │       ├── StatusChart.jsx
│   │       └── CohortChart.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useToast.js
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── StudentsPage.jsx
│   │   ├── BooksPage.jsx
│   │   ├── BookDetailPage.jsx
│   │   ├── ReceivePage.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── StoragePage.jsx
│   │   ├── BorrowPage.jsx
│   │   ├── HandoverPage.jsx
│   │   ├── CampaignsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── AuditLogsPage.jsx
│   │   └── AdminPage.jsx
│   ├── utils/
│   │   ├── constants.js
│   │   ├── permissions.js
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## Routing

| Path | Page | Roles |
|------|------|-------|
| `/login` | Login | Public |
| `/` | Dashboard | All authenticated |
| `/students` | Students | LCD, BT, Admin |
| `/books` | Books | All |
| `/books/:id` | Book Detail | All |
| `/receive` | Receive | CTV, LCD |
| `/inventory` | Inventory | CTV, LCD |
| `/storage` | Storage | CTV, LCD |
| `/borrow` | Borrow | CTV, LCD |
| `/handover` | Handover | LCD |
| `/campaigns` | Campaigns | LCD, BT |
| `/reports` | Reports | LCD, DT, Admin |
| `/notifications` | Notifications | All |
| `/admin` | Admin | Super Admin |

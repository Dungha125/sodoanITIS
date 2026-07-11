export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const SUBMISSION_LABELS = {
  true: { label: 'Đã nộp', color: 'success' },
  false: { label: 'Chưa nộp', color: 'secondary' },
};

export const GENDERS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
];

export const MENU_ITEMS = [
  { path: '/', icon: 'bi-house', label: 'Trang chủ', permission: 'dashboard' },
  { path: '/stats', icon: 'bi-bar-chart', label: 'Thống kê', permission: 'stats.overview' },
  { path: '/organization', icon: 'bi-building', label: 'Liên chi', permission: 'admin' },
  { path: '/cohorts', icon: 'bi-mortarboard', label: 'Quản lý Khóa', permission: 'cohorts.manage' },
  { path: '/departments', icon: 'bi-diagram-3', label: 'Quản lý Chi đoàn', permission: 'departments.manage' },
  { path: '/students', icon: 'bi-people', label: 'Đoàn viên', permission: 'students.view' },
  { path: '/periods', icon: 'bi-calendar-range', label: 'Kỳ cập nhật', permission: 'periods.manage' },
  { path: '/admin', icon: 'bi-shield-lock', label: 'Tài khoản', permission: 'users.manage' },
];

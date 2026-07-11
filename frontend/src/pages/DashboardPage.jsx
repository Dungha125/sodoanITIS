import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ title, value, icon, color = 'primary', suffix = '' }) {
  return (
    <div className="col-md-4 col-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center">
          <div className={`rounded-circle stat-card-icon p-3 me-3 ${color !== 'primary' ? `bg-${color} bg-opacity-10` : ''}`}>
            <i className={`bi ${icon} ${color === 'primary' ? '' : `text-${color}`} fs-4`}></i>
          </div>
          <div>
            <div className="text-muted small">{title}</div>
            <div className="fs-3 fw-bold">{value ?? 0}{suffix}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const isBiThu = user?.role_code === 'bi_thu';
  const stats = data?.type === 'department' ? data.data : data?.data;
  const period = data?.period;

  return (
    <div>
      <h4 className="mb-1">Trang chủ</h4>
      <p className="text-muted small mb-4">
        {isBiThu ? `Chi đoàn: ${stats?.name || '—'}` : `Khóa: ${stats?.cohort_name || '—'}`}
      </p>

      {period && (
        <div className={`alert ${period.is_open ? 'alert-success' : 'alert-warning'} py-2 small`}>
          <i className="bi bi-calendar-range me-1"></i>
          {period.is_open
            ? `Đang trong thời gian cập nhật: ${period.name} (${period.start_date} → ${period.end_date})`
            : `Ngoài thời gian cập nhật. Kỳ: ${period.name} (${period.start_date} → ${period.end_date})`}
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard title="Tổng đoàn viên" value={stats?.student_count ?? stats?.total_students} icon="bi-people" />
        <StatCard title="Đã nộp sổ" value={stats?.book_submitted} icon="bi-journal-check" color="success" />
        <StatCard title="Chưa nộp sổ" value={stats?.book_not_submitted} icon="bi-journal-x" color="warning" />
        <StatCard title="Đã nộp phí" value={stats?.fee_submitted} icon="bi-cash-coin" color="success" />
        <StatCard title="Chưa nộp phí" value={stats?.fee_not_submitted} icon="bi-cash" color="secondary" />
        <StatCard
          title={isBiThu ? 'Hoàn thành nộp sổ' : 'Tỷ lệ hoàn thành'}
          value={isBiThu ? stats?.book_completion_rate : stats?.completion_rate}
          icon="bi-percent"
          color="info"
          suffix="%"
        />
        {isBiThu && (
          <StatCard title="Hoàn thành nộp phí" value={stats?.fee_completion_rate} icon="bi-percent" color="primary" suffix="%" />
        )}
        {!isBiThu && data?.type === 'overview' && (
          <StatCard title="Tổng Chi đoàn" value={stats?.total_departments} icon="bi-diagram-3" color="primary" />
        )}
      </div>

      {isBiThu && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <p className="mb-2">Vào <strong>Đoàn viên</strong> để cập nhật trạng thái nộp sổ và nộp phí cho từng đoàn viên.</p>
            <Link to="/students" className="btn btn-danger btn-sm">Quản lý đoàn viên</Link>
          </div>
        </div>
      )}
    </div>
  );
}

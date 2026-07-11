import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, cohortsApi, departmentsApi, lienChiApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SetupGuide from '../components/common/SetupGuide';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const { data: cohorts } = useQuery({
    queryKey: ['cohorts'],
    queryFn: () => cohortsApi.list().then((r) => r.data),
    enabled: user?.role_code !== 'bi_thu',
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
    enabled: user?.role_code !== 'bi_thu',
  });

  const { data: lienChi } = useQuery({
    queryKey: ['lien-chi-all'],
    queryFn: () => lienChiApi.listAll().then((r) => r.data),
    enabled: user?.role_code === 'super_admin',
  });

  if (isLoading) return <LoadingSpinner />;

  const isBiThu = user?.role_code === 'bi_thu';
  const stats = data?.type === 'department' ? data.data : data?.data;
  const period = data?.period;

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${user?.full_name?.split(' ').pop() || 'bạn'}`}
        subtitle={isBiThu ? `Chi đoàn: ${stats?.name || '—'}` : `Khóa: ${stats?.cohort_name || '—'}`}
      />

      {user?.role_code !== 'bi_thu' && (
        <SetupGuide cohorts={cohorts} departments={departments} lienChi={lienChi} />
      )}

      {period && (
        <div className={`period-banner ${period.is_open ? 'open' : 'closed'}`}>
          <i className="bi bi-calendar-range"></i>
          <span>
            {period.is_open
              ? `Đang mở cập nhật: ${period.name} (${period.start_date} → ${period.end_date})`
              : `Ngoài kỳ cập nhật: ${period.name} (${period.start_date} → ${period.end_date})`}
          </span>
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard title="Tổng đoàn viên" value={stats?.student_count ?? stats?.total_students} icon="bi-people" />
        <StatCard title="Đã nộp sổ" value={stats?.book_submitted} icon="bi-journal-check" color="success" />
        <StatCard title="Chưa nộp sổ" value={stats?.book_not_submitted} icon="bi-journal-x" color="warning" />
        <StatCard title="Đã nộp phí" value={stats?.fee_submitted} icon="bi-cash-coin" color="success" />
        <StatCard title="Chưa nộp phí" value={stats?.fee_not_submitted} icon="bi-cash-stack" color="secondary" />
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
        <div className="data-card card border-0 shadow-sm p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h6 className="fw-semibold mb-1">Cập nhật trạng thái đoàn viên</h6>
              <p className="text-muted small mb-0">Đánh dấu nộp sổ / nộp phí cho từng đoàn viên trong Chi đoàn.</p>
            </div>
            <Link to="/students" className="btn btn-primary">
              <i className="bi bi-people me-1"></i> Quản lý đoàn viên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

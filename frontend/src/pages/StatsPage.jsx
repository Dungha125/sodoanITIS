import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cohortsApi, statsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import DataTableCard from '../components/common/DataTableCard';
import EmptyState from '../components/common/EmptyState';

export default function StatsPage() {
  const { data: cohorts, isLoading: loadingCohorts } = useQuery({
    queryKey: ['cohorts'],
    queryFn: () => cohortsApi.list().then((r) => r.data),
  });
  const [cohortId, setCohortId] = useState('');

  const selectedId = cohortId || cohorts?.[0]?.id;
  const { data, isLoading } = useQuery({
    queryKey: ['stats-cohort', selectedId],
    queryFn: () => statsApi.cohort(selectedId).then((r) => r.data),
    enabled: !!selectedId,
  });

  if (loadingCohorts) return <LoadingSpinner />;
  const overview = data?.overview;

  return (
    <div>
      <PageHeader
        title="Thống kê"
        subtitle={overview ? `Khóa ${overview.cohort_name}` : 'Theo dõi tiến độ nộp sổ và phí theo khóa'}
      >
        <select
          className="form-select form-select-sm"
          style={{ minWidth: 160 }}
          value={selectedId || ''}
          onChange={(e) => setCohortId(e.target.value)}
        >
          {(cohorts || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </PageHeader>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="row g-3 mb-4">
            <StatCard title="Tổng Chi đoàn" value={overview?.total_departments} icon="bi-diagram-3" />
            <StatCard title="Tổng đoàn viên" value={overview?.total_students} icon="bi-people" />
            <StatCard title="Đã nộp sổ" value={overview?.book_submitted} icon="bi-journal-check" color="success" />
            <StatCard title="Chưa nộp sổ" value={overview?.book_not_submitted} icon="bi-journal-x" color="warning" />
            <StatCard title="Đã nộp phí" value={overview?.fee_submitted} icon="bi-cash-coin" color="success" />
            <StatCard title="Tỷ lệ hoàn thành" value={overview?.completion_rate} icon="bi-percent" color="info" suffix="%" />
          </div>

          <DataTableCard title="Chi tiết theo Chi đoàn">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Chi đoàn</th><th>Khóa</th><th>Sĩ số</th>
                  <th>Nộp sổ</th><th>Nộp phí</th><th>Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {(data?.departments || []).length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon="bi-bar-chart" title="Chưa có dữ liệu thống kê" /></td></tr>
                ) : (data?.departments || []).map((d) => (
                  <tr key={d.id}>
                    <td className="fw-medium">{d.name}</td>
                    <td><span className="badge bg-light text-dark border">{d.cohort_name}</span></td>
                    <td>{d.student_count}</td>
                    <td>
                      <span className="text-success">{d.book_submitted}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-warning">{d.book_not_submitted}</span>
                    </td>
                    <td>
                      <span className="text-success">{d.fee_submitted}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-muted">{d.fee_not_submitted}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="completion-bar flex-grow-1">
                          <div className="completion-bar-fill" style={{ width: `${d.completion_rate}%` }}></div>
                        </div>
                        <span className="small fw-semibold">{d.completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableCard>
        </>
      )}
    </div>
  );
}

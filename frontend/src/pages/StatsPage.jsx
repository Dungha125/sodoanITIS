import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cohortsApi, statsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

function StatCard({ title, value, suffix = '' }) {
  return (
    <div className="col-md-4 col-6">
      <div className="card border-0 shadow-sm p-3 text-center h-100">
        <div className="text-muted small">{title}</div>
        <div className="fs-4 fw-bold">{value ?? 0}{suffix}</div>
      </div>
    </div>
  );
}

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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">Thống kê</h4>
        <select className="form-select form-select-sm" style={{ maxWidth: 200 }} value={selectedId || ''} onChange={(e) => setCohortId(e.target.value)}>
          {(cohorts || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <p className="text-muted small">Khóa <strong>{overview?.cohort_name}</strong></p>
          <div className="row g-3 mb-4">
            <StatCard title="Tổng Chi đoàn" value={overview?.total_departments} />
            <StatCard title="Tổng đoàn viên" value={overview?.total_students} />
            <StatCard title="Đã nộp sổ" value={overview?.book_submitted} />
            <StatCard title="Chưa nộp sổ" value={overview?.book_not_submitted} />
            <StatCard title="Đã nộp phí" value={overview?.fee_submitted} />
            <StatCard title="Chưa nộp phí" value={overview?.fee_not_submitted} />
            <StatCard title="Tỷ lệ hoàn thành" value={overview?.completion_rate} suffix="%" />
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent"><strong>Theo Chi đoàn</strong></div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Chi đoàn</th><th>Khóa</th><th>Sĩ số</th>
                    <th>Đã nộp sổ</th><th>Chưa nộp sổ</th>
                    <th>Đã nộp phí</th><th>Chưa nộp phí</th><th>Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.departments || []).map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.cohort_name}</td>
                      <td>{d.student_count}</td>
                      <td className="text-success">{d.book_submitted}</td>
                      <td className="text-warning">{d.book_not_submitted}</td>
                      <td className="text-success">{d.fee_submitted}</td>
                      <td className="text-muted">{d.fee_not_submitted}</td>
                      <td><span className="badge bg-primary">{d.completion_rate}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

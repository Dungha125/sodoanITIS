import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-summary'],
    queryFn: () => reportsApi.summary().then((r) => r.data),
  });

  const download = async (type) => {
    const fn = type === 'excel' ? reportsApi.exportExcel : reportsApi.exportPdf;
    const { data: blob } = await fn();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'excel' ? 'bao_cao.xlsx' : 'bao_cao.pdf';
    a.click();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Báo cáo</h4>
        <div className="btn-group">
          <button className="btn btn-outline-success btn-sm" onClick={() => download('excel')}>
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => download('pdf')}>
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent">Tổng hợp: {data?.total} sổ</div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr><th>Mã sổ</th><th>MSSV</th><th>Họ tên</th><th>Chi đoàn</th><th>Khóa</th><th>Trạng thái</th><th>Kho</th></tr>
            </thead>
            <tbody>
              {(data?.items || []).slice(0, 100).map((item, i) => (
                <tr key={i}>
                  <td><code>{item.book_code}</code></td>
                  <td>{item.student_mssv}</td>
                  <td>{item.student_name}</td>
                  <td>{item.department}</td>
                  <td>{item.cohort}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h4 className="mb-4">Lịch sử hệ thống</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr><th>Thời gian</th><th>Hành động</th><th>Entity</th><th>IP</th><th>Thiết bị</th></tr>
            </thead>
            <tbody>
              {(data?.items || []).map((log) => (
                <tr key={log.id}>
                  <td className="small">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                  <td><code>{log.action}</code></td>
                  <td>{log.entity_type} #{log.entity_id}</td>
                  <td>{log.ip_address || '—'}</td>
                  <td className="small text-truncate" style={{ maxWidth: 200 }}>{log.device || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

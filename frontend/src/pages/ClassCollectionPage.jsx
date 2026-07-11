import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { campaignsApi } from '../api';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { COLLECTION_STATUSES } from '../utils/constants';

const STATUS_BADGE = {
  pending: 'secondary',
  chi_doan_collected: 'primary',
  submitted: 'warning',
  lien_chi_received: 'success',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chưa thu' },
  { value: 'chi_doan_collected', label: 'Chi đoàn đã thu sổ' },
  { value: 'submitted', label: 'Đã nộp Liên chi' },
  { value: 'lien_chi_received', label: 'Liên chi tiếp nhận sổ' },
];

function statusOptionsForRole(roleCode) {
  if (roleCode === 'lien_chi_doan' || roleCode === 'super_admin') return STATUS_OPTIONS;
  if (['bi_thu', 'pho_bi_thu'].includes(roleCode)) {
    return STATUS_OPTIONS.filter((o) => ['pending', 'chi_doan_collected'].includes(o.value));
  }
  return STATUS_OPTIONS;
}

export default function ClassCollectionPage() {
  const { campaignId, classId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canSubmit = usePermission('campaigns.submit');
  const canConfirm = usePermission('campaigns.confirm');
  const canStatus = usePermission('campaigns.status');

  const { data, isLoading } = useQuery({
    queryKey: ['class-collection', campaignId, classId],
    queryFn: () => campaignsApi.classCollection(campaignId, classId).then((r) => r.data),
  });

  const collectMut = useMutation({
    mutationFn: ({ studentId, collected }) => campaignsApi.collect(campaignId, { student_id: studentId, collected }),
    onSuccess: () => qc.invalidateQueries(['class-collection', campaignId, classId]),
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const submitMut = useMutation({
    mutationFn: () => campaignsApi.submitClass(campaignId, classId),
    onSuccess: (r) => {
      toast.success(r.data.message);
      qc.invalidateQueries(['class-collection', campaignId, classId]);
      qc.invalidateQueries(['campaigns']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi nộp'),
  });

  const confirmMut = useMutation({
    mutationFn: () => campaignsApi.confirmClass(campaignId, classId),
    onSuccess: (r) => {
      toast.success(`${r.data.message}. Thiếu: ${r.data.missing}`);
      qc.invalidateQueries(['class-collection', campaignId, classId]);
      qc.invalidateQueries(['campaigns']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi xác nhận'),
  });

  const statusMut = useMutation({
    mutationFn: ({ studentId, status }) => campaignsApi.updateStatus(campaignId, studentId, { status }),
    onSuccess: () => qc.invalidateQueries(['class-collection', campaignId, classId]),
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi cập nhật'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div className="alert alert-danger">Không tải được dữ liệu</div>;

  const isConfirmed = data.submission_status === 'confirmed';
  const canTick = !isConfirmed;
  const canEditStatus = canStatus && (!isConfirmed || user?.role_code === 'super_admin');
  const statusOptions = statusOptionsForRole(user?.role_code);

  return (
    <div>
      <div className="mb-4">
        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate('/classes')}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
        <h4 className="mb-1">Thu sổ — {data.class_name}</h4>
        <p className="text-muted small mb-0">{data.campaign_name} · {data.department_name}</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Tổng</div><div className="fs-4 fw-bold">{data.stats.total}</div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Chi đoàn đã thu</div><div className="fs-4 fw-bold text-primary">{data.stats.collected + data.stats.submitted + data.stats.received}</div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Đã nộp LC</div><div className="fs-4 fw-bold text-warning">{data.stats.submitted + data.stats.received}</div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">LC tiếp nhận</div><div className="fs-4 fw-bold text-success">{data.stats.received}</div></div></div>
      </div>

      {isConfirmed && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          Liên chi đã xác nhận. Còn thiếu: <strong>{data.stats.pending + data.stats.collected}</strong> đoàn viên.
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex justify-content-between align-items-center flex-wrap gap-2">
          <strong>Danh sách đoàn viên</strong>
          <div className="d-flex gap-2 flex-wrap">
            {canSubmit && canTick && !data.submission_status && data.stats.collected > 0 && (
              <button className="btn btn-sm btn-primary" disabled={submitMut.isPending} onClick={() => { if (confirm('Nộp sổ đã thu cho Liên chi?')) submitMut.mutate(); }}>
                <i className="bi bi-send me-1"></i> Nộp cho Liên chi ({data.stats.collected})
              </button>
            )}
            {data.submission_status === 'pending' && (
              <span className="badge bg-warning align-self-center">Chờ Liên chi xác nhận</span>
            )}
            {canConfirm && data.submission_status === 'pending' && (
              <button className="btn btn-sm btn-success" disabled={confirmMut.isPending} onClick={() => { if (confirm('Xác nhận Liên chi tiếp nhận sổ lớp này?')) confirmMut.mutate(); }}>
                <i className="bi bi-check2-square me-1"></i> LC tiếp nhận
              </button>
            )}
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 50 }}>Thu</th>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Trạng thái</th>
                {canEditStatus && <th style={{ width: 200 }}>Cập nhật</th>}
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.student_id}>
                  <td>
                    <PermissionGate permission="campaigns.collect">
                      {canTick && (
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={s.status === 'chi_doan_collected'}
                          disabled={(s.status !== 'pending' && s.status !== 'chi_doan_collected') || collectMut.isPending}
                          onChange={(e) => collectMut.mutate({ studentId: s.student_id, collected: e.target.checked })}
                        />
                      )}
                    </PermissionGate>
                  </td>
                  <td><code>{s.mssv}</code></td>
                  <td>{s.full_name}</td>
                  <td>
                    <span className={`badge bg-${STATUS_BADGE[s.status] || 'secondary'}`}>
                      {COLLECTION_STATUSES[s.status]?.label || s.status_label}
                    </span>
                  </td>
                  {canEditStatus && (
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={s.status}
                        disabled={statusMut.isPending}
                        onChange={(e) => statusMut.mutate({ studentId: s.student_id, status: e.target.value })}
                      >
                        {statusOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { cohortsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CohortsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [showInactive, setShowInactive] = useState(true);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['cohorts-manage'],
    queryFn: () => cohortsApi.listManage().then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id ? cohortsApi.update(modal.id, payload) : cohortsApi.create(payload),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Thêm khóa thành công');
      qc.invalidateQueries(['cohorts-manage']);
      qc.invalidateQueries(['cohorts']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => cohortsApi.delete(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa khóa');
      qc.invalidateQueries(['cohorts-manage']);
      qc.invalidateQueries(['cohorts']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể vô hiệu hóa'),
  });

  const restoreMut = useMutation({
    mutationFn: (id) => cohortsApi.restore(id),
    onSuccess: () => {
      toast.success('Đã khôi phục khóa');
      qc.invalidateQueries(['cohorts-manage']);
      qc.invalidateQueries(['cohorts']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể khôi phục'),
  });

  if (isLoading) return <LoadingSpinner />;

  const rows = (data || []).filter((c) => showInactive || c.is_active);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-1">Quản lý Khóa</h4>
          <p className="text-muted small mb-0">Vô hiệu hóa có thể khôi phục. Tạo lại tên khóa cũ sẽ tự kích hoạt lại.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm khóa
        </button>
      </div>

      <div className="form-check form-switch mb-3">
        <input className="form-check-input" type="checkbox" id="showInactive" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        <label className="form-check-label" htmlFor="showInactive">Hiện khóa đã vô hiệu hóa</label>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Tên khóa</th><th>Số Chi đoàn</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted py-4">Chưa có khóa</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className={!c.is_active ? 'text-muted' : ''}>
                <td><strong>{c.name}</strong></td>
                <td>{c.department_count}</td>
                <td>
                  <span className={`badge bg-${c.is_active ? 'success' : 'secondary'}`}>
                    {c.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td className="text-nowrap">
                  {c.is_active ? (
                    <>
                      <button className="btn btn-sm btn-outline-secondary me-1" title="Sửa" onClick={() => { setModal(c); setValue('name', c.name); }}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        title="Vô hiệu hóa"
                        onClick={() => { if (confirm(`Vô hiệu hóa khóa ${c.name}?`)) deactivateMut.mutate(c.id); }}
                      >
                        <i className="bi bi-pause-circle"></i>
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => restoreMut.mutate(c.id)}
                      disabled={restoreMut.isPending}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i> Khôi phục
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => saveMut.mutate(d))}>
                <div className="modal-header">
                  <h5>{modal.id ? 'Sửa khóa' : 'Thêm khóa'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">Tên khóa (VD: D25, D26)</label>
                  <input className="form-control" placeholder="D25" {...register('name', { required: true })} />
                  {!modal.id && (
                    <p className="form-text small">Nếu khóa đã bị vô hiệu hóa trước đó, tạo cùng tên sẽ tự khôi phục.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

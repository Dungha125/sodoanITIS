import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { periodsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import DataTableCard from '../components/common/DataTableCard';
import EmptyState from '../components/common/EmptyState';
import AppModal from '../components/common/AppModal';

export default function PeriodsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [showInactive, setShowInactive] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.list().then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => periodsApi.create(payload),
    onSuccess: () => {
      toast.success('Tạo kỳ cập nhật thành công');
      qc.invalidateQueries(['periods']);
      qc.invalidateQueries(['dashboard-stats']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => periodsApi.delete(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa kỳ');
      qc.invalidateQueries(['periods']);
      qc.invalidateQueries(['dashboard-stats']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const restoreMut = useMutation({
    mutationFn: (id) => periodsApi.restore(id),
    onSuccess: () => {
      toast.success('Đã khôi phục kỳ');
      qc.invalidateQueries(['periods']);
      qc.invalidateQueries(['dashboard-stats']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  if (isLoading) return <LoadingSpinner />;

  const rows = (data || []).filter((p) => showInactive || p.is_active);

  return (
    <div>
      <PageHeader
        title="Kỳ cập nhật"
        subtitle="Bí thư chỉ cập nhật nộp sổ/phí trong khoảng thời gian đang mở."
      >
        <button className="btn btn-primary" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm kỳ
        </button>
      </PageHeader>

      <DataTableCard
        toolbar={
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="showInactivePeriods" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            <label className="form-check-label small" htmlFor="showInactivePeriods">Hiện kỳ vô hiệu hóa</label>
          </div>
        }
      >
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Tên</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="bi-calendar-range" title="Chưa có kỳ cập nhật" /></td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className={!p.is_active ? 'text-muted' : ''}>
                <td>{p.name}</td>
                <td>{p.start_date}</td>
                <td>{p.end_date}</td>
                <td>
                  {!p.is_active
                    ? <span className="badge bg-secondary">Vô hiệu hóa</span>
                    : p.is_open
                      ? <span className="badge bg-success">Đang mở</span>
                      : <span className="badge bg-warning text-dark">Chưa/đã hết hạn</span>}
                </td>
                <td className="text-nowrap">
                  {p.is_active ? (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      title="Vô hiệu hóa"
                      onClick={() => { if (confirm(`Vô hiệu hóa kỳ "${p.name}"?`)) deactivateMut.mutate(p.id); }}
                    >
                      <i className="bi bi-pause-circle"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => restoreMut.mutate(p.id)}
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
      </DataTableCard>

      {modal && (
        <AppModal
          title="Thêm kỳ cập nhật"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-light" onClick={() => setModal(null)}>Hủy</button>
              <button type="submit" form="period-form" className="btn btn-primary">Lưu</button>
            </>
          }
        >
          <form id="period-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="row g-3">
            <div className="col-12">
              <label className="form-label">Tên kỳ</label>
              <input className="form-control" placeholder="Kỳ 1/2026" {...register('name', { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Ngày bắt đầu</label>
              <input type="date" className="form-control" {...register('start_date', { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Ngày kết thúc</label>
              <input type="date" className="form-control" {...register('end_date', { required: true })} />
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
}

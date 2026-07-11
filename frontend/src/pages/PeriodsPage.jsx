import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { periodsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PeriodsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.list().then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => periodsApi.create(payload),
    onSuccess: () => {
      toast.success('Tạo khoảng thời gian thành công');
      qc.invalidateQueries(['periods']);
      qc.invalidateQueries(['dashboard-stats']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Thời gian cập nhật trạng thái</h4>
          <p className="text-muted small mb-0">Bí thư chỉ cập nhật nộp sổ/phí trong khoảng thời gian đang mở</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm kỳ
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Tên</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.start_date}</td>
                <td>{p.end_date}</td>
                <td>
                  {p.is_open
                    ? <span className="badge bg-success">Đang mở</span>
                    : <span className="badge bg-secondary">{p.is_active ? 'Chưa/đã hết hạn' : 'Ngừng'}</span>}
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
                  <h5>Thêm kỳ cập nhật</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Tên kỳ</label>
                    <input className="form-control" {...register('name', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày bắt đầu</label>
                    <input type="date" className="form-control" {...register('start_date', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày kết thúc</label>
                    <input type="date" className="form-control" {...register('end_date', { required: true })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-danger">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

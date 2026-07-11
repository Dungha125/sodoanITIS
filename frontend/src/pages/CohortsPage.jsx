import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { cohortsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CohortsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['cohorts'],
    queryFn: () => cohortsApi.list().then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id ? cohortsApi.update(modal.id, payload) : cohortsApi.create(payload),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Thêm khóa thành công');
      qc.invalidateQueries(['cohorts']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => cohortsApi.delete(id),
    onSuccess: () => { toast.success('Đã vô hiệu hóa'); qc.invalidateQueries(['cohorts']); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể xóa'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Quản lý Khóa</h4>
        <button className="btn btn-danger btn-sm" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm khóa
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Tên khóa</th><th>Số Chi đoàn</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {(data || []).map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.department_count}</td>
                <td><span className={`badge bg-${c.is_active ? 'success' : 'secondary'}`}>{c.is_active ? 'Hoạt động' : 'Ngừng'}</span></td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => { setModal(c); setValue('name', c.name); }}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => { if (confirm('Vô hiệu hóa khóa?')) deleteMut.mutate(c.id); }}><i className="bi bi-trash"></i></button>
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

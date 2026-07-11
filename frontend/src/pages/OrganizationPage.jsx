import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { lienChiApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OrganizationPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: lienChiList, isLoading } = useQuery({
    queryKey: ['lien-chi-all'],
    queryFn: () => lienChiApi.listAll().then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? lienChiApi.update(modal.id, payload)
      : lienChiApi.create(payload),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Tạo Liên chi thành công');
      qc.invalidateQueries(['lien-chi-all']);
      qc.invalidateQueries(['lien-chi']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => lienChiApi.delete(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa Liên chi');
      qc.invalidateQueries(['lien-chi-all']);
      qc.invalidateQueries(['lien-chi']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Quản lý Liên chi</h4>
          <p className="text-muted small mb-0">
            Tạo Liên chi trước, sau đó tạo <Link to="/cohorts">Khóa</Link> và <Link to="/departments">Chi đoàn</Link>.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Tạo Liên chi
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Tên</th><th>Mã</th><th>Số Chi đoàn</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {(lienChiList || []).map((lc) => (
              <tr key={lc.id} className={!lc.is_active ? 'text-muted' : ''}>
                <td>{lc.name}</td>
                <td><code>{lc.code}</code></td>
                <td>{lc.department_count}</td>
                <td>
                  <span className={`badge bg-${lc.is_active ? 'success' : 'secondary'}`}>
                    {lc.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => { setModal(lc); reset({ name: lc.name, code: lc.code }); }}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  {lc.is_active && (
                    <button className="btn btn-sm btn-outline-warning" onClick={() => { if (confirm('Vô hiệu hóa Liên chi?')) deactivateMut.mutate(lc.id); }}>
                      <i className="bi bi-pause-circle"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!(lienChiList || []).length && (
              <tr><td colSpan={5} className="text-center text-muted py-4">Chưa có Liên chi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => saveMut.mutate({ ...d, code: d.code.toUpperCase() }))}>
                <div className="modal-header">
                  <h5>{modal.id ? 'Sửa Liên chi' : 'Tạo Liên chi'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên Liên chi</label>
                    <input className="form-control" {...register('name', { required: true })} placeholder="Liên Chi Đoàn Khoa CNTT" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mã (viết hoa, không dấu)</label>
                    <input className="form-control" {...register('code', { required: true })} placeholder="LCD_CNTT" disabled={!!modal.id} />
                  </div>
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { lienChiApi, departmentsApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OrganizationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('lien-chi');
  const [lcModal, setLcModal] = useState(null);
  const [deptModal, setDeptModal] = useState(null);
  const { register: lcReg, handleSubmit: lcSubmit, reset: lcReset } = useForm();
  const { register: deptReg, handleSubmit: deptSubmit, reset: deptReset } = useForm();

  const { data: lienChiList, isLoading: lcLoading } = useQuery({
    queryKey: ['lien-chi-all'],
    queryFn: () => lienChiApi.listAll().then((r) => r.data),
  });

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.listAll().then((r) => r.data),
  });

  const lcSave = useMutation({
    mutationFn: (payload) => lcModal?.id
      ? lienChiApi.update(lcModal.id, payload)
      : lienChiApi.create(payload),
    onSuccess: () => {
      toast.success(lcModal?.id ? 'Cập nhật Liên chi thành công' : 'Tạo Liên chi thành công');
      qc.invalidateQueries(['lien-chi-all']);
      qc.invalidateQueries(['lien-chi']);
      setLcModal(null);
      lcReset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi lưu Liên chi'),
  });

  const lcDelete = useMutation({
    mutationFn: (id) => lienChiApi.delete(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa Liên chi');
      qc.invalidateQueries(['lien-chi-all']);
      qc.invalidateQueries(['lien-chi']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const deptSave = useMutation({
    mutationFn: (payload) => deptModal?.id
      ? departmentsApi.update(deptModal.id, payload)
      : departmentsApi.create(payload),
    onSuccess: () => {
      toast.success(deptModal?.id ? 'Cập nhật Chi đoàn thành công' : 'Tạo Chi đoàn thành công');
      qc.invalidateQueries(['departments-all']);
      qc.invalidateQueries(['departments']);
      setDeptModal(null);
      deptReset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi lưu Chi đoàn'),
  });

  const deptDelete = useMutation({
    mutationFn: (id) => departmentsApi.delete(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa Chi đoàn');
      qc.invalidateQueries(['departments-all']);
      qc.invalidateQueries(['departments']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const openLcCreate = () => {
    setLcModal({});
    lcReset({ name: '', code: '' });
  };

  const openLcEdit = (lc) => {
    setLcModal(lc);
    lcReset({ name: lc.name, code: lc.code });
  };

  const openDeptCreate = (lienChiId = '') => {
    setDeptModal({});
    deptReset({ name: '', code: '', faculty: '', lien_chi_id: lienChiId });
  };

  const openDeptEdit = (d) => {
    setDeptModal(d);
    deptReset({
      name: d.name,
      code: d.code,
      faculty: d.faculty || '',
      lien_chi_id: d.lien_chi_id || '',
    });
  };

  if (lcLoading || deptLoading) return <LoadingSpinner />;

  const activeLienChi = (lienChiList || []).filter((lc) => lc.is_active);

  return (
    <div>
      <div className="mb-4">
        <h4 className="mb-1">Quản lý tổ chức</h4>
        <p className="text-muted small mb-0">Tạo Liên chi đoàn, sau đó tạo Chi đoàn thuộc từng Liên chi</p>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'lien-chi' ? 'active' : ''}`} onClick={() => setTab('lien-chi')}>
            Liên Chi đoàn
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'chi-doan' ? 'active' : ''}`} onClick={() => setTab('chi-doan')}>
            Chi đoàn
          </button>
        </li>
      </ul>

      {tab === 'lien-chi' && (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary btn-sm" onClick={openLcCreate}>
              <i className="bi bi-plus-lg me-1"></i> Tạo Liên chi
            </button>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tên</th><th>Mã</th><th>Số Chi đoàn</th><th>Trạng thái</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {(lienChiList || []).map((lc) => (
                    <tr key={lc.id} className={!lc.is_active ? 'text-muted' : ''}>
                      <td>{lc.name}</td>
                      <td><code>{lc.code}</code></td>
                      <td>{lc.department_count}</td>
                      <td>
                        <span className={`badge bg-${lc.is_active ? 'success' : 'secondary'}`}>
                          {lc.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openLcEdit(lc)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        {lc.is_active && (
                          <>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setTab('chi-doan'); openDeptCreate(lc.id); }}>
                              <i className="bi bi-plus"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-dark" onClick={() => { if (confirm('Vô hiệu hóa Liên chi?')) lcDelete.mutate(lc.id); }}>
                              <i className="bi bi-slash-circle"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!(lienChiList || []).length && (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Chưa có Liên chi — hãy tạo mới</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'chi-doan' && (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary btn-sm" onClick={() => openDeptCreate()} disabled={!activeLienChi.length}>
              <i className="bi bi-plus-lg me-1"></i> Tạo Chi đoàn
            </button>
          </div>
          {!activeLienChi.length && (
            <div className="alert alert-info">Tạo Liên chi trước khi thêm Chi đoàn.</div>
          )}
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tên</th><th>Mã</th><th>Liên chi</th><th>Khoa</th><th>Trạng thái</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {(departments || []).map((d) => (
                    <tr key={d.id} className={!d.is_active ? 'text-muted' : ''}>
                      <td>{d.name}</td>
                      <td><code>{d.code}</code></td>
                      <td>{d.lien_chi_name || '—'}</td>
                      <td>{d.faculty || '—'}</td>
                      <td>
                        <span className={`badge bg-${d.is_active ? 'success' : 'secondary'}`}>
                          {d.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openDeptEdit(d)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        {d.is_active && (
                          <button className="btn btn-sm btn-outline-dark" onClick={() => { if (confirm('Vô hiệu hóa Chi đoàn?')) deptDelete.mutate(d.id); }}>
                            <i className="bi bi-slash-circle"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!(departments || []).length && (
                    <tr><td colSpan="6" className="text-center text-muted py-4">Chưa có Chi đoàn</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {lcModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={lcSubmit((d) => lcSave.mutate({ ...d, code: d.code.toUpperCase() }))}>
                <div className="modal-header">
                  <h5>{lcModal.id ? 'Sửa Liên chi' : 'Tạo Liên chi mới'}</h5>
                  <button type="button" className="btn-close" onClick={() => setLcModal(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên Liên chi</label>
                    <input className="form-control" {...lcReg('name', { required: true })} placeholder="Liên Chi Đoàn Khoa CNTT" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mã (viết hoa, không dấu)</label>
                    <input className="form-control" {...lcReg('code', { required: true })} placeholder="LCD_CNTT" disabled={!!lcModal.id} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setLcModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deptModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={deptSubmit((d) => deptSave.mutate({
                ...d,
                code: d.code.toUpperCase(),
                lien_chi_id: +d.lien_chi_id,
                faculty: d.faculty || null,
              }))}>
                <div className="modal-header">
                  <h5>{deptModal.id ? 'Sửa Chi đoàn' : 'Tạo Chi đoàn mới'}</h5>
                  <button type="button" className="btn-close" onClick={() => setDeptModal(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Liên Chi đoàn</label>
                    <select className="form-select" {...deptReg('lien_chi_id', { required: true })}>
                      <option value="">Chọn Liên chi</option>
                      {activeLienChi.map((lc) => (
                        <option key={lc.id} value={lc.id}>{lc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tên Chi đoàn</label>
                    <input className="form-control" {...deptReg('name', { required: true })} placeholder="Chi đoàn CNTT" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mã (viết hoa, không dấu)</label>
                    <input className="form-control" {...deptReg('code', { required: true })} placeholder="CNTT" disabled={!!deptModal.id} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Khoa (tuỳ chọn)</label>
                    <input className="form-control" {...deptReg('faculty')} placeholder="Khoa CNTT" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setDeptModal(null)}>Hủy</button>
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

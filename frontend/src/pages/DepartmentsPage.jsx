import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { departmentsApi, cohortsApi, studentsApi, lienChiApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef();
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [importDept, setImportDept] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: cohorts } = useQuery({
    queryKey: ['cohorts'],
    queryFn: () => cohortsApi.list().then((r) => r.data),
  });

  const { data: lienChiList } = useQuery({
    queryKey: ['lien-chi'],
    queryFn: () => lienChiApi.list().then((r) => r.data),
    enabled: user?.role_code === 'super_admin',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['department-detail', detail],
    queryFn: () => departmentsApi.get(detail).then((r) => r.data),
    enabled: !!detail,
  });

  const { data: deptStudents } = useQuery({
    queryKey: ['students-dept', detail],
    queryFn: () => studentsApi.list({ department_id: detail, size: 100 }).then((r) => r.data),
    enabled: !!detail,
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? departmentsApi.update(modal.id, payload)
      : departmentsApi.create({ ...payload, cohort_id: +payload.cohort_id }),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Thêm mới Chi đoàn thành công');
      qc.invalidateQueries(['departments']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const importMut = useMutation({
    mutationFn: ({ deptId, file }) => departmentsApi.importStudents(deptId, file),
    onSuccess: (r) => {
      toast.success(`Import: ${r.data.imported} thành công, ${r.data.skipped} bỏ qua`);
      qc.invalidateQueries(['students']);
      qc.invalidateQueries(['department-detail']);
      setImportDept(null);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi import'),
  });

  const openEdit = (d) => {
    setModal(d);
    setValue('name', d.name);
    setValue('secretary_name', d.secretary_name);
    setValue('secretary_phone', d.secretary_phone);
    setValue('secretary_email', d.secretary_email);
  };

  if (isLoading) return <LoadingSpinner />;

  if (detail) {
    const d = detailData;
    return (
      <div>
        <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setDetail(null)}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
        {loadingDetail ? <LoadingSpinner /> : (
          <>
            <h4 className="mb-1">{d?.name}</h4>
            <p className="text-muted small">Khóa {d?.cohort_name} · Bí thư: {d?.secretary_name} · {d?.secretary_phone}</p>
            <div className="row g-3 mb-4">
              <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Sĩ số</div><div className="fs-4 fw-bold">{d?.student_count}</div></div></div>
              <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Đã nộp sổ</div><div className="fs-4 fw-bold text-success">{d?.book_submitted}</div></div></div>
              <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Đã nộp phí</div><div className="fs-4 fw-bold text-primary">{d?.fee_submitted}</div></div></div>
              <div className="col-md-3"><div className="card border-0 shadow-sm p-3 text-center"><div className="text-muted small">Hoàn thành</div><div className="fs-4 fw-bold">{d?.completion_rate}%</div></div></div>
            </div>
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent d-flex justify-content-between">
                <strong>Danh sách đoàn viên</strong>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setImportDept(detail)}>
                  <i className="bi bi-upload me-1"></i> Import Excel
                </button>
              </div>
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr><th>MSSV</th><th>Họ tên</th><th>Giới tính</th><th>Ngày sinh</th><th>SĐT</th><th>Nộp sổ</th><th>Nộp phí</th></tr>
                </thead>
                <tbody>
                  {(deptStudents?.items || []).map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.mssv}</code></td>
                      <td>{s.full_name}</td>
                      <td>{s.gender || '—'}</td>
                      <td>{s.date_of_birth || '—'}</td>
                      <td>{s.phone || '—'}</td>
                      <td><span className={`badge bg-${s.book_submitted ? 'success' : 'secondary'}`}>{s.book_status_label}</span></td>
                      <td><span className={`badge bg-${s.fee_submitted ? 'success' : 'secondary'}`}>{s.fee_status_label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {importDept && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header"><h5>Import đoàn viên (Excel)</h5><button className="btn-close" onClick={() => setImportDept(null)}></button></div>
                <div className="modal-body">
                  <p className="small text-muted">Cột: MSSV | Họ tên | Ngày sinh | Giới tính | SĐT</p>
                  <input type="file" className="form-control" accept=".xlsx,.xls" ref={fileRef} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setImportDept(null)}>Hủy</button>
                  <button className="btn btn-danger" onClick={() => {
                    const file = fileRef.current?.files?.[0];
                    if (!file) return toast.error('Chọn file Excel');
                    importMut.mutate({ deptId: importDept, file });
                  }}>Import</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Quản lý Chi đoàn</h4>
        <button className="btn btn-danger btn-sm" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm Chi đoàn
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Chi đoàn</th><th>Khóa</th><th>Bí thư</th><th>Sĩ số</th><th></th></tr>
          </thead>
          <tbody>
            {(data || []).map((d) => (
              <tr key={d.id}>
                <td><button className="btn btn-link p-0" onClick={() => setDetail(d.id)}>{d.name}</button></td>
                <td>{d.cohort_name || '—'}</td>
                <td>{d.secretary_name || '—'}</td>
                <td>{d.student_count}</td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(d)}><i className="bi bi-pencil"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => saveMut.mutate(d))}>
                <div className="modal-header">
                  <h5>{modal.id ? 'Sửa Chi đoàn' : 'Thêm Chi đoàn'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tên Chi đoàn *</label>
                    <input className="form-control" {...register('name', { required: true })} />
                  </div>
                  {!modal.id && user?.role_code === 'super_admin' && (
                    <div className="col-md-6">
                      <label className="form-label">Liên chi *</label>
                      <select className="form-select" {...register('lien_chi_id', { required: true })}>
                        <option value="">Chọn Liên chi</option>
                        {(lienChiList || []).map((lc) => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
                      </select>
                    </div>
                  )}
                  {!modal.id && (
                    <div className="col-md-6">
                      <label className="form-label">Khóa *</label>
                      <select className="form-select" {...register('cohort_id', { required: true })}>
                        <option value="">Chọn khóa</option>
                        {(cohorts || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  {!modal.id && (
                    <div className="col-md-6">
                      <label className="form-label">MSV Bí thư *</label>
                      <input className="form-control" {...register('secretary_mssv', { required: true })} />
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Họ tên Bí thư *</label>
                    <input className="form-control" {...register('secretary_name', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SĐT Bí thư *</label>
                    <input className="form-control" {...register('secretary_phone', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Bí thư *</label>
                    <input type="email" className="form-control" {...register('secretary_email', { required: true })} />
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

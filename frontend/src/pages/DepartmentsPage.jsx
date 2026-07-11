import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { departmentsApi, cohortsApi, studentsApi, lienChiApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import DataTableCard from '../components/common/DataTableCard';
import EmptyState from '../components/common/EmptyState';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef();
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [importDept, setImportDept] = useState(null);
  const [addMemberDept, setAddMemberDept] = useState(null);
  const [selectedMssv, setSelectedMssv] = useState('');
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

  const { data: deptStudents, isLoading: loadingStudents, isError: studentsError } = useQuery({
    queryKey: ['students-dept', detail],
    queryFn: () => studentsApi.list({ department_id: detail, size: 200 }).then((r) => r.data),
    enabled: !!detail,
  });

  const { data: availableAccounts } = useQuery({
    queryKey: ['available-accounts'],
    queryFn: () => studentsApi.availableAccounts().then((r) => r.data),
    enabled: !!addMemberDept,
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
      qc.invalidateQueries(['students-dept']);
      qc.invalidateQueries(['department-detail']);
      qc.invalidateQueries(['departments']);
      qc.invalidateQueries(['available-accounts']);
      setImportDept(null);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi import'),
  });

  const addMemberMut = useMutation({
    mutationFn: ({ deptId, mssv }) => departmentsApi.addMember(deptId, mssv),
    onSuccess: () => {
      toast.success('Đã thêm đoàn viên vào Chi đoàn');
      qc.invalidateQueries(['students']);
      qc.invalidateQueries(['students-dept']);
      qc.invalidateQueries(['department-detail']);
      qc.invalidateQueries(['departments']);
      qc.invalidateQueries(['available-accounts']);
      setAddMemberDept(null);
      setSelectedMssv('');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể thêm đoàn viên'),
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
        <button type="button" className="back-link border-0 bg-transparent" onClick={() => setDetail(null)}>
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </button>
        {loadingDetail ? <LoadingSpinner /> : (
          <>
            <PageHeader
              title={d?.name}
              subtitle={`Khóa ${d?.cohort_name} · Bí thư: ${d?.secretary_name || '—'}`}
            />
            <div className="detail-stats">
              <div className="detail-stat-item"><div className="label">Sĩ số</div><div className="value">{d?.student_count}</div></div>
              <div className="detail-stat-item"><div className="label">Đã nộp sổ</div><div className="value text-success">{d?.book_submitted}</div></div>
              <div className="detail-stat-item"><div className="label">Đã nộp phí</div><div className="value text-primary">{d?.fee_submitted}</div></div>
              <div className="detail-stat-item"><div className="label">Hoàn thành</div><div className="value">{d?.completion_rate}%</div></div>
            </div>
            <DataTableCard
              title={`Đoàn viên (${deptStudents?.total ?? 0})`}
              toolbar={
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => setAddMemberDept(detail)}>
                    <i className="bi bi-person-plus me-1"></i> Thêm từ tài khoản
                  </button>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setImportDept(detail)}>
                    <i className="bi bi-upload me-1"></i> Import Excel
                  </button>
                </div>
              }
            >
              {loadingStudents ? <LoadingSpinner /> : studentsError ? (
                <div className="alert alert-danger m-3">Không tải được danh sách đoàn viên.</div>
              ) : (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr><th>MSSV</th><th>Họ tên</th><th>Giới tính</th><th>Ngày sinh</th><th>SĐT</th><th>Nộp sổ</th><th>Nộp phí</th></tr>
                </thead>
                <tbody>
                  {(deptStudents?.items || []).length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon="bi-people" title="Chưa có đoàn viên" description="Tạo tài khoản Đoàn viên trước, sau đó thêm vào Chi đoàn." /></td></tr>
                  ) : (deptStudents?.items || []).map((s) => (
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
              )}
            </DataTableCard>
          </>
        )}
        {importDept && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header"><h5>Import đoàn viên (Excel)</h5><button className="btn-close" onClick={() => setImportDept(null)}></button></div>
                <div className="modal-body">
                  <p className="small text-muted">Cột: MSSV | Họ tên | Ngày sinh | Giới tính | SĐT</p>
                  <p className="small text-warning"><i className="bi bi-exclamation-triangle me-1"></i>MSSV phải đã có tài khoản (vai trò Đoàn viên) trước khi import.</p>
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
        {addMemberDept && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Thêm đoàn viên từ tài khoản</h5>
                  <button className="btn-close" onClick={() => { setAddMemberDept(null); setSelectedMssv(''); }}></button>
                </div>
                <div className="modal-body">
                  <p className="small text-muted mb-3">Chỉ hiện tài khoản vai trò <strong>Đoàn viên</strong> chưa thuộc Chi đoàn nào.</p>
                  <label className="form-label">Chọn MSSV</label>
                  <select className="form-select" value={selectedMssv} onChange={(e) => setSelectedMssv(e.target.value)}>
                    <option value="">— Chọn đoàn viên —</option>
                    {(availableAccounts || []).map((a) => (
                      <option key={a.mssv} value={a.mssv}>{a.mssv} — {a.full_name}</option>
                    ))}
                  </select>
                  {!(availableAccounts || []).length && (
                    <p className="small text-warning mt-2 mb-0">Không có tài khoản khả dụng. Tạo tài khoản Đoàn viên ở menu Tài khoản trước.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => { setAddMemberDept(null); setSelectedMssv(''); }}>Hủy</button>
                  <button
                    className="btn btn-primary"
                    disabled={!selectedMssv || addMemberMut.isPending}
                    onClick={() => addMemberMut.mutate({ deptId: addMemberDept, mssv: selectedMssv })}
                  >
                    Thêm vào Chi đoàn
                  </button>
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
      <PageHeader title="Quản lý Chi đoàn" subtitle="Tạo Chi đoàn, thêm đoàn viên từ tài khoản hoặc import Excel.">
        <button className="btn btn-primary" onClick={() => { setModal({}); reset(); }}>
          <i className="bi bi-plus-lg me-1"></i> Thêm Chi đoàn
        </button>
      </PageHeader>

      <DataTableCard>
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr><th>Chi đoàn</th><th>Khóa</th><th>Bí thư</th><th>Sĩ số</th><th className="text-end">Thao tác</th></tr>
          </thead>
          <tbody>
            {(data || []).length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="bi-diagram-3" title="Chưa có Chi đoàn" /></td></tr>
            ) : (data || []).map((d) => (
              <tr key={d.id}>
                <td>
                  <button className="btn btn-link p-0 fw-medium text-decoration-none" onClick={() => setDetail(d.id)}>{d.name}</button>
                </td>
                <td><span className="badge bg-light text-dark border">{d.cohort_name || '—'}</span></td>
                <td>{d.secretary_name || '—'}</td>
                <td>{d.student_count}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(d)} title="Sửa"><i className="bi bi-pencil"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableCard>

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

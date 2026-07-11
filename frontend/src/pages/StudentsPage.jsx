import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { studentsApi, departmentsApi, periodsApi } from '../api';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import DataTableCard from '../components/common/DataTableCard';
import EmptyState from '../components/common/EmptyState';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../contexts/AuthContext';
import { GENDERS } from '../utils/constants';

export default function StudentsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = usePermission('students.manage');
  const canStatus = usePermission('students.status');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data: period } = useQuery({
    queryKey: ['period-active'],
    queryFn: () => periodsApi.active().then((r) => r.data),
  });

  const { data: availableAccounts } = useQuery({
    queryKey: ['available-accounts'],
    queryFn: () => studentsApi.availableAccounts().then((r) => r.data),
    enabled: !!modal && !modal.id,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, deptFilter],
    queryFn: () => studentsApi.list({
      page, size: 20, search: search || undefined,
      department_id: deptFilter || undefined,
    }).then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? studentsApi.update(modal.id, payload)
      : studentsApi.create({ ...payload, department_id: +payload.department_id }),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Thêm đoàn viên thành công');
      qc.invalidateQueries(['students']);
      qc.invalidateQueries(['students-dept']);
      qc.invalidateQueries(['dashboard-stats']);
      qc.invalidateQueries(['departments']);
      qc.invalidateQueries(['available-accounts']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Lỗi lưu'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, data }) => studentsApi.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      qc.invalidateQueries(['students']);
      qc.invalidateQueries(['dashboard-stats']);
      setConfirmStatus(null);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi cập nhật'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => studentsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries(['students']); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể xóa'),
  });

  const periodOpen = period?.is_open;
  const isBiThu = user?.role_code === 'bi_thu';

  const handleToggle = (student, field, newValue) => {
    if (isBiThu && !periodOpen) {
      toast.warning('Ngoài khoảng thời gian cập nhật');
      return;
    }
    setConfirmStatus({ student, field, newValue });
  };

  const openEdit = (s) => {
    setModal(s);
    Object.keys(s).forEach((k) => setValue(k, s[k] ?? ''));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Đoàn viên"
        subtitle="Tạo tài khoản Đoàn viên (username = MSSV) trước, sau đó gán vào Chi đoàn."
      >
        <PermissionGate permission="students.manage">
          <button className="btn btn-primary" onClick={() => { setModal({}); reset({ book_submitted: false, fee_submitted: false }); }}>
            <i className="bi bi-plus-lg me-1"></i> Thêm đoàn viên
          </button>
        </PermissionGate>
      </PageHeader>

      {isBiThu && !periodOpen && (
        <div className="period-banner closed mb-3">
          <i className="bi bi-clock-history"></i>
          <span>Hiện không trong thời gian cập nhật trạng thái nộp sổ/phí.</span>
        </div>
      )}

      <DataTableCard>
        <div className="filter-bar">
          <input className="form-control form-control-sm" placeholder="Tìm MSSV, họ tên..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {!isBiThu && (
            <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
              <option value="">Tất cả Chi đoàn</option>
              {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
        <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>MSSV</th><th>Họ tên</th><th>Giới tính</th><th>Chi đoàn</th>
                <th>Nộp sổ</th><th>Nộp phí</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).length === 0 && (
                <tr><td colSpan={7}><EmptyState icon="bi-people" title="Không tìm thấy đoàn viên" /></td></tr>
              )}
              {(data?.items || []).map((s) => (
                <tr key={s.id}>
                  <td><code>{s.mssv}</code></td>
                  <td>
                    <button className="btn btn-link p-0" onClick={() => setDetail(s)}>{s.full_name}</button>
                  </td>
                  <td>{s.gender || '—'}</td>
                  <td>{s.department_name}</td>
                  <td>
                    {canStatus ? (
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={s.book_submitted}
                          disabled={isBiThu && !periodOpen}
                          onChange={(e) => handleToggle(s, 'book_submitted', e.target.checked)} />
                      </div>
                    ) : (
                      <span className={`badge bg-${s.book_submitted ? 'success' : 'secondary'}`}>{s.book_status_label}</span>
                    )}
                  </td>
                  <td>
                    {canStatus ? (
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={s.fee_submitted}
                          disabled={isBiThu && !periodOpen}
                          onChange={(e) => handleToggle(s, 'fee_submitted', e.target.checked)} />
                      </div>
                    ) : (
                      <span className={`badge bg-${s.fee_submitted ? 'success' : 'secondary'}`}>{s.fee_status_label}</span>
                    )}
                  </td>
                  <td>
                    <PermissionGate permission="students.manage">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(s)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => { if (confirm('Xóa đoàn viên?')) deleteMut.mutate(s.id); }}><i className="bi bi-trash"></i></button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {data && (
          <div className="data-card-footer d-flex justify-content-between align-items-center">
            <span className="text-muted small">Tổng {data.total} đoàn viên</span>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
              <span className="btn btn-outline-secondary disabled">{page}/{data.pages || 1}</span>
              <button className="btn btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Sau</button>
            </div>
          </div>
        )}
      </DataTableCard>

      {confirmStatus && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h5>Xác nhận</h5><button className="btn-close" onClick={() => setConfirmStatus(null)}></button></div>
              <div className="modal-body">
                Cập nhật <strong>{confirmStatus.field === 'book_submitted' ? 'nộp sổ' : 'nộp phí'}</strong> cho{' '}
                <strong>{confirmStatus.student.full_name}</strong> thành{' '}
                <strong>{confirmStatus.newValue ? 'Đã nộp' : 'Chưa nộp'}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmStatus(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={() => statusMut.mutate({
                  id: confirmStatus.student.id,
                  data: { [confirmStatus.field]: confirmStatus.newValue },
                })}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h5>Chi tiết đoàn viên</h5><button className="btn-close" onClick={() => setDetail(null)}></button></div>
              <div className="modal-body">
                <dl className="row mb-0 small">
                  <dt className="col-4">Họ tên</dt><dd className="col-8">{detail.full_name}</dd>
                  <dt className="col-4">MSSV</dt><dd className="col-8"><code>{detail.mssv}</code></dd>
                  <dt className="col-4">Chi đoàn</dt><dd className="col-8">{detail.department_name}</dd>
                  <dt className="col-4">Ngày sinh</dt><dd className="col-8">{detail.date_of_birth || '—'}</dd>
                  <dt className="col-4">Giới tính</dt><dd className="col-8">{detail.gender || '—'}</dd>
                  <dt className="col-4">SĐT</dt><dd className="col-8">{detail.phone || '—'}</dd>
                  <dt className="col-4">Nộp sổ</dt><dd className="col-8">{detail.book_status_label}</dd>
                  <dt className="col-4">Nộp phí</dt><dd className="col-8">{detail.fee_status_label}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => saveMut.mutate({
                ...d,
                book_submitted: d.book_submitted === true || d.book_submitted === 'true',
                fee_submitted: d.fee_submitted === true || d.fee_submitted === 'true',
              }))}>
                <div className="modal-header">
                  <h5>{modal.id ? 'Sửa đoàn viên' : 'Thêm đoàn viên'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body row g-3">
                  {!modal.id && (
                    <>
                      <div className="col-12">
                        <label className="form-label">Tài khoản đoàn viên (MSSV) *</label>
                        <select
                          className="form-select"
                          {...register('mssv', { required: true })}
                          onChange={(e) => {
                            const acc = (availableAccounts || []).find((a) => a.mssv === e.target.value);
                            if (acc) {
                              setValue('full_name', acc.full_name);
                              setValue('phone', acc.phone || '');
                            }
                          }}
                        >
                          <option value="">Chọn tài khoản</option>
                          {(availableAccounts || []).map((a) => (
                            <option key={a.mssv} value={a.mssv}>{a.mssv} — {a.full_name}</option>
                          ))}
                        </select>
                        {!(availableAccounts || []).length && (
                          <p className="form-text small text-warning">Chưa có tài khoản Đoàn viên khả dụng. Tạo ở menu Tài khoản.</p>
                        )}
                      </div>
                    </>
                  )}
                  <div className={modal.id ? 'col-md-8' : 'col-md-12'}>
                    <label className="form-label">Họ tên *</label>
                    <input className="form-control" {...register('full_name', { required: true })} />
                  </div>
                  {!modal.id && (
                    <div className="col-md-6">
                      <label className="form-label">Chi đoàn *</label>
                      <select className="form-select" {...register('department_id', { required: true })}>
                        <option value="">Chọn</option>
                        {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                  {modal.id && (
                    <div className="col-md-4">
                      <label className="form-label">Chi đoàn *</label>
                      <select className="form-select" {...register('department_id', { required: true })}>
                        <option value="">Chọn</option>
                        {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                  {!modal.id && (
                    <div className="col-md-6">
                      <label className="form-label">Ngày sinh</label>
                      <input type="date" className="form-control" {...register('date_of_birth')} />
                    </div>
                  )}
                  {modal.id && (
                    <div className="col-md-4">
                      <label className="form-label">Ngày sinh</label>
                      <input type="date" className="form-control" {...register('date_of_birth')} />
                    </div>
                  )}
                  <div className="col-md-4">
                    <label className="form-label">Giới tính</label>
                    <select className="form-select" {...register('gender')}>
                      <option value="">—</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">SĐT</label>
                    <input className="form-control" {...register('phone')} />
                  </div>
                  {modal.id && (
                    <>
                      <div className="col-md-3">
                        <label className="form-label">Nộp sổ</label>
                        <select className="form-select" {...register('book_submitted')}>
                          <option value="false">Chưa nộp</option>
                          <option value="true">Đã nộp</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Nộp phí</label>
                        <select className="form-select" {...register('fee_submitted')}>
                          <option value="false">Chưa nộp</option>
                          <option value="true">Đã nộp</option>
                        </select>
                      </div>
                    </>
                  )}
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

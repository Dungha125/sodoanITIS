import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { classesApi, departmentsApi, campaignsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyOrgBanner from '../components/common/EmptyOrgBanner';
import { COHORTS } from '../utils/constants';

export default function ClassesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [importClass, setImportClass] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list().then((r) => r.data),
  });
  const activeCampaign = (campaigns || []).find((c) => c.status === 'active');

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', deptFilter],
    queryFn: () => classesApi.list({ department_id: deptFilter || undefined }).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data) => classesApi.create({ ...data, department_id: +data.department_id }),
    onSuccess: () => {
      toast.success('Tạo lớp thành công');
      qc.invalidateQueries(['classes']);
      setShowForm(false);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi tạo lớp'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => classesApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa lớp'); qc.invalidateQueries(['classes']); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Không thể xóa'),
  });

  const importMut = useMutation({
    mutationFn: () => classesApi.importStudents(importClass.id, importFile, false),
    onSuccess: ({ data }) => {
      toast.success(`Import: ${data.imported} thành công, ${data.skipped} bỏ qua`);
      qc.invalidateQueries(['classes', 'students']);
      setImportClass(null);
      setImportFile(null);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi import'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Quản lý lớp</h4>
          {user?.lien_chi_name && <small className="text-muted">{user.lien_chi_name}</small>}
          {user?.department_name && <small className="text-muted"> — {user.department_name}</small>}
        </div>
        <PermissionGate permission="classes.manage">
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i> Thêm lớp
          </button>
        </PermissionGate>
      </div>

      <EmptyOrgBanner departments={departments} />

      {activeCampaign && (
        <div className="alert alert-info mb-3">
          <i className="bi bi-calendar-event me-2"></i>
          Đợt thu đang mở: <strong>{activeCampaign.name}</strong> — vào từng lớp để thu sổ và tích đoàn viên đã nộp.
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <select className="form-select form-select-sm" style={{ maxWidth: 280 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">Tất cả chi đoàn</option>
            {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="row g-3">
        {(classes || []).map((cls) => (
          <div key={cls.id} className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5 className="card-title">{cls.name}</h5>
                  <span className="badge bg-secondary">{cls.cohort}</span>
                </div>
                <p className="text-muted small mb-2">{cls.department_name}</p>
                <p className="mb-3"><strong>{cls.student_count}</strong> đoàn viên</p>
                <div className="d-flex gap-2 flex-wrap">
                  {activeCampaign && (
                    <Link
                      to={`/campaigns/${activeCampaign.id}/classes/${cls.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      <i className="bi bi-check2-square me-1"></i> Thu sổ
                    </Link>
                  )}
                  <PermissionGate permission="students.manage">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setImportClass(cls)}>
                      <i className="bi bi-upload me-1"></i> Tải DS lên
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="classes.manage">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { if (confirm('Xóa lớp?')) deleteMut.mutate(cls.id); }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => createMut.mutate(d))}>
                <div className="modal-header">
                  <h5 className="modal-title">Thêm lớp mới</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Chi đoàn</label>
                    <select className="form-select" {...register('department_id', { required: true })} defaultValue={user?.department_id || ''}>
                      <option value="">Chọn chi đoàn</option>
                      {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tên lớp</label>
                    <input className="form-control" placeholder="VD: CNTT22DC" {...register('name', { required: true })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Khóa</label>
                    <select className="form-select" {...register('cohort', { required: true })}>
                      {COHORTS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Tạo lớp</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {importClass && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tải DS lớp {importClass.name}</h5>
                <button type="button" className="btn-close" onClick={() => setImportClass(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted">File Excel (.xlsx): cột A=MSSV, B=Họ tên, C=Email, D=SĐT (dòng 1 là tiêu đề)</p>
                <input type="file" className="form-control mb-3" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setImportClass(null)}>Hủy</button>
                <button className="btn btn-primary" disabled={!importFile || importMut.isPending} onClick={() => importMut.mutate()}>
                  {importMut.isPending ? 'Đang import...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

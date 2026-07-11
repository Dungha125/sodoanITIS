import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { usersApi, departmentsApi, lienChiApi, securityApi } from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyOrgBanner from '../components/common/EmptyOrgBanner';
import PageHeader from '../components/common/PageHeader';
import DataTableCard from '../components/common/DataTableCard';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  doan_truong: 'Đoàn trường',
  lien_chi_doan: 'Liên Chi đoàn',
  bi_thu: 'Bí thư Chi đoàn',
  pho_bi_thu: 'Phó Bí thư',
  ctv: 'Cộng tác viên',
  doan_vien: 'Đoàn viên',
};

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role_code === 'super_admin';
  const isLienChi = user?.role_code === 'lien_chi_doan';
  const qc = useQueryClient();
  const [tab, setTab] = useState('users');
  const [modal, setModal] = useState(null);
  const [roleCode, setRoleCode] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.roles().then((r) => r.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data: lienChiList } = useQuery({
    queryKey: ['lien-chi', isSuperAdmin ? 'all' : 'list'],
    queryFn: () => (isSuperAdmin ? lienChiApi.listAll() : lienChiApi.list()).then((r) => r.data),
  });

  const { data: blacklist } = useQuery({
    queryKey: ['blacklist'],
    queryFn: () => securityApi.blacklist().then((r) => r.data),
    enabled: tab === 'security',
  });

  const unblockMut = useMutation({
    mutationFn: (ip) => securityApi.unblock(ip),
    onSuccess: () => { toast.success('Đã gỡ chặn IP'); qc.invalidateQueries(['blacklist']); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? usersApi.update(modal.id, payload)
      : usersApi.create(payload),
    onSuccess: () => {
      toast.success(modal?.id ? 'Cập nhật thành công' : 'Tạo tài khoản thành công');
      qc.invalidateQueries(['users']);
      setModal(null);
      reset();
    },
    onError: (e) => toast.error(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Lỗi lưu'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => { toast.success('Đã vô hiệu hóa'); qc.invalidateQueries(['users']); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi'),
  });

  const openCreate = () => {
    setModal({});
    const defaultRole = isSuperAdmin ? 'lien_chi_doan' : 'bi_thu';
    setRoleCode(defaultRole);
    reset({ role_code: defaultRole });
  };

  const openEdit = (u) => {
    setModal(u);
    setRoleCode(u.role_code);
    reset({
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      role_code: u.role_code,
      department_id: u.department_id || '',
      lien_chi_id: u.lien_chi_id || '',
      phone: u.phone || '',
    });
  };

  const needsDept = ['bi_thu', 'pho_bi_thu', 'ctv'].includes(roleCode);
  const needsLienChi = roleCode === 'lien_chi_doan';

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Quản trị hệ thống"
        subtitle={isLienChi
          ? 'Tài khoản cấp Chi đoàn: Bí thư, Phó Bí thư, Đoàn viên'
          : 'Super Admin tạo được: Đoàn trường → Liên chi → Bí thư → Phó Bí thư → Đoàn viên'}
      >
        {tab === 'users' && (
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-person-plus me-1"></i> Tạo tài khoản
          </button>
        )}
      </PageHeader>

      <ul className="nav nav-tabs-app">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Tài khoản</button>
        </li>
        {isSuperAdmin && (
          <li className="nav-item">
            <button className={`nav-link ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>Bảo mật (Blacklist)</button>
          </li>
        )}
      </ul>

      {tab === 'security' && isSuperAdmin ? (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent">
            <strong>IP bị chặn</strong>
            <span className="text-muted small ms-2">Tự động khi &gt;20 request/0.1s (admin miễn)</span>
          </div>
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>IP</th><th>Lý do</th><th>Số request</th><th>Thời gian</th><th></th></tr>
            </thead>
            <tbody>
              {(blacklist || []).length === 0 && (
                <tr><td colSpan={5} className="text-muted text-center py-4">Chưa có IP bị chặn</td></tr>
              )}
              {(blacklist || []).map((b) => (
                <tr key={b.id}>
                  <td><code>{b.ip_address}</code></td>
                  <td className="small">{b.reason}</td>
                  <td>{b.request_count}</td>
                  <td className="small">{new Date(b.blocked_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-success" onClick={() => { if (confirm(`Gỡ chặn ${b.ip_address}?`)) unblockMut.mutate(b.ip_address); }}>
                      Gỡ chặn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <>
      <EmptyOrgBanner departments={departments} lienChi={lienChiList} />

      <DataTableCard>
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>Liên chi</th><th>Chi đoàn</th><th>Trạng thái</th><th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).length === 0 && (
              <tr><td colSpan={7}><EmptyState icon="bi-people" title="Chưa có tài khoản" /></td></tr>
            )}
            {(users || []).map((u) => (
                <tr key={u.id} className={!u.is_active ? 'text-muted' : ''}>
                  <td><code>{u.username}</code></td>
                  <td>{u.full_name}</td>
                  <td><span className="badge bg-primary">{ROLE_LABELS[u.role_code] || u.role_name}</span></td>
                  <td>{u.lien_chi_name || '—'}</td>
                  <td>{u.department_name || '—'}</td>
                  <td><span className={`badge bg-${u.is_active ? 'success' : 'secondary'}`}>{u.is_active ? 'Hoạt động' : 'Vô hiệu'}</span></td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                    {u.is_active && u.username !== 'admin' && u.role_code !== 'super_admin' && (
                      <button className="btn btn-sm btn-outline-dark" onClick={() => { if (confirm('Vô hiệu hóa tài khoản?')) deactivateMut.mutate(u.id); }}>
                        <i className="bi bi-slash-circle"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </DataTableCard>
      </>
      )}

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => {
                const payload = { ...d };
                payload.department_id = d.department_id ? +d.department_id : null;
                payload.lien_chi_id = d.lien_chi_id ? +d.lien_chi_id : null;
                if (modal.id && !payload.password) delete payload.password;
                saveMut.mutate(payload);
              })}>
                <div className="modal-header">
                  <h5>{modal.id ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body row g-3">
                  {!modal.id && (
                    <div className="col-md-6">
                      <label className="form-label">Tài khoản</label>
                      <input className="form-control" {...register('username', { required: true })} placeholder="MSSV (vd: 2254800001)" />
                      <p className="form-text small">Với vai trò Đoàn viên: username = MSSV, chưa cần chọn Chi đoàn.</p>
                    </div>
                  )}
                  <div className={modal.id ? 'col-md-12' : 'col-md-6'}>
                    <label className="form-label">Họ tên</label>
                    <input className="form-control" {...register('full_name', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" {...register('email', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{modal.id ? 'Mật khẩu mới (để trống nếu giữ)' : 'Mật khẩu'}</label>
                    <input type="password" className="form-control" {...register('password', { required: !modal.id })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Vai trò</label>
                    <select className="form-select" {...register('role_code', { required: true })} onChange={(e) => {
                      const v = e.target.value;
                      setRoleCode(v);
                      if (!['bi_thu', 'pho_bi_thu', 'ctv'].includes(v)) setValue('department_id', '');
                      if (v !== 'lien_chi_doan') setValue('lien_chi_id', '');
                    }}>
                      {(roles || []).map((r) => (
                        <option key={r.code} value={r.code}>{ROLE_LABELS[r.code] || r.name}</option>
                      ))}
                    </select>
                  </div>
                  {needsLienChi && (
                    <div className="col-md-6">
                      <label className="form-label">Liên Chi đoàn *</label>
                      <select className="form-select" {...register('lien_chi_id', { required: needsLienChi })}>
                        <option value="">— Chọn Liên chi —</option>
                        {(lienChiList || []).map((lc) => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
                      </select>
                      {!(lienChiList || []).length && (
                        <p className="form-text small text-warning">Chưa có Liên chi — tạo ở menu Liên chi trước.</p>
                      )}
                    </div>
                  )}
                  {needsDept && (
                    <div className="col-md-6">
                      <label className="form-label">Chi đoàn</label>
                      <select className="form-select" {...register('department_id', { required: needsDept })}>
                        <option value="">Chọn chi đoàn</option>
                        {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">SĐT</label>
                    <input className="form-control" {...register('phone')} />
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

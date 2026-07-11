import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Đăng nhập thành công');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <div className="card shadow-lg login-card" style={{ width: 420 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-journal-bookmark-fill login-icon" style={{ fontSize: 48 }}></i>
            <h4 className="mt-2 fw-bold">Sổ Đoàn Điện tử</h4>
            <p className="text-muted">Hệ thống quản lý vòng đời sổ đoàn</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label">Tài khoản</label>
              <input className="form-control" {...register('username', { required: true })} placeholder="admin" />
            </div>
            <div className="mb-4">
              <label className="form-label">Mật khẩu</label>
              <input type="password" className="form-control" {...register('password', { required: true })} />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <div className="mt-3 small text-muted text-center">
            Tài khoản mặc định: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

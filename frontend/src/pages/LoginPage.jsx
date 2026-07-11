import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Đăng nhập thành công');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || err.response?.data?.detail || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand d-none d-lg-flex">
          <div className="login-brand-inner">
            <div className="login-brand-badge">
              <i className="bi bi-shield-check"></i>
            </div>
            <h1>Quản lý sổ đoàn</h1>
            <p className="login-brand-desc">
              Hệ thống quản lý nộp sổ đoàn và phí đoàn cho Liên chi Đoàn Khoa CNTT1.
            </p>
            <ul className="login-features">
              <li><i className="bi bi-check-circle-fill"></i> Theo dõi tiến độ theo Chi đoàn</li>
              <li><i className="bi bi-check-circle-fill"></i> Cập nhật trạng thái nộp sổ, nộp phí</li>
              <li><i className="bi bi-check-circle-fill"></i> Thống kê tổng hợp theo khóa</li>
            </ul>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-logo">
                <i className="bi bi-journal-bookmark-fill"></i>
              </div>
              <h2>Đăng nhập</h2>
              <p>Nhập tài khoản được cấp bởi Liên chi</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              <div className="mb-3">
                <label className="form-label fw-medium">Tài khoản</label>
                <div className="input-group login-input-group">
                  <span className="input-group-text"><i className="bi bi-person"></i></span>
                  <input
                    className="form-control"
                    autoComplete="username"
                    placeholder="Nhập tài khoản"
                    {...register('username', { required: true })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Mật khẩu</label>
                <div className="input-group login-input-group">
                  <span className="input-group-text"><i className="bi bi-lock"></i></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    {...register('password', { required: true })}
                  />
                  <button
                    type="button"
                    className="input-group-text login-toggle-pw"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Đăng nhập
                  </>
                )}
              </button>
            </form>

            <p className="login-footer-note">
              <i className="bi bi-info-circle me-1"></i>
              Liên hệ Bí thư hoặc Liên chi nếu chưa có tài khoản.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

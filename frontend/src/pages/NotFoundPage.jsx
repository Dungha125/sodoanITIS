import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1>Trang không tồn tại</h1>
        <p className="text-muted">
          Đường dẫn bạn truy cập không có trong hệ thống hoặc đã bị thay đổi.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Quay lại
          </button>
          {isAuthenticated ? (
            <Link to="/" className="btn btn-primary">
              <i className="bi bi-house me-1"></i> Trang chủ
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <i className="bi bi-box-arrow-in-right me-1"></i> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

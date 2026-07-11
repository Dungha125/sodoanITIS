import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const contextLabel = user?.department_name || user?.lien_chi_name || user?.role_name;

  return (
    <header className="topbar d-flex align-items-center justify-content-between px-4 py-2">
      <div className="d-flex align-items-center gap-2 min-w-0">
        <span className="user-role-chip d-none d-md-inline">{user?.role_name}</span>
        {contextLabel && (
          <span className="text-muted small text-truncate d-none d-lg-inline">
            {contextLabel}
          </span>
        )}
      </div>
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-sm btn-light border" onClick={toggle} title="Đổi giao diện">
          <i className={`bi ${dark ? 'bi-sun' : 'bi-moon'}`}></i>
        </button>
        <div className="dropdown">
          <button className="btn btn-sm btn-primary dropdown-toggle d-flex align-items-center gap-1" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle"></i>
            <span className="d-none d-sm-inline text-truncate" style={{ maxWidth: 140 }}>{user?.full_name}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
            <li className="px-3 py-2">
              <div className="fw-semibold small">{user?.full_name}</div>
              <div className="text-muted small">{user?.role_name}</div>
              {user?.department_name && <div className="text-muted small">{user.department_name}</div>}
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

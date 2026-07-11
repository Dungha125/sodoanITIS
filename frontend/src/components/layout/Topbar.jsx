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

  return (
    <header className="topbar d-flex align-items-center justify-content-between px-4 py-2">
      <div className="d-flex align-items-center">
        <input type="search" className="form-control form-control-sm" placeholder="Tìm kiếm..." style={{ width: 280 }} />
      </div>
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={toggle} title="Dark mode">
          <i className={`bi ${dark ? 'bi-sun' : 'bi-moon'}`}></i>
        </button>
        <button className="btn btn-sm btn-outline-secondary position-relative">
          <i className="bi bi-bell"></i>
        </button>
        <div className="dropdown">
          <button className="btn btn-sm btn-primary dropdown-toggle" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle me-1"></i>
            {user?.full_name}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text small fw-semibold">{user?.role_name}</span></li>
            {user?.lien_chi_name && <li><span className="dropdown-item-text small text-muted">{user.lien_chi_name}</span></li>}
            {user?.department_name && <li><span className="dropdown-item-text small text-muted">{user.department_name}</span></li>}
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
}

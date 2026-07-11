import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_ITEMS } from '../../utils/constants';
import { filterMenuByRole } from '../../utils/permissions';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const items = filterMenuByRole(MENU_ITEMS, user?.role_code);

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <aside className="sidebar text-white">
      <div className="sidebar-brand p-3 border-bottom">
        <i className="bi bi-journal-bookmark-fill brand-icon me-2"></i>
        <strong>Sổ Đoàn</strong>
        <div className="sidebar-brand-sub small text-white-50 mt-1">Điện tử</div>
      </div>
      <nav className="nav flex-column p-2 sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            title={item.label}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer p-3 mt-auto small text-white-50">
        <i className="bi bi-person-badge me-1"></i>
        <span className="nav-label">{user?.role_name}</span>
      </div>
    </aside>
  );
}

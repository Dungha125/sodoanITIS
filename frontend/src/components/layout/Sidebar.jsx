import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_ITEMS } from '../../utils/constants';
import { filterMenuByRole } from '../../utils/permissions';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const items = filterMenuByRole(MENU_ITEMS, user?.role_code);

  return (
    <aside className="sidebar text-white">
      <div className="sidebar-brand p-3 border-bottom">
        <i className="bi bi-journal-bookmark-fill brand-icon me-2"></i>
        <strong>Sổ Đoàn</strong>
      </div>
      <nav className="nav flex-column p-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="app-layout d-flex">
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column min-vh-100">
        <Topbar />
        <main className="flex-grow-1 p-4 main-content">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}

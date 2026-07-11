import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';

export default function EmptyOrgBanner({ departments, lienChi, cohorts }) {
  const { user } = useAuth();
  const noDept = departments !== undefined && departments.length === 0;
  const noLc = lienChi !== undefined && lienChi.length === 0;
  const noCohort = cohorts !== undefined && cohorts.length === 0;
  if (!noDept && !noLc && !noCohort) return null;

  const isAdmin = user?.role_code === 'super_admin';

  return (
    <div className="alert alert-warning mb-4">
      <i className="bi bi-info-circle me-2"></i>
      Chưa đủ dữ liệu tổ chức.
      {isAdmin && noLc && hasPermission(user?.role_code, 'admin') && (
        <> Tạo <Link to="/organization">Liên chi</Link> trước.</>
      )}
      {noCohort && hasPermission(user?.role_code, 'cohorts.manage') && (
        <> {noLc && isAdmin ? ' Sau đó tạo' : ' Tạo'} <Link to="/cohorts">Khóa</Link>.</>
      )}
      {noDept && hasPermission(user?.role_code, 'departments.manage') && (
        <> Tiếp theo <Link to="/departments">Chi đoàn</Link> và import đoàn viên.</>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';

const STEPS_ADMIN = [
  { n: 1, title: 'Tạo Liên chi', path: '/organization', perm: 'admin', icon: 'bi-diagram-3' },
  { n: 2, title: 'Tạo tài khoản', path: '/admin', perm: 'users.manage', icon: 'bi-shield-lock' },
  { n: 3, title: 'Tạo Khóa', path: '/cohorts', perm: 'cohorts.manage', icon: 'bi-mortarboard' },
  { n: 4, title: 'Tạo Chi đoàn', path: '/departments', perm: 'departments.manage', icon: 'bi-people-fill' },
  { n: 5, title: 'Kỳ cập nhật', path: '/periods', perm: 'periods.manage', icon: 'bi-calendar-range' },
  { n: 6, title: 'Import đoàn viên', path: '/departments', perm: 'departments.manage', icon: 'bi-upload' },
];

const STEPS_LIEN_CHI = [
  { n: 1, title: 'Tạo Khóa', path: '/cohorts', perm: 'cohorts.manage', icon: 'bi-mortarboard' },
  { n: 2, title: 'Tạo Chi đoàn', path: '/departments', perm: 'departments.manage', icon: 'bi-people-fill' },
  { n: 3, title: 'Kỳ cập nhật', path: '/periods', perm: 'periods.manage', icon: 'bi-calendar-range' },
  { n: 4, title: 'Tạo tài khoản Bí thư', path: '/admin', perm: 'users.manage', icon: 'bi-person-plus' },
  { n: 5, title: 'Import đoàn viên', path: '/departments', perm: 'departments.manage', icon: 'bi-upload' },
];

export default function SetupGuide({ cohorts, departments, lienChi }) {
  const { user } = useAuth();
  const isAdmin = user?.role_code === 'super_admin';
  const steps = isAdmin ? STEPS_ADMIN : STEPS_LIEN_CHI;

  const hasCohort = (cohorts?.length ?? 0) > 0;
  const hasDept = (departments?.length ?? 0) > 0;
  const hasLc = (lienChi?.length ?? 0) > 0;

  const done = isAdmin ? hasLc && hasCohort && hasDept : hasCohort && hasDept;
  if (done) return null;

  return (
    <div className="card border-0 shadow-sm mb-4 border-start border-4 border-primary">
      <div className="card-body">
        <h6 className="fw-bold mb-3"><i className="bi bi-list-check me-2 text-primary"></i>Thiết lập hệ thống</h6>
        <div className="row g-2">
          {steps.filter((s) => hasPermission(user?.role_code, s.perm)).map((s) => (
            <div key={s.n} className="col-md-6 col-lg-4">
              <Link to={s.path} className="setup-step-link d-flex align-items-center gap-2 p-2 rounded text-decoration-none">
                <span className="setup-step-num">{s.n}</span>
                <i className={`bi ${s.icon} text-primary`}></i>
                <span>{s.title}</span>
              </Link>
            </div>
          ))}
        </div>
        {!hasLc && isAdmin && (
          <p className="small text-warning mb-0 mt-2"><i className="bi bi-exclamation-triangle me-1"></i>Chưa có Liên chi — bắt đầu từ bước 1.</p>
        )}
        {(isAdmin ? hasLc : true) && !hasCohort && (
          <p className="small text-warning mb-0 mt-2"><i className="bi bi-exclamation-triangle me-1"></i>Chưa có Khóa — tạo khóa trước khi thêm Chi đoàn.</p>
        )}
        {hasCohort && !hasDept && (
          <p className="small text-warning mb-0 mt-2"><i className="bi bi-exclamation-triangle me-1"></i>Chưa có Chi đoàn — tạo chi đoàn và import đoàn viên.</p>
        )}
      </div>
    </div>
  );
}

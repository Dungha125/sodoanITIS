import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import LoadingSpinner from './LoadingSpinner';

export default function PermissionRoute({ permission, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasPermission(user?.role_code, permission)) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-shield-exclamation me-2"></i>
        Bạn không có quyền truy cập chức năng này.
      </div>
    );
  }
  return children;
}

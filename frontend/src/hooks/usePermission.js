import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';

export function usePermission(permission) {
  const { user } = useAuth();
  return hasPermission(user?.role_code, permission);
}

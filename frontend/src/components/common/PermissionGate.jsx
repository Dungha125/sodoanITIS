import { usePermission } from '../../hooks/usePermission';

export default function PermissionGate({ permission, children, fallback = null }) {
  const allowed = usePermission(permission);
  return allowed ? children : fallback;
}

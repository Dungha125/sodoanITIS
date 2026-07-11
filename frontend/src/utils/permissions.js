export const ROLE_SUPER_ADMIN = 'super_admin';

const PERMISSIONS = {
  admin: ['super_admin'],
  dashboard: ['super_admin', 'lien_chi_doan', 'bi_thu'],
  'cohorts.manage': ['super_admin', 'lien_chi_doan'],
  'departments.manage': ['super_admin', 'lien_chi_doan'],
  'departments.view': ['super_admin', 'lien_chi_doan', 'bi_thu'],
  'students.manage': ['super_admin', 'lien_chi_doan'],
  'students.view': ['super_admin', 'lien_chi_doan', 'bi_thu'],
  'students.status': ['super_admin', 'lien_chi_doan', 'bi_thu'],
  'students.import': ['super_admin', 'lien_chi_doan'],
  'stats.overview': ['super_admin', 'lien_chi_doan'],
  'stats.department': ['super_admin', 'lien_chi_doan', 'bi_thu'],
  'periods.manage': ['super_admin', 'lien_chi_doan'],
  'audit.view': ['super_admin', 'doan_truong', 'lien_chi_doan'],
};

export function hasPermission(roleCode, permission) {
  if (roleCode === ROLE_SUPER_ADMIN) return true;
  return (PERMISSIONS[permission] || []).includes(roleCode);
}

export function filterMenuByRole(menuItems, roleCode) {
  return menuItems.filter((item) => hasPermission(roleCode, item.permission));
}

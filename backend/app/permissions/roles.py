"""Role definitions and permission matrix."""

ROLE_SUPER_ADMIN = "super_admin"
ROLE_DOAN_TRUONG = "doan_truong"
ROLE_LIEN_CHI_DOAN = "lien_chi_doan"
ROLE_BI_THU = "bi_thu"
ROLE_PHO_BI_THU = "pho_bi_thu"
ROLE_CTV = "ctv"
ROLE_DOAN_VIEN = "doan_vien"

ALL_ROLES = [
    ROLE_SUPER_ADMIN,
    ROLE_DOAN_TRUONG,
    ROLE_LIEN_CHI_DOAN,
    ROLE_BI_THU,
    ROLE_PHO_BI_THU,
    ROLE_CTV,
    ROLE_DOAN_VIEN,
]

_LIEN_CHI = [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN]
_BI_THU_VIEW = [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN, ROLE_BI_THU]

PERMISSIONS = {
    "users.manage": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
  "admin": [ROLE_SUPER_ADMIN],
    "dashboard": _BI_THU_VIEW,
    "cohorts.manage": _LIEN_CHI,
    "departments.manage": _LIEN_CHI,
    "departments.view": _BI_THU_VIEW,
    "students.manage": _LIEN_CHI,
    "students.view": _BI_THU_VIEW,
    "students.status": _BI_THU_VIEW,
    "students.import": _LIEN_CHI,
    "stats.overview": _LIEN_CHI,
    "stats.department": _BI_THU_VIEW,
    "periods.manage": _LIEN_CHI,
    "audit.view": [ROLE_SUPER_ADMIN, ROLE_DOAN_TRUONG, ROLE_LIEN_CHI_DOAN],
    "notifications.send": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    # Legacy — giữ để không vỡ code cũ
    "students.manage.legacy": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN, ROLE_BI_THU, ROLE_PHO_BI_THU],
    "classes.manage": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "books.manage": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "books.view": ALL_ROLES,
    "books.inventory": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "campaigns.manage": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "campaigns.collect": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "campaigns.submit": [ROLE_SUPER_ADMIN],
    "campaigns.confirm": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "campaigns.status": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "campaigns.view": [ROLE_SUPER_ADMIN, ROLE_LIEN_CHI_DOAN],
    "reports": _LIEN_CHI,
}


def has_permission(role_code: str, permission: str) -> bool:
    allowed = PERMISSIONS.get(permission, [])
    return role_code in allowed or role_code == ROLE_SUPER_ADMIN

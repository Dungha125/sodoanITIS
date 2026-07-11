import api from './axios';

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

export const cohortsApi = {
  list: () => api.get('/cohorts'),
  create: (data) => api.post('/cohorts', data),
  update: (id, data) => api.put(`/cohorts/${id}`, data),
  delete: (id) => api.delete(`/cohorts/${id}`),
};

export const statsApi = {
  cohort: (cohortId) => api.get(`/stats/cohorts/${cohortId}`),
  department: (deptId) => api.get(`/stats/departments/${deptId}`),
};

export const periodsApi = {
  list: () => api.get('/periods'),
  active: () => api.get('/periods/active'),
  create: (data) => api.post('/periods', data),
  update: (id, data) => api.put(`/periods/${id}`, data),
  delete: (id) => api.delete(`/periods/${id}`),
};

export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  updateStatus: (id, data) => api.patch(`/students/${id}/status`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const departmentsApi = {
  list: (params) => api.get('/departments', { params }),
  get: (id) => api.get(`/departments/${id}`),
  listAll: () => api.get('/departments/all'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  importStudents: (deptId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/departments/${deptId}/import-students`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const lienChiApi = {
  list: () => api.get('/lien-chi'),
  listAll: () => api.get('/lien-chi/all'),
  create: (data) => api.post('/lien-chi', data),
  update: (id, data) => api.put(`/lien-chi/${id}`, data),
  delete: (id) => api.delete(`/lien-chi/${id}`),
};

export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  roles: () => api.get('/users/roles/list'),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

export const securityApi = {
  blacklist: () => api.get('/security/blacklist'),
  unblock: (ip) => api.delete(`/security/blacklist/${ip}`),
  events: () => api.get('/security/events'),
};

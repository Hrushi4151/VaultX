import api from './api';

const adminService = {
  getStats: () => api.get('/admin/analytics/dashboard'),
  getUsers: (search = '', page = 0, size = 10, status = 'ALL', sort = 'createdAt,desc') => api.get('/admin/users', { params: { search, page, size, status, sort } }),
  suspendUser: (id) => api.post(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  getDocuments: (search = '', page = 0, size = 50) => api.get('/admin/documents', { params: { search, page, size } }),
  getAuditLogs: () => api.get('/admin/analytics/audit-logs'),
};

export default adminService;

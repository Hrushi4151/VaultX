import api from './api';

const adminService = {
  getStats: () => api.get('/admin/analytics/dashboard'),
  getUsers: (search = '', page = 0, size = 10) => api.get('/admin/users', { params: { search, page, size } }),
  suspendUser: (id) => api.post(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
};

export default adminService;

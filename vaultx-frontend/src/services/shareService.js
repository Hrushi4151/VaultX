import api from './api';

const shareService = {
  createShare: (data) => api.post('/shares', data),
  getUserShares: (page = 0, size = 10) => api.get(`/shares?page=${page}&size=${size}`),
  getShare: (id) => api.get(`/shares/${id}`),
  deleteShare: (id) => api.delete(`/shares/${id}`),
  revokeShare: (id) => api.post(`/shares/${id}/revoke`),
  updatePassword: (id, password) => api.post(`/shares/${id}/password`, null, { params: { password } })
};

export default shareService;

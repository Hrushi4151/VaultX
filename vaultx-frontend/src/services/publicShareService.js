import api from './api';

const publicShareService = {
  getMetadata: (token) => api.get(`/public/shares/${token}`),
  verifyPassword: (token, password) => api.post(`/public/shares/${token}/verify`, { password }),
  downloadShare: (token, password = null) => {
    return api.post(`/public/shares/${token}/download`, 
      { password }, 
      { responseType: 'blob' }
    );
  },
  getDocuments: (token, password = null) => api.post(`/public/shares/${token}/documents`, { password }),
  downloadSingleDocument: (token, docId, password = null) => {
    return api.post(`/public/shares/${token}/documents/${docId}/download`, 
      { password }, 
      { responseType: 'blob' }
    );
  }
};

export default publicShareService;

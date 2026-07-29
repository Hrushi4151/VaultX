import api from './api';

const collectionService = {
  getCollections: () => api.get('/collections'),
  
  getCollection: (id) => api.get(`/collections/${id}`),
  
  createCollection: (name, description) =>
    api.post('/collections', { name, description }),
  
  renameCollection: (id, name, description) =>
    api.put(`/collections/${id}`, { name, description }),
  
  addDocuments: (id, documentIds) =>
    api.post(`/collections/${id}/documents`, { documentIds }),
  
  removeDocument: (collectionId, documentId) =>
    api.delete(`/collections/${collectionId}/documents/${documentId}`),
  
  deleteCollection: (id) => api.delete(`/collections/${id}`),

  downloadCollection: (id) => api.get(`/collections/${id}/download`, { responseType: 'blob' })
};

export default collectionService;


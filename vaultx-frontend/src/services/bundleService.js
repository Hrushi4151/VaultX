import api from './api';

const bundleService = {
  // Create a new bundle
  createBundle: (data) => {
    return api.post('/bundles', data);
  },

  // Get user bundles (dashboard)
  getUserBundles: (page = 0, size = 10, sort = 'updatedAt', dir = 'desc') => {
    return api.get('/bundles', { params: { page, size, sort, dir } });
  },

  // Get a specific bundle
  getBundle: (id) => {
    return api.get(`/bundles/${id}`);
  },

  // Update bundle details
  updateBundle: (id, data) => {
    return api.put(`/bundles/${id}`, data);
  },

  // Duplicate a bundle
  duplicateBundle: (id) => {
    return api.post(`/bundles/${id}/duplicate`);
  },

  // Toggle favourite status
  toggleFavourite: (id) => {
    return api.post(`/bundles/${id}/favorite`);
  },

  // Archive bundle
  archiveBundle: (id) => {
    return api.post(`/bundles/${id}/archive`);
  },

  // Restore bundle
  restoreBundle: (id) => {
    return api.post(`/bundles/${id}/restore`);
  },

  // Delete bundle
  deleteBundle: (id) => {
    return api.delete(`/bundles/${id}`);
  },

  // Add documents to bundle
  addDocuments: (id, documentIds) => {
    return api.post(`/bundles/${id}/documents`, { documentIds });
  },

  // Remove document from bundle
  removeDocument: (id, documentId) => {
    return api.delete(`/bundles/${id}/documents/${documentId}`);
  },

  // Reorder documents
  reorderDocuments: (id, documentIds) => {
    return api.put(`/bundles/${id}/reorder`, { documentIds });
  },

  // Download bundle as ZIP
  downloadBundleAsZip: (id) => {
    return api.get(`/bundles/${id}/download`, { responseType: 'blob' });
  }
};

export default bundleService;

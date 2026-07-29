import api from './api';

const documentService = {
  // Document endpoints
  uploadDocument: (file, metadata, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Create a Blob for the metadata JSON
    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json'
    });
    formData.append('metadata', metadataBlob);

    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
  },

  getActiveDocuments: (categoryId = null, page = 0, size = 10, sort = 'updatedAt', dir = 'desc') => {
    let catId = categoryId;
    let p = page;
    let s = size;
    let srt = sort;
    let d = dir;

    if (typeof categoryId === 'number') {
      catId = null;
      p = categoryId;
      s = typeof page === 'number' ? page : 10;
      srt = typeof size === 'string' ? size : 'updatedAt';
      d = typeof sort === 'string' ? sort : 'desc';
    }

    const params = { page: p, size: s, sort: srt, dir: d };
    if (catId) {
      params.categoryId = catId;
    }
    return api.get('/documents', { params });
  },

  exportCategory: (categoryId = null) => {
    return api.get('/documents/export', { params: { categoryId }, responseType: 'blob' });
  },

  getTrashDocuments: (page = 0, size = 10) => {
    return api.get('/documents/trash', { params: { page, size } });
  },

  getFavouriteDocuments: (page = 0, size = 10) => {
    return api.get('/documents/favourite', { params: { page, size } });
  },

  getDocument: (id) => {
    return api.get(`/documents/${id}`);
  },

  downloadDocument: (id) => {
    return api.get(`/documents/${id}/download`, { responseType: 'blob' });
  },

  renameDocument: (id, name) => {
    return api.put(`/documents/${id}/rename`, { name });
  },

  updateCategory: (id, categoryId) => {
    return api.put(`/documents/${id}/category`, { categoryId });
  },

  toggleFavourite: (id) => {
    return api.post(`/documents/${id}/favourite`);
  },

  archiveDocument: (id) => api.post(`/documents/${id}/archive`),
  
  restoreDocument: (id) => api.post(`/documents/${id}/restore`),
  restoreDocuments: (ids) => api.post(`/documents/trash/restore-batch`, ids),
  
  softDeleteDocument: (id) => api.delete(`/documents/${id}`),
  
  permanentDeleteDocument: (id) => api.delete(`/documents/${id}/permanent`),
  permanentDeleteDocuments: (ids) => api.delete(`/documents/trash/permanent-batch`, { data: ids }),
  emptyTrash: () => api.delete(`/documents/trash/empty`),

  // Category endpoints
  getAllCategories: () => {
    return api.get('/categories');
  },

  // Tag endpoints
  getUserTags: () => {
    return api.get('/tags');
  },

  createTag: (name, color) => {
    return api.post('/tags', { name, color });
  },

  deleteTag: (id) => {
    return api.delete(`/tags/${id}`);
  },

  // Collection endpoints
  getUserCollections: () => {
    return api.get('/collections');
  },

  createCollection: (name, description) => {
    return api.post('/collections', { name, description });
  },

  deleteCollection: (id) => {
    return api.delete(`/collections/${id}`);
  }
};

export default documentService;

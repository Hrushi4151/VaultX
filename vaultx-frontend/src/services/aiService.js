import api from './api';

const aiService = {
  getSummary: () => api.get('/engine/ai/summary'),
  getSmartCategorizations: () => api.get('/engine/ai/categorized'),
  getOcrScans: () => api.get('/engine/ai/ocr'),
  getExpiringDocuments: () => api.get('/engine/ai/expiring'),
  getDuplicateGroups: () => api.get('/engine/ai/duplicates'),
  setExpiryDate: (documentId, expiryDate) => api.post(`/engine/ai/expiry/${documentId}`, null, { params: { expiryDate } }),
  triggerOcr: (documentId) => api.post(`/engine/ocr/process/${documentId}`),
  triggerClassification: (documentId) => api.post(`/engine/ai/classify/${documentId}`),
  analyzeDocument: (documentId) => api.get(`/engine/ai/analyze/${documentId}`),
  analyzePreview: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/engine/ai/analyze-preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  applySuggestions: (documentId, params) => {
    return api.post(`/engine/ai/apply-suggestions/${documentId}`, params);
  }
};

export default aiService;

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
  applySuggestions: (documentId, params) => {
    const formattedParams = { ...params };
    if (Array.isArray(formattedParams.tags)) {
      formattedParams.tags = formattedParams.tags.join(',');
    }
    return api.post(`/engine/ai/apply-suggestions/${documentId}`, null, { params: formattedParams });
  }
};

export default aiService;

import api from './api';

const engineService = {
  triggerOcr: (documentId) => api.post(`/engine/ocr/process/${documentId}`),
  triggerAiClassification: (documentId) => api.post(`/engine/ai/classify/${documentId}`),
};

export default engineService;

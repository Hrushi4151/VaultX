import api from './api';

const pdfService = {
  // Export a bundle to PDF
  exportBundle: (bundleId) => {
    return api.post(`/pdf/bundles/${bundleId}/export`, {}, {
      responseType: 'blob' // Important: Expect a binary file back
    });
  },

  mergeDocuments: (payload) => {
    return api.post('/pdf/merge', payload, {
      responseType: 'blob'
    });
  },

  // Protect & encrypt PDF with real passwords via backend PDFBox engine
  protectPdf: (formData) => {
    return api.post('/pdf/protect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob'
    });
  }
};

export default pdfService;

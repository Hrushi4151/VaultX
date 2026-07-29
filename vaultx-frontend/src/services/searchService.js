import api from './api';

const searchService = {
  globalSearch: (query, page = 0, size = 20) => api.get(`/search`, { params: { query, page, size } })
};

export default searchService;

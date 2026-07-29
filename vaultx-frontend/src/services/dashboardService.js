import api from './api';

const dashboardService = {
  getStats: () => {
    return api.get('/dashboard/stats');
  }
};

export default dashboardService;

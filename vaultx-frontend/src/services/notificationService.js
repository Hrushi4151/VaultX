import api from './api';

const notificationService = {
  getNotifications: (page = 0, size = 20) => {
    return api.get(`/notifications?page=${page}&size=${size}`);
  },

  getAllNotifications: () => {
    return api.get('/notifications/all');
  },

  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: (id) => {
    return api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.put('/notifications/read-all');
  },

  deleteNotification: (id) => {
    return api.delete(`/notifications/${id}`);
  },

  clearAllNotifications: () => {
    return api.delete('/notifications/clear-all');
  }
};

export default notificationService;

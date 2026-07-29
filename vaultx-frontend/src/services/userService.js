import api from './api';

/**
 * User API service — all user-related HTTP calls.
 */
const userService = {
  /**
   * Fetch the currently authenticated user's profile.
   */
  getMe: () => api.get('/users/me'),

  /**
   * Update a user's profile fields.
   */
  updateUser: (id, data) => api.put(`/users/${id}`, data),

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  updateAvatar: async (base64Avatar) => {
    const response = await api.post('/users/avatar', base64Avatar, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response.data;
  },

  createVaultPin: async (pin) => {
    const response = await api.post('/users/create-pin', { pin });
    return response.data;
  },

  changeVaultPin: async (currentPin, newPin) => {
    const response = await api.put('/users/change-pin', { currentPin, newPin });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/users/sessions');
    return response.data;
  },

  terminateSession: async (sessionId) => {
    const response = await api.delete(`/users/sessions/${sessionId}`);
    return response.data;
  }
};

export default userService;

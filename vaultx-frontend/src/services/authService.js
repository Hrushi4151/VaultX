import api from './api';

export const authService = {
  login: async (email, password, rememberMe) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  sendEmailOtp: async (email) => {
    const response = await api.post('/auth/send-email-otp', { email });
    return response.data;
  },

  verifyEmailOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-email-otp', { email, otp });
    return response.data;
  },

  sendMobileOtp: async (phoneNumber) => {
    const response = await api.post('/auth/send-mobile-otp', { phoneNumber });
    return response.data;
  },

  verifyMobileOtp: async (phoneNumber, otp) => {
    const response = await api.post('/auth/verify-mobile-otp', { phoneNumber, otp });
    return response.data;
  },

  sendRegistrationOtp: async (email, phoneNumber, username) => {
    const response = await api.post('/auth/send-registration-otp', { email, phoneNumber, username });
    return response.data;
  },

  registerWithOtp: async (userDataWithOtp) => {
    const response = await api.post('/auth/register-with-otp', userDataWithOtp);
    return response.data;
  },
  
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },
  
  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  verifyOtp: async (phoneNumber, token) => {
    const response = await api.post('/auth/verify-otp', { phoneNumber, token });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }
};

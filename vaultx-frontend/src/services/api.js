import axios from 'axios';
import { TOKEN_KEY } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Axios instance with base URL, default headers, and request/response interceptors.
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Request interceptor — attach JWT token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem('vaultx_refresh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ─────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and it's not a retry, auth endpoint, or public endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/') && !originalRequest.url.includes('/public/')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('vaultx_refresh_token');
        if (!refreshToken) throw new Error("No refresh token available");

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem('vaultx_refresh_token', newRefreshToken);
        
        api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Force logout on failed refresh
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('vaultx_user');
        localStorage.removeItem('vaultx_refresh_token');
        if (
          !window.location.pathname.includes('/login') && 
          (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin'))
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 403 Forbidden (expired or invalidated token)
    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest.url.includes('/auth/') && !originalRequest.url.includes('/public/')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('vaultx_user');
        localStorage.removeItem('vaultx_refresh_token');
        if (
            !window.location.pathname.includes('/login') && 
            (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin'))
        ) {
            window.location.href = '/login';
        }
    }

    return Promise.reject(error);
  }
);

export default api;

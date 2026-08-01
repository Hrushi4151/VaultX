import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY } from '../utils/constants';
import { authService } from '../services/authService';
import userService from '../services/userService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(user && token);

  // Continuous Active Session Monitor (Heartbeat ping every 12s)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionValidity = async () => {
      try {
        await userService.checkSessionHeartbeat();
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Your session was terminated from another device. Please log in again.', { id: 'session-terminated' });
          setUser(null);
          setToken(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          if (
            !window.location.pathname.includes('/login') && 
            (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin'))
          ) {
            window.location.href = '/login';
          }
        }
      }
    };

    const interval = setInterval(checkSessionValidity, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = useCallback(async (email, password, rememberMe) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password, rememberMe);
      const { accessToken, refreshToken, user: userData } = data.data;
      
      setUser(userData);
      setToken(accessToken);
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.adminLogin(email, password);
      // Depending on backend structure, assuming response.data holds accessToken, etc.
      const payload = data.data ? data.data : data; 
      const { accessToken, refreshToken, user: userData } = payload;
      
      setUser(userData);
      setToken(accessToken);
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      return payload;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const walletLogin = useCallback(async (identifier, walletPassword) => {
    try {
      const data = await authService.walletLogin(identifier, walletPassword);
      const { accessToken, refreshToken, user: userData } = data.data;

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  const faceLogin = useCallback(async (identifier, faceData) => {
    try {
      const data = await authService.faceLogin(identifier, faceData);
      const { accessToken, refreshToken, user: userData } = data.data;

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('VAULTX_IS_LOCKED');
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    setIsLoading,
    login,
    adminLogin,
    walletLogin,
    faceLogin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

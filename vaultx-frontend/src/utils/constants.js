// Application-wide constants

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'VaultX';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const ROUTES = {
  HOME:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD:       '/dashboard',
  PROFILE:         '/dashboard/profile',
  SETTINGS:        '/dashboard/settings',
};

export const TOKEN_KEY = 'vaultx_access_token';
export const USER_KEY  = 'vaultx_user';
export const REFRESH_TOKEN_KEY = 'vaultx_refresh_token';

export const HTTP_STATUS = {
  OK:           200,
  CREATED:      201,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  SERVER_ERROR: 500,
};

export const ROLES = {
  USER:  'ROLE_USER',
  ADMIN: 'ROLE_ADMIN',
};

export const PAGINATION = {
  DEFAULT_PAGE:      0,
  DEFAULT_PAGE_SIZE: 20,
};

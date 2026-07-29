/**
 * Validate email format.
 */
export function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email?.trim());
}

/**
 * Validate password strength:
 * - Min 8 characters
 * - At least one uppercase, one lowercase, one digit, one special character
 */
export function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}

/**
 * Validate username:
 * - 3–50 characters
 * - Alphanumeric, underscores, hyphens
 */
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_\-]{3,50}$/.test(username);
}

/**
 * Check if a string is blank (null, undefined, or whitespace-only).
 */
export function isBlank(value) {
  return !value || value.trim().length === 0;
}

/**
 * Validate URL format.
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * React Hook Form validation rules object for email fields.
 */
export const emailRules = {
  required: 'Email is required',
  validate: (v) => isValidEmail(v) || 'Invalid email address format',
};

/**
 * React Hook Form validation rules for password fields.
 */
export const passwordRules = {
  required: 'Password is required',
  validate: (v) =>
    isValidPassword(v) ||
    'Must be 8+ characters with uppercase, lowercase, digit, and special character',
};

/**
 * React Hook Form validation rules for username fields.
 */
export const usernameRules = {
  required: 'Username is required',
  minLength: { value: 3,  message: 'Username must be at least 3 characters' },
  maxLength: { value: 50, message: 'Username cannot exceed 50 characters' },
  validate: (v) => isValidUsername(v) || 'Only letters, numbers, underscores, and hyphens allowed',
};

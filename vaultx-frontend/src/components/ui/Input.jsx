import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Input component with label, error, helper text, icons, and password toggle.
 */
const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder = '',
  error,
  helperText,
  icon: Icon,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  required,
  disabled = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const FinalLeftIcon = Icon || LeftIcon;

  const inputClass = `input ${error ? 'input-error' : ''} ${FinalLeftIcon ? 'pl-10' : ''} ${isPassword || RightIcon ? 'pr-10' : ''} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {FinalLeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <FinalLeftIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          ref={ref}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" aria-hidden="true" />
              : <Eye    className="w-4 h-4" aria-hidden="true" />}
          </button>
        ) : RightIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <RightIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {error && (
        <p id={`${name}-error`} className="error-text" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${name}-helper`} className="helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

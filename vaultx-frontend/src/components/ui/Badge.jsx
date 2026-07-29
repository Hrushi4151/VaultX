const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  accent:  'badge-accent',
  gray:    'badge-gray',
};

/**
 * Badge component for status labels, tags, and counts.
 */
export default function Badge({ children, variant = 'gray', dot = false, className = '' }) {
  return (
    <span className={`${variants[variant] || 'badge-gray'} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

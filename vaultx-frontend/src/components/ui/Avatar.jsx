import { getInitials } from '../../utils/formatters';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online:  'bg-success',
  offline: 'bg-gray-400',
  away:    'bg-warning',
};

// Deterministic background color based on name string
function getAvatarColor(name) {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-secondary/20 text-secondary',
    'bg-accent/20 text-accent',
    'bg-success/20 text-success',
    'bg-warning/20 text-warning',
    'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700',
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * Avatar component with image, initials fallback, size variants, and status indicator.
 */
export default function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  className = '',
  alt,
}) {
  const sizeClass = sizes[size] || sizes.md;
  const colorClass = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-semibold border-2 border-white shadow-sm`}
          aria-label={name || 'User avatar'}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusColors[status]} ${
            size === 'xs' || size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'
          }`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

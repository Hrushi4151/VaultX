/**
 * Loader / spinner component with size variants and optional full-page overlay.
 */
export default function Loader({ size = 'md', fullPage = false, text = '', color = 'primary' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const strokeColor = color === 'white' ? 'stroke-white' : 'stroke-primary';
  const sizeClass = sizes[size] || sizes.md;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg
        className={`${sizeClass} animate-spin`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className={`opacity-80 ${strokeColor}`}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          d="M4 12a8 8 0 018-8"
          stroke="currentColor"
        />
      </svg>
      {text && <p className="text-sm text-text-muted animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        role="status"
        aria-label="Loading"
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4" role="status" aria-label="Loading">
      {spinner}
    </div>
  );
}

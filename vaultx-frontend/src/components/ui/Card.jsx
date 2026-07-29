/**
 * Card component with optional hover effect and structured header/footer slots.
 */
export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  header,
  footer,
  onClick,
}) {
  const baseClass = hover ? 'card-hover' : 'card';
  const paddingClass = padding ? '' : '!p-0';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClass} ${paddingClass} ${clickClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-border -mx-6 px-6">
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="mt-4 pt-4 border-t border-border -mx-6 px-6">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Compact card variant — less padding, for dense layouts.
 */
export function CardCompact({ children, className = '', hover = false }) {
  return (
    <div className={`${hover ? 'card-hover' : 'card'} !p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Skeleton loading placeholder components.
 */
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return (
    <div className={`skeleton rounded-full ${sizes[size] || sizes.md} ${className}`} />
  );
}

export function SkeletonRect({ width = 'w-full', height = 'h-32', className = '' }) {
  return <div className={`skeleton ${width} ${height} ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size="md" />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
      <SkeletonRect height="h-24" />
    </div>
  );
}

/** Default export — generic skeleton block */
export default function Skeleton({ width = 'w-full', height = 'h-4', className = '', rounded = 'xl' }) {
  return <div className={`skeleton ${width} ${height} rounded-${rounded} ${className}`} />;
}

import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Error state component — shown when something goes wrong.
 */
export default function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-danger/70" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 text-balance">{description}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={RefreshCw}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

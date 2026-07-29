import { FolderOpen } from 'lucide-react';
import Button from './Button';

/**
 * Empty state component — shown when a list or section has no data.
 */
export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-primary/60" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 text-balance">{description}</p>
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          leftIcon={action.icon}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

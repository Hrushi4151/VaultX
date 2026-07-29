import { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Search input with icon, debounce-ready, clear button, and loading state.
 */
export default function SearchInput({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  isLoading = false,
  disabled = false,
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange?.({ target: { value: '' } });
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          : <Search  className="w-4 h-4" aria-hidden="true" />
        }
      </div>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`input pl-10 ${value ? 'pr-10' : ''}`}
        aria-label={placeholder}
      />
      {value && !isLoading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

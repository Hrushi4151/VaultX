import { useState, useEffect } from 'react';

/**
 * Debounce a rapidly-changing value by delaying updates.
 * Useful for search inputs to prevent excessive API calls.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

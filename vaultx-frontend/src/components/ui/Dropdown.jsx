import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown component with trigger button, item list, and click-outside close.
 */
export default function Dropdown({
  trigger,
  items = [],
  placement = 'right',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const menuAlign = placement === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen((v) => !v)} className="cursor-pointer">
        {trigger || (
          <button type="button" className="btn-secondary btn">
            Options <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={`absolute z-40 mt-2 ${menuAlign} min-w-[180px] bg-white border border-border rounded-2xl shadow-dropdown py-1 animate-slide-up`}
          role="menu"
        >
          {items.map((item, index) =>
            item.divider ? (
              <div key={index} className="divider my-1" />
            ) : (
              <button
                key={index}
                type="button"
                onClick={() => { item.onClick?.(); setIsOpen(false); }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors duration-150
                  ${item.danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-text-primary hover:bg-gray-50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                role="menuitem"
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

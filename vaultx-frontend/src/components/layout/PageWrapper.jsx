/**
 * Page wrapper that applies consistent padding and max-width to page content.
 */
export default function PageWrapper({ children, className = '' }) {
  return (
    <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}

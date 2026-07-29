import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../utils/constants';

/**
 * 404 Not Found page.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        {/* Large 404 */}
        <div className="relative mb-8">
          <p className="text-[10rem] font-black text-primary/10 leading-none select-none" aria-hidden="true">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-primary/40" aria-hidden="true" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Page not found</h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => navigate(ROUTES.HOME)} leftIcon={Home}>
            Go Home
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

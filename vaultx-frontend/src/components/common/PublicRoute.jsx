import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

/**
 * Wraps public-only routes (login, register, home).
 * Redirects already-authenticated users to their respective dashboards.
 */
export default function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const isAdmin = user?.roles?.some(r => ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(r.name));
    
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}

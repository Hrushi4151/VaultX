import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdmin = user?.roles?.some(r => ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(r.name));

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

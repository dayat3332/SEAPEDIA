import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui';

/**
 * ProtectedRoute: requires authentication + specific active role.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, activeRole, loading } = useAuth();

  if (loading) return <Spinner className="py-32" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!activeRole) return <Navigate to="/select-role" replace />;

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to={`/dashboard/${activeRole}`} replace />;
  }

  return children;
}

/**
 * RoleSelectRoute: requires authentication, but allows access without an active role.
 */
export function RoleSelectRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner className="py-32" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

/**
 * GuestRoute: redirect if already logged in.
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, activeRole, loading } = useAuth();

  if (loading) return <Spinner className="py-32" />;

  if (isAuthenticated && activeRole) {
    return <Navigate to={`/dashboard/${activeRole}`} replace />;
  }

  return children;
}

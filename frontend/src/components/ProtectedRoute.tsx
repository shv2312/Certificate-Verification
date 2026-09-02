/**
 * ProtectedRoute — Route guard for authenticated areas of the application.
 *
 * Ensures that users can only access routes if they have the required role
 * ('hr' or 'admin'). Unauthorized access attempts are redirected to an error
 * page or the home page.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  // 1. Not authenticated at all -> send to Home/Start
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // 2. Authenticated but doesn't have required role -> send to Unauthorized
  if (role === null || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Authorized -> render child routes
  return <Outlet />;
}

/**
 * ProtectedRoute — Route guard for authenticated areas of the application.
 *
 * Ensures that users can only access routes if they have the required role
 * ('hr' or 'admin'). Unauthorized access attempts are redirected with an
 * appropriate message:
 *
 *   - Admin routes (/admin/*): unauthenticated users see an "Admin Login"
 *     prompt that opens the navbar modal via a custom event.
 *   - HR routes: unauthenticated users are redirected to Home.
 *   - Wrong role: redirected to /unauthorized.
 */

import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

/**
 * AdminAccessPrompt — Shown when someone navigates to /admin without being
 * logged in as admin.  Fires a custom DOM event that AppHeader listens to
 * in order to open the AdminLoginModal without a dedicated /admin/login route.
 */
function AdminAccessPrompt() {
  useEffect(() => {
    // Small delay so the page renders first, then the modal opens
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('siet:open-admin-login'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="section-container py-20 text-center flex-1 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-siet-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-siet-navy mb-2">Admin Access Required</h1>
      <p className="text-siet-slate mb-6 max-w-sm">
        You need to sign in with your admin credentials to access the dashboard.
        The login panel is opening…
      </p>
      <p className="text-sm text-siet-muted">
        If the login panel didn't open, click the{' '}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('siet:open-admin-login'))}
          className="text-siet-sky underline hover:no-underline font-medium"
        >
          Admin
        </button>{' '}
        button in the top navigation bar.
      </p>
    </main>
  );
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const isAdminRoute = allowedRoles.includes('admin');

  // 1. Not authenticated at all
  if (!isAuthenticated) {
    if (isAdminRoute) {
      // Show the admin prompt page (fires modal event) instead of hard redirect
      return <AdminAccessPrompt />;
    }
    // For HR routes, redirect to home
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // 2. Authenticated but wrong role
  if (role === null || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Authorized — render child routes
  return <Outlet />;
}

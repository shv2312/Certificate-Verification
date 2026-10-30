/**
 * App.tsx — Root application component with routing.
 *
 * All routes are defined here. Import new page components and
 * add routes to the <Routes> block as each sprint delivers new pages.
 *
 * Route structure (Sprint 1):
 *   /                    → LandingPage           (implemented)
 *   /company             → CompanyPage           (implemented — awaiting backend)
 *   /verify-email        → PlaceholderPage       (Sprint 2)
 *   /payment             → PlaceholderPage       (Sprint 2/3)
 *   /candidate           → PlaceholderPage       (Sprint 2/3)
 *   /confirm             → PlaceholderPage       (Sprint 2/3)
 *   /verification        → PlaceholderPage       (Sprint 2/3)
 *   /result              → PlaceholderPage       (Sprint 2/3)
 *   /status              → PlaceholderPage       (Sprint 2/3)
 *   /help                → PlaceholderPage       (Sprint 2/3)
 *   *                    → 404 not found
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import LoadingSpinner from './components/LoadingSpinner';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './utils/routes';
import HelpFloatingButton from './components/HelpFloatingButton';

// Lazy-loaded pages to split bundle and isolate heavy chunks
const RequesterPage = lazy(() => import('./pages/RequesterPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const CandidatePage = lazy(() => import('./pages/CandidatePage'));
const ConfirmPage = lazy(() => import('./pages/ConfirmPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReviewPage = lazy(() => import('./pages/admin/AdminReviewPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));

// ── 404 Not Found Page ───────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <main className="section-container py-20 text-center flex-1">
      <p className="text-6xl font-bold text-siet-border mb-4" aria-hidden="true">404</p>
      <h1 className="text-2xl font-bold text-siet-navy mb-2">Page Not Found</h1>
      <p className="text-siet-slate mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <a href={ROUTES.HOME} className="btn-primary">
        Return to Home
      </a>
    </main>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.HOME}    element={<HomePage />} />
              <Route path={ROUTES.REQUESTER} element={<RequesterPage />} />
              <Route path={ROUTES.VERIFY_EMAIL} element={<EmailVerificationPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path={ROUTES.STATUS} element={<StatusPage />} />
              <Route path={ROUTES.PAYMENT} element={<PaymentPage />} />

              {/* Protected HR Routes */}
              <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
                <Route path={ROUTES.CANDIDATE} element={<CandidatePage />} />
                <Route path={ROUTES.CONFIRM} element={<ConfirmPage />} />
                <Route path={ROUTES.RESULT} element={<ResultPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/review/:id" element={<AdminReviewPage />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <AppFooter />
          <HelpFloatingButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

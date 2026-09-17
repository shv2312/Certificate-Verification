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

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import LandingPage from './pages/LandingPage';
import CompanyPage from './pages/CompanyPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import PaymentPage from './pages/PaymentPage';

import UnauthorizedPage from './pages/UnauthorizedPage';
import CandidatePage from './pages/CandidatePage';
import ConfirmPage from './pages/ConfirmPage';
import ResultPage from './pages/ResultPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './utils/routes';

import StatusPage from './pages/StatusPage';
import HelpPage from './pages/HelpPage';

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
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME}    element={<LandingPage />} />
            <Route path={ROUTES.COMPANY} element={<CompanyPage />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<EmailVerificationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path={ROUTES.HELP} element={<HelpPage />} />
            <Route path={ROUTES.STATUS} element={<StatusPage />} />
            <Route path={ROUTES.PAYMENT} element={<PaymentPage />} />

            {/* Protected HR Routes */}
            <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
              <Route path={ROUTES.CANDIDATE} element={<CandidatePage />} />
              <Route path={ROUTES.CONFIRM} element={<ConfirmPage />} />
              <Route path={ROUTES.RESULT} element={<ResultPage />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <AppFooter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

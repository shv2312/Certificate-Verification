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
import PlaceholderPage from './pages/PlaceholderPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './utils/routes';

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
            
            <Route path={ROUTES.HELP} element={
              <PlaceholderPage stepIndex={0} pageTitle="Help & Support" sprintNote="Coming soon: Frequently asked questions and contact information." />
            } />

            {/* Protected HR Routes */}
            <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
              <Route path={ROUTES.PAYMENT} element={
                <PlaceholderPage stepIndex={2} pageTitle="Payment" sprintNote="Sprint 2/3: Payment gateway integration. Backend payment session management required." />
              } />
              <Route path={ROUTES.CANDIDATE} element={
                <PlaceholderPage stepIndex={3} pageTitle="Candidate Details" sprintNote="Sprint 2/3: Candidate details form. Requires verified payment session from backend." />
              } />
              <Route path={ROUTES.CONFIRM} element={
                <PlaceholderPage stepIndex={3} pageTitle="Confirm Details" sprintNote="Sprint 2/3: Review and confirm candidate details before verification." />
              } />
              <Route path={ROUTES.VERIFICATION} element={
                <PlaceholderPage stepIndex={4} pageTitle="Verification in Progress" sprintNote="Sprint 3: Live verification against SIET database. Requires verification engine from Parthiban V." />
              } />
              <Route path={ROUTES.RESULT} element={
                <PlaceholderPage stepIndex={5} pageTitle="Verification Result" sprintNote="Sprint 3: Displays verification outcome and confirmation of report delivery." />
              } />
              <Route path={ROUTES.STATUS} element={
                <PlaceholderPage stepIndex={0} pageTitle="Track Verification Status" sprintNote="Coming soon: Track your verification request using your Request ID." />
              } />
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

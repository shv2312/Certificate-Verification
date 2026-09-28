/**
 * UnauthorizedPage — Shown when a user hits a route they don't have access to.
 */

import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import { ROUTES } from '../utils/routes';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { role } = useAuth();

  return (
    <PageContainer narrow className="flex items-center justify-center">
      <div className="surface-card p-8 sm:p-12 text-center w-full max-w-lg mt-8 md:mt-16">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-siet-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-siet-navy mb-2">Access Denied</h1>
        <p className="text-sm text-siet-slate mb-8 max-w-sm mx-auto leading-relaxed">
          You do not have the required permissions to view this page. If you believe this is an error, please contact the SIET administration.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={role === 'admin' ? '/admin' : ROUTES.COMPANY}
            className="btn-primary"
          >
            Return to Dashboard
          </Link>
          <Link
            to={ROUTES.HOME}
            className="btn-secondary"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

import { useLocation, Navigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ProgressStepper from '../components/ProgressStepper';
import { buildStepStatuses } from '../utils/workflowSteps';
import { ROUTES } from '../utils/routes';
import type { VerificationResult } from '../api/verification';

const steps = buildStepStatuses(5); // Result step

export default function ResultPage() {
  const location = useLocation();
  const result = location.state?.result as VerificationResult;

  if (!result) {
    return <Navigate to={ROUTES.COMPANY} replace />;
  }

  const isVerified = result.status === 'VERIFIED';

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Verification Result</h1>
        <p className="text-siet-slate text-sm">
          Final outcome of the verification request.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <div className="max-w-3xl mx-auto surface-card overflow-hidden">
        <div className={`p-6 border-b ${isVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-100 text-siet-success' : 'bg-red-100 text-siet-error'}`}>
              {isVerified ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isVerified ? 'text-siet-success' : 'text-siet-error'}`}>
                {isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
              </h2>
              <p className="text-sm font-medium mt-1">Request ID: {result.display_request_id}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-siet-navy font-medium">{result.message}</p>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-bold text-siet-navy mb-4">Academic Details</h3>
          {isVerified ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Candidate Name</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.candidate_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Register Number</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.register_number}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Course & Branch</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.course} - {result.branch}</dd>
              </div>
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Period of Study</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.period_of_study}</dd>
              </div>
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Year of Passing</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.year_of_passing}</dd>
              </div>
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Mode of Education</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.mode_of_education}</dd>
              </div>
              <div>
                <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Backlog Status</dt>
                <dd className="text-sm text-siet-navy font-semibold">{result.backlog_status}</dd>
              </div>
            </dl>
          ) : (
            <div className="bg-siet-silver p-4 rounded text-center">
              <p className="text-sm text-siet-slate">
                No matching records found in the institutional database. For privacy reasons, candidate details are redacted.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

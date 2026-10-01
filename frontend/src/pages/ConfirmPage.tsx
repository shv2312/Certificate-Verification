import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ProgressStepper from '../components/ProgressStepper';
import StatusMessage from '../components/StatusMessage';
import { buildStepStatuses } from '../utils/workflowSteps';
import { confirmVerification } from '../api/verification';
import { ApiError } from '../types/api';
import { ROUTES } from '../utils/routes';

const steps = buildStepStatuses(4); // Verification step

export default function ConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verificationRequestId = location.state?.verification_request_id || sessionStorage.getItem('siet_active_request_id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  if (!verificationRequestId) {
    return <Navigate to={ROUTES.REQUESTER} replace />;
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      // Exact payload matching backend ConfirmVerificationRequest
      const result = await confirmVerification({ 
        verification_request_id: verificationRequestId,
      });

      try {
        sessionStorage.setItem('siet_verification_result', JSON.stringify(result));
      } catch (storageErr) {
        console.error('Failed to store verification result in sessionStorage:', storageErr);
      }

      navigate(ROUTES.RESULT, { state: { result } });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setSubmitError(err.message || 'The verification request is not in a confirmable state.');
        } else if (err.status === 403) {
          setSubmitError('Access denied: You do not own this verification request.');
        } else if (err.status === 503) {
          setSubmitError(err.message || 'Institutional verification service is currently busy. Please retry in a few moments.');
        } else {
          setSubmitError(err.message);
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to confirm and verify candidate. Please try again.');
      }
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Confirm Details</h1>
        <p className="text-siet-slate text-sm">
          Please review the details before submitting. Once submitted, verification cannot be reversed.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <form className="max-w-2xl mx-auto surface-card p-6 space-y-5" onSubmit={handleConfirm}>
        {submitError && <StatusMessage type="error" message={submitError} className="mb-4" />}

        {/* Payment Confirmation Banner */}
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Payment Verified</p>
              <p className="text-xs text-emerald-700">One-time verification fee captured. Institutional records unlocked.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-900 bg-white px-2.5 py-1 rounded border border-emerald-200">
            {sessionStorage.getItem('siet_active_display_id') || 'PAID'}
          </span>
        </div>

        {/* Candidate Details Summary */}
        {(() => {
          try {
            const raw = sessionStorage.getItem('candidatePayload') || sessionStorage.getItem('siet_candidate_draft');
            const candidate = raw ? JSON.parse(raw) : null;
            if (!candidate) return null;
            return (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5 text-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Candidate Verification Record
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Candidate Name</span>
                    <span className="font-semibold text-siet-navy">{candidate.candidate_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Register Number</span>
                    <span className="font-mono font-semibold text-siet-navy">{candidate.register_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Degree / Course</span>
                    <span className="text-slate-800">{candidate.degree || candidate.degree_course}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Admission / Entry Mode</span>
                    <span className="text-slate-800">{candidate.admission_type || candidate.entry_mode || 'Regular Entry (1st Year Admission)'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Year of Passing</span>
                    <span className="text-slate-800">{candidate.year_of_passing}</span>
                  </div>
                  {candidate.dob && (
                    <div>
                      <span className="text-xs text-slate-500 block">Date of Birth</span>
                      <span className="font-mono text-slate-800">
                        {candidate.dob.includes('-')
                          ? candidate.dob.split('-').reverse().join('/')
                          : candidate.dob}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          } catch {
            return null;
          }
        })()}

        <StatusMessage
          type="warning"
          title="Important Notice"
          message="By clicking confirm, you agree to submit these candidate details for authoritative institutional verification. One payment authorises only one candidate verification."
          className="mb-4"
        />

        <div className="pt-2">
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying against Institutional Records...' : 'Confirm and Verify'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

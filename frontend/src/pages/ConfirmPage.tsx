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

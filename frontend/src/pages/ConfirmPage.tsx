import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ProgressStepper from '../components/ProgressStepper';
import StatusMessage from '../components/StatusMessage';
import { buildStepStatuses } from '../utils/workflowSteps';
import { confirmVerification } from '../api/verification';
import { ROUTES } from '../utils/routes';

const steps = buildStepStatuses(4); // Verification step

export default function ConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verificationRequestId = location.state?.verification_request_id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  if (!verificationRequestId) {
    return <Navigate to={ROUTES.COMPANY} replace />;
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const result = await confirmVerification({ verification_request_id: verificationRequestId });
      navigate(ROUTES.RESULT, { state: { result } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to confirm verification.');
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
          message="By clicking confirm, you agree to submit these details for institutional verification. One payment permits only one candidate verification."
          className="mb-4"
        />

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Confirm and Verify'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

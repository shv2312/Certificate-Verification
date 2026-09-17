import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';
import StatusMessage from '../components/StatusMessage';
import { buildStepStatuses } from '../utils/workflowSteps';
import { bindCandidate } from '../api/verification';
import { ROUTES } from '../utils/routes';

const steps = buildStepStatuses(3);

interface FormValues {
  candidate_name: string;
  register_number: string;
}

interface FormErrors {
  candidate_name?: string;
  register_number?: string;
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.candidate_name.trim()) errors.candidate_name = 'Candidate name is required.';
  if (!values.register_number.trim()) errors.register_number = 'Register number is required.';
  return errors;
}

export default function CandidatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({
    candidate_name: '',
    register_number: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors = validateForm(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      // Mock payment verification request id for development flow
      const mockVerificationRequestId = 'req_abc123';
      
      await bindCandidate({
        verification_request_id: mockVerificationRequestId,
        candidate: values,
      });
      // Navigate to Confirm page and pass the verification_request_id and register_number for mocking
      navigate(ROUTES.CONFIRM, { 
        state: { 
          verification_request_id: mockVerificationRequestId,
          _mock_register_number: values.register_number 
        } 
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to bind candidate.');
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Candidate Details</h1>
        <p className="text-siet-slate text-sm">
          Enter the candidate’s name and register number to verify the official academic record.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <form className="max-w-2xl mx-auto surface-card p-6 space-y-5" onSubmit={handleSubmit} noValidate>
        {submitError && <StatusMessage type="error" message={submitError} className="mb-4" />}

        <p className="text-xs text-siet-muted">
          Fields marked with <span className="text-siet-error font-semibold">*</span> are mandatory.
        </p>

        <FormField id="candidate-name" label="Candidate Name" required error={errors.candidate_name}>
          <input
            id="candidate-name"
            type="text"
            className="form-input"
            value={values.candidate_name}
            onChange={handleChange('candidate_name')}
          />
        </FormField>

        <FormField id="register-number" label="Register Number" required error={errors.register_number}>
          <input
            id="register-number"
            type="text"
            className="form-input"
            value={values.register_number}
            onChange={handleChange('register_number')}
          />
        </FormField>

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying against official institutional records…' : 'Verify Candidate'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

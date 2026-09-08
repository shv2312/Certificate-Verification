/**
 * CompanyPage — Step 1 of the verification workflow.
 *
 * The HR/company provides:
 *  - Company name
 *  - HR name
 *  - Official HR email address
 *
 * On form submission, the backend (FastAPI — Shri Hari Vishnu S)
 * will initiate an email verification flow.
 *
 * MOCK DEPENDENCY:
 *   Company registration API endpoint NOT yet available.
 *   Form submission currently logs data to console only.
 *   Backend integration required before real submission is possible.
 *   DO NOT deploy form submission in production until the API is ready.
 *
 * Waiting for: POST /api/v1/company/register endpoint from Shri Hari Vishnu S.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';
import StatusMessage from '../components/StatusMessage';
import { buildStepStatuses } from '../utils/workflowSteps';
import { registerCompany } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

const steps = buildStepStatuses(0); // Step index 0 = Company Details (current)

interface FormValues {
  companyName: string;
  hrName: string;
  hrEmail: string;
}

interface FormErrors {
  companyName?: string;
  hrName?: string;
  hrEmail?: string;
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.companyName.trim()) errors.companyName = 'Company name is required.';
  if (!values.hrName.trim())      errors.hrName      = 'HR name is required.';
  if (!values.hrEmail.trim()) {
    errors.hrEmail = 'HR email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.hrEmail)) {
    errors.hrEmail = 'Please enter a valid email address.';
  }
  return errors;
}

export default function CompanyPage() {
  const navigate = useNavigate();
  const { setPartialAuth } = useAuth();
  
  const [values, setValues] = useState<FormValues>({
    companyName: '',
    hrName:      '',
    hrEmail:     '',
  });
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear field error on change
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
      const response = await registerCompany(values);
      setPartialAuth(response.requestId, values.hrEmail);
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred during registration.');
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer narrow>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Company Details</h1>
        <p className="text-siet-slate text-sm">
          Provide your company and HR information to begin the verification process.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressStepper steps={steps} className="mb-8" />

      {/* ── Company details form ── */}
      <form
        className="surface-card p-6 space-y-5"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Company registration form"
      >
        {submitError && (
          <StatusMessage type="error" message={submitError} className="mb-4" />
        )}

        {/* Mandatory fields note */}
          <p className="text-xs text-siet-muted">
            Fields marked with{' '}
            <span className="text-siet-error font-semibold" aria-hidden="true">*</span>
            <span className="sr-only">an asterisk</span>
            {' '}are mandatory.
          </p>

          <FormField id="company-name" label="Company Name" required error={errors.companyName}>
            <input
              id="company-name"
              type="text"
              className="form-input"
              placeholder="e.g. Acme Technologies Pvt. Ltd."
              value={values.companyName}
              onChange={handleChange('companyName')}
              autoComplete="organization"
              aria-required="true"
            />
          </FormField>

        <FormField
          id="hr-name"
          label="HR Representative Name"
          required
          error={errors.hrName}
          hint="(Pending confirmation from HOD on mandatory status)"
        >
          <input
            id="hr-name"
            type="text"
            className="form-input"
            placeholder="e.g. Priya Sharma"
            value={values.hrName}
            onChange={handleChange('hrName')}
            autoComplete="name"
            aria-required="true"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          id="hr-email"
          label="Official HR Email Address"
          required
          error={errors.hrEmail}
          hint="A verification link will be sent to this address. Use your official company email."
        >
          <input
            id="hr-email"
            type="email"
            className="form-input"
            placeholder="e.g. hr@yourcompany.com"
            value={values.hrEmail}
            onChange={handleChange('hrEmail')}
            autoComplete="email"
            aria-required="true"
            disabled={isSubmitting}
          />
        </FormField>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            id="btn-submit-company"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Continue to Email Verification'}
          </button>
        </div>

        {/* Mock data warning for developers (only visible in dev mode) */}
        {import.meta.env.DEV && (
          <StatusMessage
            type="warning"
            title="Development Mode"
            message="Backend API not yet connected. Form submission is mocked via local delay. Connect POST /api/v1/email/send-otp before deploying."
            className="mt-4"
          />
        )}
      </form>
    </PageContainer>
  );
}

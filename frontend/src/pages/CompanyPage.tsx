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
 * On form submission, the backend (FastAPI — Shri Hari Vishnu S)
 * will initiate an email verification flow.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import FormField from '../components/FormField';
import StatusMessage from '../components/StatusMessage';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import SearchableCountrySelect from '../components/SearchableCountrySelect';
import { registerCompany } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

interface FormValues {
  companyName: string;
  hrName: string;
  hrEmail: string;
  hrPhone: string | undefined;
}

interface FormErrors {
  companyName?: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
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
  if (!values.hrPhone) {
    errors.hrPhone = 'HR phone number is required.';
  } else if (!isValidPhoneNumber(values.hrPhone)) {
    errors.hrPhone = 'Please enter a valid phone number.';
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
    hrPhone:     undefined,
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
      const response = await registerCompany({
        companyName: values.companyName,
        hrName: values.hrName,
        hrEmail: values.hrEmail,
        hrPhone: values.hrPhone || '',
      });
      setPartialAuth(response.requestId, values.hrEmail);
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred during registration.');
      setIsSubmitting(false);
    }
  }

  return (
    <WorkflowLayout 
      stepIndex={0} 
      title="Company Details" 
      description="Provide your company and HR information to begin the verification process."
    >
      {/* ── Company details form ── */}
      <form
        className="max-w-2xl mx-auto surface-card p-6 space-y-5"
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
              aria-required="true"
              aria-invalid={!!errors.companyName}
            />
          </FormField>

          <FormField id="hr-name" label="HR Contact Name" required error={errors.hrName}>
            <input
              id="hr-name"
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={values.hrName}
              onChange={handleChange('hrName')}
              aria-required="true"
              aria-invalid={!!errors.hrName}
            />
          </FormField>

          <FormField id="hr-email" label="Official Email Address" required error={errors.hrEmail}>
            <input
              id="hr-email"
              type="email"
              className="form-input"
              placeholder="hr@company.com"
              value={values.hrEmail}
              onChange={handleChange('hrEmail')}
              aria-required="true"
              aria-invalid={!!errors.hrEmail}
              autoComplete="email"
            />
          </FormField>

          <FormField id="hr-phone" label="HR Phone Number" required error={errors.hrPhone}>
            <PhoneInput
              id="hr-phone"
              defaultCountry="IN"
              international
              withCountryCallingCode
              countrySelectComponent={SearchableCountrySelect}
              placeholder="e.g. 82701 69894"
              value={values.hrPhone}
              onChange={(value) => {
                setValues((prev) => ({ ...prev, hrPhone: value }));
                setErrors((prev) => ({ ...prev, hrPhone: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.hrPhone}
              autoComplete="tel"
            />
          </FormField>

        {/* Form actions */}
        <div className="pt-4 flex flex-col gap-3 border-t border-siet-border">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Continue to Email Verification'}
          </button>
        </div>


      </form>
    </WorkflowLayout>
  );
}

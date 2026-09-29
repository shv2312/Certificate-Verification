/**
 * RequesterPage — Step 1 of the verification workflow.
 *
 * The requester provides:
 *  - Organization Type & Name
 *  - Requester Name, Role, Email, and Phone
 *
 * On form submission, the backend initiates an email verification flow.
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import FormField from '../components/FormField';
import StatusMessage from '../components/StatusMessage';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import SearchableCountrySelect from '../components/SearchableCountrySelect';
import { registerRequester } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

const REQUESTER_DRAFT_KEY = 'siet_requester_draft';

interface FormValues {
  organizationType: string;
  organizationName: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  requesterPhone: string | undefined;
}

const defaultValues: FormValues = {
  organizationType: '',
  organizationName: '',
  requesterName: '',
  requesterEmail: '',
  requesterRole: '',
  requesterPhone: undefined,
};

interface FormErrors {
  organizationType?: string;
  organizationName?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterRole?: string;
  requesterPhone?: string;
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.organizationType.trim()) errors.organizationType = 'Organization type is required.';
  if (!values.organizationName.trim()) errors.organizationName = 'Organization name is required.';
  if (!values.requesterName.trim())      errors.requesterName      = 'Requester name is required.';
  if (!values.requesterEmail.trim()) {
    errors.requesterEmail = 'Official email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.requesterEmail)) {
    errors.requesterEmail = 'Please enter a valid email address.';
  }
  if (!values.requesterPhone) {
    errors.requesterPhone = 'Phone number is required.';
  } else if (!isValidPhoneNumber(values.requesterPhone)) {
    errors.requesterPhone = 'Please enter a valid phone number.';
  }
  return errors;
}

export default function RequesterPage() {
  const navigate = useNavigate();
  const { setPartialAuth } = useAuth();
  
  const [values, setValues] = useState<FormValues>(() => {
    try {
      const cached = sessionStorage.getItem(REQUESTER_DRAFT_KEY);
      if (cached) {
        return { ...defaultValues, ...JSON.parse(cached) };
      }
    } catch (err) {
      console.error('Failed to load requester draft from sessionStorage:', err);
    }
    return defaultValues;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(REQUESTER_DRAFT_KEY, JSON.stringify(values));
    } catch (err) {
      console.error('Failed to sync requester draft to sessionStorage:', err);
    }
  }, [values]);

  const [errors,   setErrors]   = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const response = await registerRequester({
        organizationType: values.organizationType,
        organizationName: values.organizationName,
        requesterName: values.requesterName,
        requesterEmail: values.requesterEmail,
        requesterRole: values.requesterRole,
        requesterPhone: values.requesterPhone || '',
      });
      setPartialAuth(response.requestId, values.requesterEmail);
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred during registration.');
      setIsSubmitting(false);
    }
  }

  return (
    <WorkflowLayout 
      stepIndex={0} 
      title="Requester Details" 
      description="Provide your organization and contact information to initiate the verification process."
    >
      {/* ── Requester details form ── */}
      <form
        className="max-w-2xl mx-auto surface-card p-6 space-y-5"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Requester registration form"
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

          <FormField id="org-type" label="Verification Requested By" required error={errors.organizationType}>
            <select
              id="org-type"
              className="form-input"
              value={values.organizationType}
              onChange={handleChange('organizationType')}
              aria-required="true"
              aria-invalid={!!errors.organizationType}
            >
              <option value="" disabled>Select Organization Type</option>
              <option value="Private Organization">Private Organization</option>
              <option value="Government Organization">Government Organization</option>
            </select>
          </FormField>

          <FormField id="org-name" label="Organization / Entity Name" required error={errors.organizationName}>
            <input
              id="org-name"
              type="text"
              className="form-input"
              placeholder="e.g. Acme Technologies Pvt. Ltd."
              value={values.organizationName}
              onChange={handleChange('organizationName')}
              aria-required="true"
              aria-invalid={!!errors.organizationName}
            />
          </FormField>

          <FormField id="requester-name" label="Requester Full Name" required error={errors.requesterName}>
            <input
              id="requester-name"
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={values.requesterName}
              onChange={handleChange('requesterName')}
              aria-required="true"
              aria-invalid={!!errors.requesterName}
            />
          </FormField>

          <FormField id="requester-email" label="Official Email Address" required error={errors.requesterEmail}>
            <input
              id="requester-email"
              type="email"
              className="form-input"
              placeholder="hr@company.com"
              value={values.requesterEmail}
              onChange={handleChange('requesterEmail')}
              aria-required="true"
              aria-invalid={!!errors.requesterEmail}
              autoComplete="email"
            />
          </FormField>

          <FormField id="requester-role" label="Requester Role / Designation" error={errors.requesterRole}>
            <input
              id="requester-role"
              type="text"
              className="form-input"
              placeholder="e.g. HR Manager, Background Screener"
              value={values.requesterRole}
              onChange={handleChange('requesterRole')}
              aria-invalid={!!errors.requesterRole}
            />
          </FormField>

          <FormField id="requester-phone" label="Contact Phone Number" required error={errors.requesterPhone}>
            <PhoneInput
              id="requester-phone"
              defaultCountry="IN"
              international
              withCountryCallingCode
              countrySelectComponent={SearchableCountrySelect}
              placeholder="e.g. 82701 69894"
              value={values.requesterPhone}
              onChange={(value) => {
                setValues((prev) => ({ ...prev, requesterPhone: value }));
                setErrors((prev) => ({ ...prev, requesterPhone: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.requesterPhone}
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

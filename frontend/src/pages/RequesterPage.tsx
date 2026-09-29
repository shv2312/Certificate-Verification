/**
 * RequesterPage — Step 1 of the verification workflow.
 *
 * Collects Requester & Organization Details:
 *  - organization_type (Optional)
 *  - organization_name (2-200 chars)
 *  - requester_name (2-255 chars)
 *  - requester_email (RFC-5321 Email)
 *  - requester_role (Optional, max 150 chars)
 *  - requester_phone (E.164 phone string)
 *
 * Submits exact JSON payload matching FastAPI backend SendOTPRequest.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import FormField from '../components/FormField';
import StatusMessage from '../components/StatusMessage';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import SearchableCountrySelect from '../components/SearchableCountrySelect';
import { registerRequester } from '../api/auth';
import { ApiError } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

const REQUESTER_DRAFT_KEY = 'siet_requester_draft';

interface FormValues {
  organization_type: string;
  organization_name: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  requester_phone: string | undefined;
}

const defaultValues: FormValues = {
  organization_type: '',
  organization_name: '',
  requester_name: '',
  requester_email: '',
  requester_role: '',
  requester_phone: undefined,
};

interface FormErrors {
  organization_type?: string;
  organization_name?: string;
  requester_name?: string;
  requester_email?: string;
  requester_role?: string;
  requester_phone?: string;
}

/**
 * Replicates server-side validation rules from SendOTPRequest.
 */
function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const orgName = values.organization_name.trim();
  if (!orgName) {
    errors.organization_name = 'Organization name is required.';
  } else if (orgName.length < 2) {
    errors.organization_name = 'Organization name must be at least 2 characters.';
  } else if (orgName.length > 200) {
    errors.organization_name = 'Organization name cannot exceed 200 characters.';
  }

  const reqName = values.requester_name.trim();
  if (!reqName) {
    errors.requester_name = 'Requester full name is required.';
  } else if (reqName.length < 2) {
    errors.requester_name = 'Requester name must be at least 2 characters.';
  } else if (reqName.length > 255) {
    errors.requester_name = 'Requester name cannot exceed 255 characters.';
  }

  const email = values.requester_email.trim();
  if (!email) {
    errors.requester_email = 'Official email address is required.';
  } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    errors.requester_email = 'Please enter a valid official email address.';
  }

  if (values.requester_role && values.requester_role.trim().length > 150) {
    errors.requester_role = 'Role cannot exceed 150 characters.';
  }

  const phone = values.requester_phone?.trim();
  if (!phone) {
    errors.requester_phone = 'Contact phone number is required.';
  } else if (!isValidPhoneNumber(phone)) {
    errors.requester_phone = 'Please enter a valid phone number with country code.';
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
        const parsed = JSON.parse(cached);
        // Handle migration from legacy camelCase keys if present in storage
        return {
          organization_type: parsed.organization_type ?? parsed.organizationType ?? '',
          organization_name: parsed.organization_name ?? parsed.organizationName ?? '',
          requester_name: parsed.requester_name ?? parsed.requesterName ?? '',
          requester_email: parsed.requester_email ?? parsed.requesterEmail ?? '',
          requester_role: parsed.requester_role ?? parsed.requesterRole ?? '',
          requester_phone: parsed.requester_phone ?? parsed.requesterPhone ?? undefined,
        };
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setSubmitError(undefined);
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors = validateForm(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setSubmitError(undefined);

    try {
      // Trigger actual asynchronous backend API call to send verification OTP
      const response = await registerRequester({
        organization_type: values.organization_type.trim() || null,
        organization_name: values.organization_name.trim(),
        requester_name: values.requester_name.trim(),
        requester_email: values.requester_email.trim(),
        requester_role: values.requester_role.trim() || null,
        requester_phone: values.requester_phone || '',
      });

      // If development OTP returned by backend, cache in sessionStorage for UI autofill
      if (response.devOtp) {
        sessionStorage.setItem('siet_dev_otp', response.devOtp);
      }

      // STRICT STATE TRANSITION: Only advance to Step 2 upon successful 200 OK response
      setPartialAuth(response.requestId, values.requester_email.trim());
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (err: any) {
      console.error('[RequesterPage] Verification request failed:', err);

      let errorMessage = 'Failed to send verification email. Please check server connection.';
      if (err instanceof ApiError) {
        if (err.status === 409) {
          errorMessage = err.message || 'A verification code was recently sent. Please wait before requesting another.';
        } else if (err.status === 422) {
          errorMessage = err.message || 'Validation error: Please check that all submitted fields match required formats.';
        } else if (err.status === 0 || err.errorCode === 'NETWORK_FAILURE') {
          errorMessage = 'Failed to send verification email. Please check server connection.';
        } else if (err.status >= 500) {
          errorMessage = err.message || 'Failed to send verification email. Please check server connection.';
        } else {
          errorMessage = err.message || 'Failed to send verification email.';
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      // ABORT step transition on failure: stay on Step 1 and display inline error
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <WorkflowLayout 
      stepIndex={0} 
      title="Requester Details" 
      description="Provide your organization and contact information to initiate the verification process."
    >
      <form
        className="max-w-2xl mx-auto surface-card p-6 space-y-5"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Requester registration form"
      >
        {submitError && (
          <div className="space-y-3 mb-4">
            <StatusMessage type="error" message={submitError} />
            {import.meta.env.DEV && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-200">
                <div>
                  <span className="font-semibold text-amber-300 block">Developer Local Testing Fallback</span>
                  <span>Backend unavailable? Use test OTP <code className="font-mono bg-amber-900/50 px-1 py-0.5 rounded text-amber-100 font-bold">123456</code> to continue testing UI.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const devOtp = '123456';
                    console.log(`%c[DEV MODE] 🔑 Bypassed email block with test OTP: ${devOtp}`, 'color: #10b981; font-weight: bold;');
                    sessionStorage.setItem('siet_dev_otp', devOtp);
                    setPartialAuth(`dev_challenge_${Date.now()}`, values.requester_email.trim());
                    navigate(ROUTES.VERIFY_EMAIL);
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Dev Bypass (Use 123456)
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-siet-muted">
          Fields marked with{' '}
          <span className="text-siet-error font-semibold" aria-hidden="true">*</span>
          <span className="sr-only">an asterisk</span>
          {' '}are mandatory.
        </p>

        <FormField id="org-type" label="Verification Requested By (Optional)" error={errors.organization_type}>
          <select
            id="org-type"
            className="form-input"
            value={values.organization_type}
            onChange={handleChange('organization_type')}
            aria-invalid={!!errors.organization_type}
          >
            <option value="">Select Organization Type</option>
            <option value="Private Organization">Private Organization</option>
            <option value="Government Organization">Government Organization</option>
            <option value="Background Screening Agency">Background Screening Agency</option>
            <option value="Academic Institution">Academic Institution</option>
          </select>
        </FormField>

        <FormField id="org-name" label="Organization / Entity Name" required error={errors.organization_name}>
          <input
            id="org-name"
            type="text"
            className="form-input"
            placeholder="e.g. Acme Technologies Pvt. Ltd."
            maxLength={200}
            value={values.organization_name}
            onChange={handleChange('organization_name')}
            aria-required="true"
            aria-invalid={!!errors.organization_name}
          />
        </FormField>

        <FormField id="requester-name" label="Requester Full Name" required error={errors.requester_name}>
          <input
            id="requester-name"
            type="text"
            className="form-input"
            placeholder="e.g. Jane Doe"
            maxLength={255}
            value={values.requester_name}
            onChange={handleChange('requester_name')}
            aria-required="true"
            aria-invalid={!!errors.requester_name}
          />
        </FormField>

        <FormField id="requester-email" label="Official Email Address" required error={errors.requester_email}>
          <input
            id="requester-email"
            type="email"
            className="form-input"
            placeholder="hr@company.com"
            value={values.requester_email}
            onChange={handleChange('requester_email')}
            aria-required="true"
            aria-invalid={!!errors.requester_email}
            autoComplete="email"
          />
        </FormField>

        <FormField id="requester-role" label="Requester Role / Designation (Optional)" error={errors.requester_role}>
          <input
            id="requester-role"
            type="text"
            className="form-input"
            placeholder="e.g. HR Manager, Background Screener"
            maxLength={150}
            value={values.requester_role}
            onChange={handleChange('requester_role')}
            aria-invalid={!!errors.requester_role}
          />
        </FormField>

        <FormField id="requester-phone" label="Contact Phone Number" required error={errors.requester_phone}>
          <PhoneInput
            id="requester-phone"
            defaultCountry="IN"
            international
            withCountryCallingCode
            countrySelectComponent={SearchableCountrySelect}
            placeholder="e.g. +91 98765 43210"
            value={values.requester_phone}
            onChange={(value) => {
              setValues((prev) => ({ ...prev, requester_phone: value }));
              setErrors((prev) => ({ ...prev, requester_phone: undefined }));
              setSubmitError(undefined);
            }}
            aria-required="true"
            aria-invalid={!!errors.requester_phone}
            autoComplete="tel"
          />
        </FormField>

        <div className="pt-4 flex flex-col gap-3 border-t border-siet-border">
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending verification code...</span>
              </>
            ) : (
              'Continue to Email Verification'
            )}
          </button>
        </div>
      </form>
    </WorkflowLayout>
  );
}

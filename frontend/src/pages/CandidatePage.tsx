import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';
import CertificateUploadZone from '../components/CertificateUploadZone';
import { buildStepStatuses } from '../utils/workflowSteps';
import { ROUTES } from '../utils/routes';
import type { CandidateDetails } from '../types/api';
import { ApiError } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { initiateVerification } from '../api/verification';
import StatusMessage from '../components/StatusMessage';

const CANDIDATE_DRAFT_KEY = 'siet_candidate_draft';
const steps = buildStepStatuses(2); // Step index 2: Candidate Details

interface FormValues {
  candidate_name: string;
  dob: string;
  register_number: string;
  degree: string;
  specialization: string;
  year_of_passing: string;
  certificate_no: string;
  year_of_enrolment: string;
  class_obtained: string;
}

interface CandidateDraftState extends FormValues {
  certificate_url: string;
  certificate_name?: string;
  certificate_size?: number;
  certificate_type?: string;
}

const defaultDraft: CandidateDraftState = {
  candidate_name: '',
  dob: '',
  register_number: '',
  degree: '',
  specialization: '',
  year_of_passing: '',
  certificate_no: '',
  year_of_enrolment: '',
  class_obtained: '',
  certificate_url: '',
  certificate_name: '',
  certificate_size: undefined,
  certificate_type: '',
};

interface FormErrors {
  candidate_name?: string;
  dob?: string;
  register_number?: string;
  degree?: string;
  specialization?: string;
  year_of_passing?: string;
  certificate_no?: string;
  year_of_enrolment?: string;
  certificate?: string;
}

/**
 * Replicates server-side CandidateDetails schema validation logic.
 */
function validateForm(
  values: FormValues,
  certificateUrl: string,
): FormErrors {
  const errors: FormErrors = {};

  const name = values.candidate_name.trim();
  if (!name) {
    errors.candidate_name = 'Candidate name is required.';
  } else if (name.length < 2) {
    errors.candidate_name = 'Candidate name must be at least 2 characters.';
  } else if (name.length > 150) {
    errors.candidate_name = 'Candidate name cannot exceed 150 characters.';
  }

  const dob = values.dob.trim();
  if (!dob) {
    errors.dob = 'Date of birth is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    errors.dob = 'Date of birth must be in YYYY-MM-DD format.';
  } else {
    const parsedDate = new Date(dob);
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      errors.dob = 'Please enter a valid past date of birth.';
    }
  }

  const regNum = values.register_number.trim();
  if (!regNum) {
    errors.register_number = 'Register / Roll number is required.';
  } else if (regNum.length < 3) {
    errors.register_number = 'Register number must be at least 3 characters.';
  } else if (regNum.length > 30) {
    errors.register_number = 'Register number cannot exceed 30 characters.';
  } else if (!/^[A-Za-z0-9\-/]+$/.test(regNum)) {
    errors.register_number = 'Register number must contain only letters, digits, hyphens, or slashes.';
  }

  const degree = values.degree.trim();
  if (!degree) {
    errors.degree = 'Degree / Course title is required.';
  } else if (degree.length < 2 || degree.length > 100) {
    errors.degree = 'Degree must be between 2 and 100 characters.';
  }

  const spec = values.specialization.trim();
  if (!spec) {
    errors.specialization = 'Field of study / specialization is required.';
  } else if (spec.length < 2 || spec.length > 150) {
    errors.specialization = 'Specialization must be between 2 and 150 characters.';
  }

  const yop = parseInt(values.year_of_passing, 10);
  if (!values.year_of_passing.trim() || isNaN(yop)) {
    errors.year_of_passing = 'Year of passing is required.';
  } else if (yop < 1990 || yop > 2100) {
    errors.year_of_passing = 'Year of passing must be between 1990 and 2100.';
  }

  const certNo = values.certificate_no.trim();
  if (!certNo) {
    errors.certificate_no = 'Certificate number is required.';
  } else if (certNo.length < 2 || certNo.length > 100) {
    errors.certificate_no = 'Certificate number must be between 2 and 100 characters.';
  }

  if (values.year_of_enrolment.trim()) {
    const yoe = parseInt(values.year_of_enrolment, 10);
    if (isNaN(yoe) || yoe < 1990 || yoe > 2100) {
      errors.year_of_enrolment = 'Year of enrolment must be between 1990 and 2100.';
    } else if (!isNaN(yop) && yoe > yop) {
      errors.year_of_enrolment = 'Year of enrolment cannot be after year of passing.';
    }
  }

  if (!certificateUrl) {
    errors.certificate = 'Please upload the degree / provisional certificate.';
  }

  return errors;
}

const DEGREES = ['B.E.', 'B.Tech', 'M.E.', 'MBA', 'MCA', 'B.Sc.', 'M.Sc.', 'Ph.D'];
const RECENT_YEARS = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i);

export default function CandidatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CandidateDraftState>(() => {
    try {
      const cached = sessionStorage.getItem(CANDIDATE_DRAFT_KEY);
      if (cached) {
        return { ...defaultDraft, ...JSON.parse(cached) };
      }
    } catch (err) {
      console.error('Failed to load candidate draft from sessionStorage:', err);
    }
    return defaultDraft;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CANDIDATE_DRAFT_KEY, JSON.stringify(formData));
    } catch (err) {
      console.error('Failed to sync candidate draft to sessionStorage:', err);
    }
  }, [formData]);
  
  const { sessionToken, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setApiError(null);
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);

    const newErrors = validateForm(formData, formData.certificate_url);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Retrieve active session token
    const effectiveToken = sessionToken || (() => {
      try {
        const raw = sessionStorage.getItem('siet_auth_state');
        return raw ? JSON.parse(raw).sessionToken : null;
      } catch {
        return null;
      }
    })();

    if (!effectiveToken && !isAuthenticated) {
      setApiError('Authentication session not found or expired. Please verify your email first.');
      return;
    }

    setIsLoading(true);

    // Exact backend CandidateDetails payload structure
    const candidatePayload: CandidateDetails = {
      candidate_name: formData.candidate_name.trim(),
      dob: formData.dob.trim(),
      register_number: formData.register_number.trim().toUpperCase(),
      degree: formData.degree.trim(),
      degree_course: formData.degree.trim(),
      specialization: formData.specialization.trim(),
      year_of_passing: parseInt(formData.year_of_passing, 10),
      certificate_no: formData.certificate_no.trim(),
      year_of_enrolment: formData.year_of_enrolment.trim() ? parseInt(formData.year_of_enrolment, 10) : null,
      class_obtained: formData.class_obtained.trim() || null,
      certificate_url: formData.certificate_url || null,
    };

    try {
      const response = await initiateVerification(
        {
          candidate_name: candidatePayload.candidate_name,
          register_number: candidatePayload.register_number,
          degree: candidatePayload.degree,
          degree_course: candidatePayload.degree,
          specialization: candidatePayload.specialization,
          year_of_passing: candidatePayload.year_of_passing,
          dob: candidatePayload.dob,
          certificate_no: candidatePayload.certificate_no,
          year_of_enrolment: candidatePayload.year_of_enrolment,
          class_obtained: candidatePayload.class_obtained,
          certificate_url: candidatePayload.certificate_url,
        },
        effectiveToken || undefined
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initiate verification order.');
      }

      const {
        verification_request_id,
        payment_order_id,
        display_request_id,
        amount_paise,
        gateway_key_id,
        payment_session_id,
      } = response.data;

      // Securely store active request and payment draft
      sessionStorage.setItem('siet_active_request_id', verification_request_id);
      sessionStorage.setItem('siet_active_display_id', display_request_id);
      sessionStorage.setItem('siet_payment_order_id', payment_order_id);
      sessionStorage.setItem(
        'siet_payment_draft',
        JSON.stringify({
          payment_session_id,
          gateway_order_id: payment_order_id,
          amount_paise,
          currency: response.data.currency || 'INR',
          gateway_key_id,
          verification_request_id,
          display_request_id,
        })
      );
      sessionStorage.setItem('candidatePayload', JSON.stringify(candidatePayload));
      sessionStorage.setItem(CANDIDATE_DRAFT_KEY, JSON.stringify(formData));

      // Secure transition to Step 4 (Secure Payment)
      navigate(ROUTES.PAYMENT);
    } catch (err: any) {
      console.error('Candidate verification initiate error:', err);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setApiError('Your session has expired or is unauthorized. Please verify your email again.');
        } else {
          setApiError(err.message || 'Validation failed. Please verify candidate details.');
        }
      } else {
        setApiError(err.message || 'Failed to initiate verification order. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Candidate Details</h1>
        <p className="text-siet-slate text-sm">
          Enter the candidate's academic details and upload the certificate for verification.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <form className="max-w-2xl mx-auto surface-card p-6 space-y-6" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <StatusMessage
            type="error"
            title="Verification Initialization Error"
            message={apiError}
          />
        )}

        <p className="text-xs text-siet-muted">
          Fields marked with <span className="text-siet-error font-semibold">*</span> are mandatory.
        </p>

        {/* ── Candidate Details ── */}
        <div className="space-y-5 pb-4 border-b border-siet-border">
          <FormField id="candidate-name" label="Candidate Full Name" required error={errors.candidate_name}>
            <input
              id="candidate-name"
              type="text"
              className="form-input"
              placeholder="Full name as on certificate"
              maxLength={150}
              value={formData.candidate_name}
              onChange={handleChange('candidate_name')}
              aria-required="true"
              aria-invalid={!!errors.candidate_name}
            />
          </FormField>

          <FormField id="dob" label="Date of Birth" required error={errors.dob}>
            <input
              id="dob"
              type="date"
              className="form-input"
              value={formData.dob}
              onChange={handleChange('dob')}
              aria-required="true"
              aria-invalid={!!errors.dob}
            />
          </FormField>

          <FormField id="register-number" label="Register Number / Roll Number" required error={errors.register_number}>
            <input
              id="register-number"
              type="text"
              className="form-input uppercase"
              placeholder="e.g. 710621104001"
              maxLength={30}
              value={formData.register_number}
              onChange={handleChange('register_number')}
              aria-required="true"
              aria-invalid={!!errors.register_number}
            />
            <span className="text-xs text-slate-500 mt-1 block">
              Letters, numbers, hyphens, and slashes only (3-30 chars).
            </span>
          </FormField>
          
          <FormField id="degree" label="Degree / Course Title" required error={errors.degree}>
            <select
              id="degree"
              className="form-input"
              value={formData.degree}
              onChange={handleChange('degree')}
              aria-required="true"
              aria-invalid={!!errors.degree}
            >
              <option value="" disabled>Select Degree</option>
              {DEGREES.map(deg => <option key={deg} value={deg}>{deg}</option>)}
            </select>
          </FormField>

          <FormField id="specialization" label="Field of Study / Specialization" required error={errors.specialization}>
            <input
              id="specialization"
              type="text"
              className="form-input"
              placeholder="e.g. Computer Science and Engineering"
              maxLength={150}
              value={formData.specialization}
              onChange={handleChange('specialization')}
              aria-required="true"
              aria-invalid={!!errors.specialization}
            />
          </FormField>

          <FormField id="year-of-passing" label="Year of Graduation / Passing" required error={errors.year_of_passing}>
            <select
              id="year-of-passing"
              className="form-input"
              value={formData.year_of_passing}
              onChange={handleChange('year_of_passing')}
              aria-required="true"
              aria-invalid={!!errors.year_of_passing}
            >
              <option value="" disabled>Select Year</option>
              {RECENT_YEARS.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
            </select>
          </FormField>

          <FormField id="certificate-no" label="Degree Certificate Number" required error={errors.certificate_no}>
            <input
              id="certificate-no"
              type="text"
              className="form-input"
              placeholder="e.g. CERT-123456"
              maxLength={100}
              value={formData.certificate_no}
              onChange={handleChange('certificate_no')}
              aria-required="true"
              aria-invalid={!!errors.certificate_no}
            />
          </FormField>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="year-of-enrolment" label="Year of Enrolment (Optional)" error={errors.year_of_enrolment}>
              <select
                id="year-of-enrolment"
                className="form-input"
                value={formData.year_of_enrolment}
                onChange={handleChange('year_of_enrolment')}
              >
                <option value="">Select Year</option>
                {RECENT_YEARS.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
              </select>
            </FormField>

            <FormField id="class-obtained" label="Class Obtained (Optional)">
              <select
                id="class-obtained"
                className="form-input"
                value={formData.class_obtained}
                onChange={handleChange('class_obtained')}
              >
                <option value="">Select Class</option>
                <option value="First Class with Distinction">First Class with Distinction</option>
                <option value="First Class">First Class</option>
                <option value="Second Class">Second Class</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* ── Certificate Upload ── */}
        <div className="space-y-3 pb-4">
          <p className="text-xs font-bold text-siet-muted uppercase tracking-wider">
            Document Upload
          </p>
          <CertificateUploadZone
            certificateUrl={formData.certificate_url}
            certificateMeta={formData.certificate_name ? {
              name: formData.certificate_name,
              size: formData.certificate_size,
              type: formData.certificate_type,
            } : undefined}
            onUpload={(url, meta) => {
              setFormData((prev) => ({
                ...prev,
                certificate_url: url,
                certificate_name: meta?.name || '',
                certificate_size: meta?.size,
                certificate_type: meta?.type || '',
              }));
              setErrors((prev) => ({ ...prev, certificate: undefined }));
            }}
            onRemove={() => {
              setFormData((prev) => ({
                ...prev,
                certificate_url: '',
                certificate_name: '',
                certificate_size: undefined,
                certificate_type: '',
              }));
            }}
            error={errors.certificate}
          />
        </div>

        {/* Verification Fee Notice Card */}
        <div className="p-4 bg-brand-light border border-emerald-200 rounded-xl text-center">
          <p className="text-brand-forest font-bold mb-1">
            Verification Fee: ₹1,500.00 <span className="font-normal text-brand-green mx-2">|</span> Standard Processing: 3-5 Working Days
          </p>
          <p className="text-brand-forest/80 text-sm">
            You will be redirected to the secure payment portal upon submission.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Initiating Verification Order...</span>
              </>
            ) : (
              'Continue to Payment'
            )}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

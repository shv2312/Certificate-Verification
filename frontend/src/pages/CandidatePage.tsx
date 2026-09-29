import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';
import CertificateUploadZone from '../components/CertificateUploadZone';
import { buildStepStatuses } from '../utils/workflowSteps';
import { ROUTES } from '../utils/routes';

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
  certificate?: string;
}

function validateForm(
  values: FormValues,
  certificateUrl: string,
): FormErrors {
  const errors: FormErrors = {};
  if (!values.candidate_name.trim()) errors.candidate_name = 'Candidate name is required.';
  if (!values.dob.trim()) errors.dob = 'Date of birth is required.';
  if (!values.register_number.trim()) errors.register_number = 'Register number is required.';
  if (!values.degree.trim()) errors.degree = 'Degree / Course title is required.';
  if (!values.specialization.trim()) errors.specialization = 'Specialization is required.';
  if (!values.year_of_passing.trim()) errors.year_of_passing = 'Year of passing is required.';
  if (!values.certificate_no.trim()) errors.certificate_no = 'Certificate number is required.';
  if (!certificateUrl) errors.certificate = 'Please upload the degree / provisional certificate.';
  return errors;
}

const DEGREES = ['B.E.', 'B.Tech', 'M.E.', 'MBA', 'MCA', 'B.Sc.', 'M.Sc.', 'Ph.D'];
const RECENT_YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

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
  
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors = validateForm(formData, formData.certificate_url);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save candidate payload to session storage before payment
    const candidatePayload = {
      candidate_name: formData.candidate_name,
      dob: formData.dob,
      register_number: formData.register_number,
      degree: formData.degree,
      specialization: formData.specialization,
      year_of_passing: parseInt(formData.year_of_passing, 10),
      certificate_no: formData.certificate_no,
      year_of_enrolment: formData.year_of_enrolment ? parseInt(formData.year_of_enrolment, 10) : undefined,
      class_obtained: formData.class_obtained || undefined,
      certificate_url: formData.certificate_url,
    };
    sessionStorage.setItem('candidatePayload', JSON.stringify(candidatePayload));
    sessionStorage.setItem(CANDIDATE_DRAFT_KEY, JSON.stringify(formData));

    // Navigate directly to the Payment page
    navigate(ROUTES.PAYMENT);
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
              value={formData.candidate_name}
              onChange={handleChange('candidate_name')}
            />
          </FormField>

          <FormField id="dob" label="Date of Birth" required error={errors.dob}>
            <input
              id="dob"
              type="date"
              className="form-input"
              value={formData.dob}
              onChange={handleChange('dob')}
            />
          </FormField>

          <FormField id="register-number" label="Register Number / Roll Number" required error={errors.register_number}>
            <input
              id="register-number"
              type="text"
              className="form-input"
              placeholder="e.g. 710621104001"
              value={formData.register_number}
              onChange={handleChange('register_number')}
            />
          </FormField>
          
          <FormField id="degree" label="Degree / Course Title" required error={errors.degree}>
            <select
              id="degree"
              className="form-input"
              value={formData.degree}
              onChange={handleChange('degree')}
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
              value={formData.specialization}
              onChange={handleChange('specialization')}
            />
          </FormField>

          <FormField id="year-of-passing" label="Year of Graduation / Passing" required error={errors.year_of_passing}>
            <select
              id="year-of-passing"
              className="form-input"
              value={formData.year_of_passing}
              onChange={handleChange('year_of_passing')}
            >
              <option value="" disabled>Select Year</option>
              {RECENT_YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </FormField>

          <FormField id="certificate-no" label="Degree Certificate Number" required error={errors.certificate_no}>
            <input
              id="certificate-no"
              type="text"
              className="form-input"
              placeholder="e.g. CERT-123456"
              value={formData.certificate_no}
              onChange={handleChange('certificate_no')}
            />
          </FormField>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="year-of-enrolment" label="Year of Enrolment (Optional)">
              <select
                id="year-of-enrolment"
                className="form-input"
                value={formData.year_of_enrolment}
                onChange={handleChange('year_of_enrolment')}
              >
                <option value="">Select Year</option>
                {RECENT_YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
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
          <button type="submit" className="btn-primary w-full">
            Proceed to Payment
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

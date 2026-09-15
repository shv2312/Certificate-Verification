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
  course: string;
  branch: string;
  year_of_passing: string;
}

interface FormErrors {
  candidate_name?: string;
  register_number?: string;
  course?: string;
  branch?: string;
  year_of_passing?: string;
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.candidate_name.trim()) errors.candidate_name = 'Candidate name is required.';
  if (!values.register_number.trim()) errors.register_number = 'Register number is required.';
  if (!values.course.trim()) errors.course = 'Course is required.';
  if (!values.branch.trim()) errors.branch = 'Branch is required.';
  if (!values.year_of_passing.trim()) errors.year_of_passing = 'Year of passing is required.';
  else if (isNaN(Number(values.year_of_passing))) errors.year_of_passing = 'Must be a valid year.';
  return errors;
}

export default function CandidatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({
    candidate_name: '',
    register_number: '',
    course: '',
    branch: '',
    year_of_passing: '',
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
        candidate: {
          ...values,
          year_of_passing: Number(values.year_of_passing),
        },
      });
      // Navigate to Confirm page and pass the verification_request_id in state
      navigate(ROUTES.CONFIRM, { state: { verification_request_id: mockVerificationRequestId } });
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
          Enter the academic details of the candidate you wish to verify.
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

        <FormField id="course" label="Course" required error={errors.course}>
          <select id="course" className="form-select" value={values.course} onChange={handleChange('course')}>
            <option value="">Select Course</option>
            <option value="B.E.">B.E.</option>
            <option value="B.Tech.">B.Tech.</option>
            <option value="M.E.">M.E.</option>
          </select>
        </FormField>

        <FormField id="branch" label="Branch" required error={errors.branch}>
          <input
            id="branch"
            type="text"
            className="form-input"
            value={values.branch}
            onChange={handleChange('branch')}
          />
        </FormField>

        <FormField id="year-of-passing" label="Year of Passing" required error={errors.year_of_passing}>
          <input
            id="year-of-passing"
            type="text"
            className="form-input"
            value={values.year_of_passing}
            onChange={handleChange('year_of_passing')}
          />
        </FormField>

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Continue'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

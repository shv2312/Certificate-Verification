/**
 * EmailVerificationPage — Step 2 of the verification workflow.
 *
 * The HR user must enter the token sent to their official email.
 *
 * On success, the backend (FastAPI) verifies the token and returns the
 * user's role ('hr' or 'admin'). The frontend AuthContext is updated,
 * and the user is routed to the appropriate next step.
 *
 * INTEGRATION: Connected to POST /api/v1/email/verify-otp
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';
import StatusMessage from '../components/StatusMessage';
import { buildStepStatuses } from '../utils/workflowSteps';
import { useAuth } from '../context/AuthContext';
import { verifyEmail, resendVerification } from '../api/auth';
import { ROUTES } from '../utils/routes';

const steps = buildStepStatuses(1); // Step index 1 = Email Verification

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestId, hrEmail, setRole, isAuthenticated, role } = useAuth();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // If already fully authenticated, redirect them out of the verification flow
  if (isAuthenticated && role) {
    return <Navigate to={role === 'admin' ? '/admin' : ROUTES.PAYMENT} replace />;
  }

  // If they arrived here without completing Step 1 (no requestId in context), send back
  if (!requestId || !hrEmail) {
    return <Navigate to={ROUTES.COMPANY} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (token.length < 6) {
      setError('Verification code must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      // Call API (currently mocked)
      const response = await verifyEmail({ challengeId: requestId!, token });
      
      // Update global auth state with the trusted role returned by backend
      setRole(response.role);

      // Route based on role
      if (response.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(ROUTES.PAYMENT, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendStatus('loading');
    setError(undefined);
    try {
      await resendVerification(requestId!);
      setResendStatus('success');
      // Reset success message after 5 seconds
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email.');
      setResendStatus('idle');
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">Email Verification</h1>
        <p className="text-siet-slate text-sm">
          Verify your official email address to continue the process.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <div className="surface-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-siet-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-siet-navy">Check your inbox</h2>
          <p className="text-sm text-siet-slate mt-2">
            We've sent a verification code to:<br />
            <strong className="text-siet-navy">{hrEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="max-w-xs mx-auto space-y-5">
          <FormField id="token" label="Verification Code" error={error}>
            <input
              id="token"
              type="text"
              className="form-input text-center text-lg tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
              value={token}
              onChange={(e) => {
                setToken(e.target.value.replace(/\D/g, ''));
                setError(undefined);
              }}
              disabled={isSubmitting}
              autoComplete="one-time-code"
              aria-required="true"
            />
          </FormField>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting || token.length < 6}
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-siet-border pt-6">
          <p className="text-sm text-siet-slate mb-3">
            Didn't receive the email? Check your spam folder or request a new code.
          </p>
          {resendStatus === 'success' ? (
            <p className="text-sm text-siet-success font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              New code sent successfully.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'loading'}
              className="text-sm font-medium text-siet-sky hover:text-siet-sky600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendStatus === 'loading' ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>

      {import.meta.env.DEV && (
        <StatusMessage
          type="warning"
          title="Development Mode"
          message="API mocked. Enter any 6-digit code EXCEPT '000000' to succeed. If email is 'admin@siet.ac.in' you will become an Admin."
          className="mt-6"
        />
      )}
    </PageContainer>
  );
}

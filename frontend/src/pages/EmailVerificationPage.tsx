/**
 * EmailVerificationPage — Step 2 of the verification workflow.
 *
 * Validates the 6-digit OTP code against:
 *   POST /api/v1/email/verify-otp
 *
 * Backend returns:
 *   session_token, verified_company, verified_email, role ('HR' | 'ADMIN')
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { verifyEmail, resendVerification } from '../api/auth';
import { ApiError } from '../types/api';
import { ROUTES } from '../utils/routes';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestId, hrEmail, setRole, isAuthenticated, role } = useAuth();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // If already fully authenticated, redirect out of verification workflow
  if (isAuthenticated && role) {
    return <Navigate to={role === 'admin' ? '/admin' : ROUTES.CANDIDATE} replace />;
  }

  // If arrived here without initiating Step 1, redirect back to Requester page
  if (!requestId || !hrEmail) {
    return <Navigate to={ROUTES.REQUESTER} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanToken = token.trim();

    if (!cleanToken) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!/^\d{6}$/.test(cleanToken)) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      // Exact backend payload matching VerifyOTPRequest
      const response = await verifyEmail({
        challenge_id: requestId!,
        otp: cleanToken,
      });
      
      const normalizedRole = response.role?.toLowerCase() === 'admin' ? 'admin' : 'hr';
      setRole(normalizedRole, response.token);

      if (normalizedRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(ROUTES.CANDIDATE, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(err.message || 'The verification code has expired or maximum attempts were exceeded. Please request a new code.');
        } else if (err.status === 422) {
          setError('Invalid code format. Please enter the 6-digit code received in your email.');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendStatus('loading');
    setError(undefined);
    try {
      const response = await resendVerification(requestId!);
      setResendStatus('success');
      setCooldown(response.resendAllowedAfterSeconds || 60);
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(err.message || 'Please wait for the cooldown timer before requesting another code.');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend verification code. Please try again.');
      }
      setResendStatus('idle');
    }
  }

  return (
    <WorkflowLayout
      stepIndex={1}
      title="Email Verification"
      description="Verify your official email address to continue the process."
      narrowContent={true}
    >
      <div className="surface-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-light border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green shadow-xs">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-forest">Check your inbox</h2>
          <p className="text-sm text-slate-600 mt-2">
            We've sent a 6-digit verification code to:<br />
            <strong className="text-brand-forest font-bold">{hrEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="max-w-xs mx-auto space-y-5">
          <FormField id="token" label="6-Digit Verification Code" error={error}>
            <input
              id="token"
              type="text"
              className="form-input text-center text-lg tracking-widest font-mono font-bold"
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
            {isSubmitting ? 'Verifying Code...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600 mb-3">
            Didn't receive the email? Check your spam folder or request a new code.
          </p>
          {resendStatus === 'success' ? (
            <p className="text-sm text-emerald-700 font-semibold flex items-center justify-center gap-1">
              <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              New code sent successfully.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'loading' || cooldown > 0}
              className="text-sm font-semibold text-brand-green hover:text-brand-forest transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendStatus === 'loading'
                ? 'Sending...'
                : cooldown > 0
                ? `Resend Code in ${cooldown}s`
                : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}

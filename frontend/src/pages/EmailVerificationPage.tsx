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
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);
    setError(undefined);

    try {
      // Server-side asynchronous API validation call to POST /api/auth/verify-otp
      // Payload includes: email, 6-digit otp, and challenge_id
      const response = await verifyEmail({
        challenge_id: requestId!,
        otp: cleanToken,
        email: hrEmail || undefined,
      });
      
      const normalizedRole = response.role?.toLowerCase() === 'admin' ? 'admin' : 'hr';
      // Save authorization token / session flag in context and sessionStorage
      setRole(normalizedRole, response.token);

      // Clean up dev OTP cache upon verified completion
      sessionStorage.removeItem('siet_dev_otp');

      // STRICT STATE TRANSITION: Only on 200 OK advance to Step 3 (Candidate Details)
      if (normalizedRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(ROUTES.CANDIDATE, { replace: true });
      }
    } catch (err: any) {
      console.error('[EmailVerificationPage] OTP verification failed:', err);

      let errorMessage = 'Invalid verification code. Please try again.';
      if (err instanceof ApiError) {
        if (err.status === 409 || err.status === 400 || err.status === 401) {
          errorMessage = err.message || 'Invalid verification code. Please try again.';
        } else if (err.status === 422) {
          errorMessage = 'Invalid code format. Please enter the 6-digit code received in your email.';
        } else if (err.status === 0 || err.errorCode === 'NETWORK_FAILURE') {
          errorMessage = 'Unable to connect to verification server. Please check your connection and try again.';
        } else {
          errorMessage = err.message || 'Invalid verification code. Please try again.';
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      // STRICT CONSTRAINT: Abort transition, display inline error, and CLEAR input field to allow retry
      setError(errorMessage);
      setToken('');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setResendStatus('loading');
    setError(undefined);
    try {
      const response = await resendVerification(requestId!);
      if (response.devOtp) {
        sessionStorage.setItem('siet_dev_otp', response.devOtp);
      }
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

  const devOtp = sessionStorage.getItem('siet_dev_otp');

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

        {import.meta.env.DEV && devOtp && (
          <div className="max-w-xs mx-auto mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <div>
              <span className="font-semibold block text-amber-900">Developer Testing</span>
              <span>Code: <code className="font-mono font-bold bg-amber-100 px-1 rounded">{devOtp}</code></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setToken(devOtp);
                setError(undefined);
              }}
              className="text-amber-900 bg-amber-200/70 hover:bg-amber-200 font-semibold px-2 py-1 rounded text-xs transition-colors"
            >
              Auto-fill
            </button>
          </div>
        )}

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
              disabled={isLoading}
              autoComplete="one-time-code"
              aria-required="true"
            />
          </FormField>

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={isLoading || token.length < 6}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Verifying Code...</span>
              </>
            ) : (
              'Verify Email'
            )}
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

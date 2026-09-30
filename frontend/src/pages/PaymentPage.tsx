import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import StatusMessage from '../components/StatusMessage';
import { ROUTES } from '../utils/routes';
import { verifyPayment } from '../api/payment';
import type { CandidateDetails } from '../types/api';
import { ApiError } from '../types/api';
import { useAuth } from '../context/AuthContext';

const PAYMENT_DRAFT_KEY = 'siet_payment_draft';

// Extend window object for Razorpay checkout script
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { isAuthenticated, sessionToken: authSessionToken } = useAuth();

  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PAYING' | 'VERIFYING' | 'SUCCESS'>('IDLE');

  // 1. Read authentication session token from Context or sessionStorage
  const sessionToken = authSessionToken || (() => {
    try {
      const rawAuth = sessionStorage.getItem('siet_auth_state');
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        return parsed.sessionToken || null;
      }
    } catch (e) {
      console.error('Failed to parse siet_auth_state', e);
    }
    return null;
  })();

  // 2. Read cached draft details created during Candidate Details (Step 3)
  const orderDetails = (() => {
    try {
      const cached = sessionStorage.getItem(PAYMENT_DRAFT_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })();

  const paymentOrderId =
    orderDetails?.payment_order_id ||
    orderDetails?.gateway_order_id ||
    sessionStorage.getItem('siet_payment_order_id') ||
    null;

  const verificationRequestId =
    orderDetails?.verification_request_id ||
    sessionStorage.getItem('siet_active_request_id') ||
    null;

  const displayRequestId =
    orderDetails?.display_request_id ||
    sessionStorage.getItem('siet_active_display_id') ||
    null;

  const gatewayKeyId = orderDetails?.gateway_key_id || 'DEV_KEY_ID_NOT_REAL';
  const amountPaise = orderDetails?.amount_paise || 150000;
  const currency = orderDetails?.currency || 'INR';
  const paymentSessionId = orderDetails?.payment_session_id || null;

  // 3. Read candidate summary payload for Order Summary display
  const candidatePayload: CandidateDetails | null = (() => {
    try {
      const candidateStr = sessionStorage.getItem('candidatePayload');
      if (candidateStr) return JSON.parse(candidateStr);
      const draftStr = sessionStorage.getItem('siet_candidate_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        return {
          candidate_name: draft.candidate_name,
          dob: draft.dob,
          register_number: draft.register_number,
          degree: draft.degree,
          specialization: draft.specialization,
          year_of_passing: draft.year_of_passing ? parseInt(draft.year_of_passing, 10) : 0,
          certificate_no: draft.certificate_no,
          year_of_enrolment: draft.year_of_enrolment ? parseInt(draft.year_of_enrolment, 10) : null,
          class_obtained: draft.class_obtained || null,
          certificate_url: draft.certificate_url || null,
        };
      }
    } catch (e) {
      console.error('Failed to parse candidate payload from sessionStorage', e);
    }
    return null;
  })();

  // Validation: Both session token and payment_order_id must be present to proceed
  const isAuthMissing = !sessionToken && !isAuthenticated;
  const isOrderMissing = !paymentOrderId || !verificationRequestId;
  const isBlocked = isAuthMissing || isOrderMissing;

  const isDevMode = gatewayKeyId === 'DEV_KEY_ID_NOT_REAL' || gatewayKeyId.startsWith('DEV_');

  /**
   * Verified Payment Handler
   * Strictly calls backend POST /api/v1/payment/verify and waits for 200 OK
   */
  const handleVerifySuccess = async (
    paymentId: string,
    orderId: string,
    signature: string
  ) => {
    if (!verificationRequestId) {
      setError('Active verification request ID not found. Please restart the verification flow.');
      setIsProcessing(false);
      setStatus('IDLE');
      return;
    }

    if (!sessionToken) {
      setError('HR authorization session token missing. Please verify your email again.');
      setIsProcessing(false);
      setStatus('IDLE');
      return;
    }

    setStatus('VERIFYING');
    setIsProcessing(true);
    setError(null);

    try {
      const verifyRes = await verifyPayment(
        {
          verification_request_id: verificationRequestId,
          payment_session_id: paymentSessionId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature,
        },
        undefined,
        undefined,
        undefined,
        undefined,
        sessionToken
      );

      if (!verifyRes.success || !verifyRes.data) {
        throw new Error(verifyRes.message || 'Payment verification failed on the server.');
      }

      const finalRequestId = verifyRes.data.verification_request_id || verificationRequestId;
      if (finalRequestId) {
        sessionStorage.setItem('siet_active_request_id', finalRequestId);
      }
      if (verifyRes.data.display_request_id) {
        sessionStorage.setItem('siet_active_display_id', verifyRes.data.display_request_id);
      }

      setStatus('SUCCESS');

      // Securely advance user to Step 5 (Confirm & Institutional Verification)
      setTimeout(() => {
        navigate(ROUTES.CONFIRM, {
          state: { verification_request_id: finalRequestId },
        });
      }, 1200);
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      setStatus('IDLE');
      setIsProcessing(false);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Your authorization session has expired. Please verify your official email again.');
        } else if (err.status === 403) {
          setError('Access denied. A valid HR session is required to verify this payment.');
        } else {
          setError(err.message || 'Payment verification failed. Please try again or contact support.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Payment verification failed. Please try again or contact support.');
      }
    }
  };

  /**
   * Simulated Test Payment Flow (for Pure Dev / Test Mode)
   */
  const handleSimulatedPayment = async () => {
    if (isBlocked) {
      setError('Cannot proceed with payment: Order details or session token missing.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setStatus('PAYING');

    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockOrderId = paymentOrderId || `order_mock_${Date.now()}`;
      const mockSignature = `sig_mock_${Date.now()}`;

      await handleVerifySuccess(mockPaymentId, mockOrderId, mockSignature);
    } catch (err: any) {
      console.error('Simulated payment error:', err);
      setStatus('IDLE');
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Failed to simulate payment.');
    }
  };

  /**
   * Razorpay Checkout Flow
   */
  const handleCheckout = async () => {
    if (isBlocked) {
      setError('Cannot initiate checkout: Order details or session token missing.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // If dev key is configured, fallback directly to simulated flow
      if (isDevMode) {
        await handleSimulatedPayment();
        return;
      }

      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          'Failed to load Razorpay Checkout SDK. Please check your network connection or use Test Mode payment.'
        );
      }

      const options = {
        key: gatewayKeyId,
        amount: amountPaise.toString(),
        currency: currency || 'INR',
        name: 'SIET Academic Verification',
        description: 'Candidate Background Verification Fee',
        order_id: paymentOrderId,
        handler: async function (response: any) {
          await handleVerifySuccess(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: candidatePayload?.candidate_name
            ? `Verification for ${candidatePayload.candidate_name}`
            : 'HR Representative',
        },
        theme: {
          color: '#074828', // siet-brand-forest
        },
        modal: {
          ondismiss: function () {
            // User explicitly closed modal without completing payment
            setIsProcessing(false);
            setStatus('IDLE');
            setError('Payment checkout was closed before completion. Please click Pay to try again.');
          },
        },
      };

      setStatus('PAYING');
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        setError(`Payment declined: ${response?.error?.description || 'Transaction failed.'}`);
        setStatus('IDLE');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      setStatus('IDLE');
      setIsProcessing(false);
      if (err instanceof ApiError) {
        setError(err.message || 'Payment initiation failed.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during payment processing.');
      }
    }
  };

  return (
    <WorkflowLayout
      stepIndex={3}
      title="Secure Payment"
      description="Complete the authorized verification payment. Each payment authorises official background check for one candidate."
      narrowContent={true}
    >
      <div className="surface-card p-6 space-y-6 relative shadow-sm rounded-xl border border-slate-200">
        {/* Loading Overlay */}
        {isProcessing && status === 'VERIFYING' && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-xl space-y-3">
            <svg className="animate-spin h-8 w-8 text-brand-forest" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-brand-forest font-semibold text-sm">
              Verifying payment with institution...
            </p>
            <p className="text-xs text-slate-500">
              Please do not refresh or close this browser window.
            </p>
          </div>
        )}

        {/* Success Overlay */}
        {status === 'SUCCESS' && (
          <div className="absolute inset-0 bg-emerald-50/95 flex flex-col items-center justify-center z-20 rounded-xl border border-emerald-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-900 font-bold text-base">Payment Verified Successfully</p>
            <p className="text-emerald-700 text-xs">Advancing to Step 5 (Confirmation)...</p>
          </div>
        )}

        {/* Missing Order / Auth Error Banners */}
        {isAuthMissing && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-3 text-center">
            <p className="text-amber-900 font-semibold text-sm">
              Authentication session missing or expired.
            </p>
            <p className="text-xs text-amber-800">
              A verified HR email session is required to authorize verification payments.
            </p>
            <button
              type="button"
              className="btn-primary py-2 px-5 text-xs"
              onClick={() => navigate(ROUTES.VERIFY_EMAIL)}
            >
              Verify HR Email
            </button>
          </div>
        )}

        {isOrderMissing && !isAuthMissing && (
          <div className="bg-red-50 border border-red-300 p-4 rounded-xl space-y-3 text-center">
            <p className="text-red-900 font-semibold text-sm">
              Payment draft details not found in session storage.
            </p>
            <p className="text-xs text-red-800">
              The verification request must be initialized in Step 3 before proceeding to payment.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="btn-primary py-2 px-4 text-xs"
                onClick={() => navigate(ROUTES.CANDIDATE)}
              >
                Back to Candidate Details (Step 3)
              </button>
              <button
                type="button"
                className="btn-secondary py-2 px-4 text-xs"
                onClick={() => navigate(ROUTES.REQUESTER)}
              >
                Restart Verification Flow
              </button>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xs font-bold text-brand-forest uppercase tracking-wider">
              Order Summary
            </h2>
            <span className="text-xs font-mono font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              {displayRequestId || 'DRAFT-ORDER'}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm pb-3 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Candidate:</span>
              <span className="sm:col-span-2 font-semibold text-siet-navy">
                {candidatePayload?.candidate_name ? (
                  <>
                    {candidatePayload.candidate_name}{' '}
                    <span className="text-slate-500 font-normal">
                      ({candidatePayload.register_number})
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">No candidate details found</span>
                )}
              </span>
            </div>

            {candidatePayload?.degree && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm pb-3 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Programme:</span>
                <span className="sm:col-span-2 text-slate-800">
                  {candidatePayload.degree}{' '}
                  {candidatePayload.specialization ? `in ${candidatePayload.specialization}` : ''}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm pb-3 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Order Reference:</span>
              <span className="sm:col-span-2 font-mono text-xs text-slate-700 break-all">
                {paymentOrderId || 'Not Generated'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm pb-3 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Payment Provider:</span>
              <span className="sm:col-span-2 flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {isDevMode ? 'Simulated Gateway (Dev Mode)' : 'Razorpay Secure Checkout'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-800 bg-emerald-100">
                  ACTIVE
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm pt-1 items-center">
              <span className="text-slate-700 font-bold">Total Amount:</span>
              <span className="sm:col-span-2 text-xl font-extrabold text-brand-forest">
                ₹{(amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({currency} inclusive of taxes)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Inline Error Message */}
        {error && !isBlocked && (
          <StatusMessage
            type="error"
            title="Payment Notice"
            message={error}
          />
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <svg className="w-4 h-4 text-emerald-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            256-Bit SSL Encrypted. Payment confirmation is verified directly against institutional records.
          </span>
        </div>

        {/* Checkout Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!isDevMode && (
            <button
              type="button"
              className="btn-primary w-full sm:w-auto px-8 py-3 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isProcessing || isBlocked || status === 'SUCCESS'}
            >
              {isProcessing ? 'Processing Checkout...' : 'Pay with Razorpay'}
            </button>
          )}

          {/* Test Mode / Dev Payment Button */}
          {isDevMode && (
            <button
              type="button"
              className="btn-primary w-full sm:w-auto px-8 py-3 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSimulatedPayment}
              disabled={isProcessing || isBlocked || status === 'SUCCESS'}
            >
              {isProcessing ? 'Verifying Test Payment...' : 'Pay Now (Test Mode)'}
            </button>
          )}

          {/* Dev Mode secondary test trigger if live key is configured */}
          {!isDevMode && (
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto px-4 py-3 text-xs font-medium"
              onClick={handleSimulatedPayment}
              disabled={isProcessing || isBlocked || status === 'SUCCESS'}
              title="Simulates payment verification response without opening gateway widget"
            >
              Simulate Dev Payment
            </button>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}

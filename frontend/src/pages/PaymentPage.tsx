import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import StatusMessage from '../components/StatusMessage';
import { ROUTES } from '../utils/routes';
import { initiatePayment, verifyPayment } from '../api/payment';
import type { PaymentInitiateResponse } from '../api/payment';
import { bindCandidate } from '../api/verification';
import { useAuth } from '../context/AuthContext';

const PAYMENT_DRAFT_KEY = 'siet_payment_draft';

// Extend window for Razorpay
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
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'INITIATING' | 'PAYING' | 'VERIFYING' | 'SUCCESS'>('IDLE');
  
  const [orderDetails, setOrderDetails] = useState<PaymentInitiateResponse['data'] | null>(() => {
    try {
      const cached = sessionStorage.getItem(PAYMENT_DRAFT_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (orderDetails) {
      try {
        sessionStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(orderDetails));
      } catch (e) {
        console.error('Failed to cache payment draft in sessionStorage', e);
      }
    }
  }, [orderDetails]);

  const candidatePayload = (() => {
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
          year_of_passing: draft.year_of_passing ? parseInt(draft.year_of_passing, 10) : undefined,
          certificate_no: draft.certificate_no,
          year_of_enrolment: draft.year_of_enrolment ? parseInt(draft.year_of_enrolment, 10) : undefined,
          class_obtained: draft.class_obtained || undefined,
          certificate_url: draft.certificate_url,
        };
      }
    } catch (e) {
      console.error('Failed to parse candidate payload from sessionStorage', e);
    }
    return null;
  })();

  const isLocked = !isAuthenticated;

  const handleCheckout = async () => {
    setStatus('INITIATING');
    setError(null);
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your connection.');
      }

      // 2. Obtain order from backend
      const initiateRes = await initiatePayment();
      if (!initiateRes.success || !initiateRes.data) {
        throw new Error(initiateRes.message || 'Failed to initiate payment.');
      }
      
      const { gateway_order_id, gateway_key_id, amount_paise, currency, description, payment_session_id } = initiateRes.data;
      setOrderDetails(initiateRes.data);

      if (!gateway_key_id || !gateway_order_id) {
        throw new Error('Payment gateway configuration is missing from the server.');
      }

      // 3. Handle Mock Mode Bypass
      if (gateway_key_id === 'DEV_KEY_ID_NOT_REAL') {
        setStatus('VERIFYING');
        setLoading(true);
        // We use the dev endpoint to confirm
        const res = await fetch(`/api/v1/payment/dev/confirm/${payment_session_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${JSON.parse(sessionStorage.getItem('siet_auth_state') || '{}').sessionToken}`
          }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
           throw new Error(data.message || 'Mock payment failed');
        }
        
        const verificationRequestId = data.data?.verification_request_id;
        if (verificationRequestId) {
          sessionStorage.setItem('siet_active_request_id', verificationRequestId);
        }
        if (verificationRequestId && candidatePayload) {
          try {
            await bindCandidate({
              verification_request_id: verificationRequestId,
              candidate: candidatePayload,
            });
          } catch (_bindErr) {
            throw new Error('Payment succeeded, but failed to bind candidate. Please contact support.');
          }
        }
        
        setStatus('SUCCESS');
        setTimeout(() => {
          navigate(ROUTES.CONFIRM, {
            state: { verification_request_id: verificationRequestId },
          });
        }, 1500);
        return;
      }

      // 4. Configure real Razorpay
      const options = {
        key: gateway_key_id,
        amount: amount_paise.toString(),
        currency: currency,
        name: 'SIET Academic Verification',
        description: description,
        order_id: gateway_order_id,
        handler: async function (response: any) {
          try {
            setStatus('VERIFYING');
            setLoading(true);
            const verifyRes = await verifyPayment(
              payment_session_id,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            if (verifyRes.success) {
              const verificationRequestId = verifyRes.data?.verification_request_id;
              if (verificationRequestId) {
                sessionStorage.setItem('siet_active_request_id', verificationRequestId);
              }
              
              if (verificationRequestId && candidatePayload) {
                try {
                  await bindCandidate({
                    verification_request_id: verificationRequestId,
                    candidate: candidatePayload,
                  });
                } catch (_bindErr) {
                  throw new Error('Payment succeeded, but failed to bind candidate. Please contact support.');
                }
              }

              setStatus('SUCCESS');
              setTimeout(() => {
                navigate(ROUTES.CONFIRM, {
                  state: { verification_request_id: verificationRequestId },
                });
              }, 1500);
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during verification.');
            setStatus('IDLE');
            setLoading(false);
          }
        },
        prefill: {
          name: 'HR Representative',
        },
        theme: {
          color: '#074828', // siet-brand-forest
        },
        modal: {
          ondismiss: function () {
            setStatus('IDLE');
            setLoading(false);
            setError('Payment checkout was cancelled.');
          }
        }
      };

      setStatus('PAYING');
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setStatus('IDLE');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus('IDLE');
      setLoading(false);
    }
  };

  return (
    <WorkflowLayout
      stepIndex={3}
      title="Secure Payment"
      description="Complete a one-time payment. Each payment authorises verification of one candidate only."
      narrowContent={true}
    >
      <div className="surface-card p-6 space-y-6 relative">
        {status === 'VERIFYING' && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
            <div className="text-brand-forest font-semibold flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-brand-green" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying payment...
            </div>
          </div>
        )}
        
        {status === 'SUCCESS' && (
          <div className="absolute inset-0 bg-emerald-50 flex items-center justify-center z-10 rounded-xl border border-emerald-300">
            <div className="text-emerald-800 font-bold flex flex-col items-center gap-2">
              <svg className="h-10 w-10 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payment verified successfully. Redirecting...
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-slate-200 pb-4">
            <span className="text-sm font-medium text-slate-500">Candidate:</span>
            <span className="text-sm font-bold text-brand-forest sm:col-span-2">
              {candidatePayload ? `${candidatePayload.candidate_name} (${candidatePayload.register_number})` : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-slate-200 pb-4">
            <span className="text-sm font-medium text-slate-500">Provider:</span>
            <span className="text-sm font-semibold text-brand-forest sm:col-span-2">Razorpay (Standard Checkout)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-slate-200 pb-4">
            <span className="text-sm font-medium text-slate-500">Mode:</span>
            <span className="sm:col-span-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-amber-900 bg-yellow-50 border border-brand-gold">
                TEST MODE
              </span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-slate-200 pb-4">
            <span className="text-sm font-medium text-slate-500">Amount:</span>
            <span className="text-base font-bold text-brand-forest sm:col-span-2">
              {orderDetails ? `${orderDetails.currency} ${(orderDetails.amount_paise / 100).toFixed(2)}` : 'INR 100.00'}
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="bg-brand-light border border-emerald-200 p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <p className="text-brand-forest font-bold">Verify your email to continue with payment.</p>
            <button
              type="button"
              className="btn-primary py-2 px-5 text-sm"
              onClick={() => navigate(ROUTES.VERIFY_EMAIL)}
            >
              Go to Email Verification
            </button>
          </div>
        )}

        {error && !isLocked && (
          <StatusMessage
            type="error"
            title="Payment Error"
            message={error}
          />
        )}

        <div className="flex flex-col items-center justify-center pt-4">
          <button
            type="button"
            className="btn-primary w-full sm:w-auto px-8 disabled:bg-siet-silver disabled:text-siet-muted disabled:cursor-not-allowed"
            onClick={handleCheckout}
            disabled={loading || status === 'SUCCESS' || isLocked}
          >
            {loading ? 'Processing...' : 'Pay with Razorpay'}
          </button>
        </div>
      </div>
    </WorkflowLayout>
  );
}

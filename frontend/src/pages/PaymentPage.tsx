import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from '../components/WorkflowLayout';
import StatusMessage from '../components/StatusMessage';
import { ROUTES } from '../utils/routes';
import { initiatePayment, verifyPayment } from '../api/payment';
import type { PaymentInitiateResponse } from '../api/payment';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'INITIATING' | 'PAYING' | 'VERIFYING' | 'SUCCESS'>('IDLE');
  const [orderDetails, setOrderDetails] = useState<PaymentInitiateResponse['data'] | null>(null);

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

      // 3. Configure Razorpay
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
              setStatus('SUCCESS');
              setTimeout(() => {
                navigate(ROUTES.CANDIDATE);
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
          color: '#0B1F3A', // siet-navy
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
      stepIndex={2}
      title="Payment (Test Mode)"
      description="One payment authorises one candidate verification."
      narrowContent={true}
    >
      <div className="surface-card p-6 space-y-6 relative">
        {status === 'VERIFYING' && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded">
            <div className="text-siet-navy font-semibold flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying payment...
            </div>
          </div>
        )}
        
        {status === 'SUCCESS' && (
          <div className="absolute inset-0 bg-green-50 flex items-center justify-center z-10 rounded border border-green-200">
            <div className="text-green-700 font-semibold flex flex-col items-center gap-2">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payment verified successfully. Redirecting...
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
            <span className="text-sm font-medium text-siet-slate">Provider:</span>
            <span className="text-sm font-semibold text-siet-navy sm:col-span-2">Razorpay (Standard Checkout)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
            <span className="text-sm font-medium text-siet-slate">Mode:</span>
            <span className="text-sm font-medium text-siet-amber sm:col-span-2">TEST MODE</span>
          </div>
          {orderDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
              <span className="text-sm font-medium text-siet-slate">Amount:</span>
              <span className="text-sm font-medium text-siet-navy sm:col-span-2">
                {orderDetails.currency} {(orderDetails.amount_paise / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <StatusMessage
            type="error"
            title="Payment Error"
            message={error}
          />
        )}

        <div className="flex flex-col items-center justify-center pt-4">
          <button
            type="button"
            className="btn-primary w-full sm:w-auto px-8"
            onClick={handleCheckout}
            disabled={loading || status === 'SUCCESS'}
          >
            {loading ? 'Processing...' : 'Pay with Razorpay'}
          </button>
        </div>
      </div>
    </WorkflowLayout>
  );
}

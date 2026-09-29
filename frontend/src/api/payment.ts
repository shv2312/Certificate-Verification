/**
 * src/api/payment.ts
 * ==================
 * Payment API client.
 * Strictly aligned with FastAPI backend endpoints:
 *   - POST /api/v1/payment/initiate
 *   - POST /api/v1/payment/verify-checkout
 *   - GET  /api/v1/payment/{payment_session_id}/status
 *   - POST /api/v1/payment/dev/confirm/{payment_session_id}
 */

import { apiClient } from './client';
import type {
  APIResponse,
  PaymentInitiateResponse,
  PaymentCheckoutVerifyRequest,
  PaymentStatusResponse,
} from '../types/api';

export type { PaymentInitiateResponse, PaymentCheckoutVerifyRequest, PaymentStatusResponse };

/**
 * Initiates a payment session.
 * Requires: Authorization: Bearer <session_token>
 * Returns gateway details (order_id, public key_id, amount).
 */
export async function initiatePayment(): Promise<APIResponse<PaymentInitiateResponse>> {
  return apiClient<APIResponse<PaymentInitiateResponse>>('/api/v1/payment/initiate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Submits the Razorpay checkout signature for server-side verification.
 * Requires: Authorization: Bearer <session_token>
 */
export async function verifyPayment(
  _paymentSessionId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
): Promise<APIResponse<PaymentStatusResponse>> {
  const payload: PaymentCheckoutVerifyRequest = {
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: razorpaySignature,
  };

  return apiClient<APIResponse<PaymentStatusResponse>>('/api/v1/payment/verify-checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Poll payment status for a payment session.
 * Returns current status: PENDING | PAID_UNUSED | FAILED | EXPIRED
 */
export async function getPaymentStatus(
  paymentSessionId: string
): Promise<APIResponse<PaymentStatusResponse>> {
  return apiClient<APIResponse<PaymentStatusResponse>>(
    `/api/v1/payment/${encodeURIComponent(paymentSessionId)}/status`,
    { method: 'GET' }
  );
}

/**
 * [DEV ONLY] Simulate successful payment when DEV_MOCK_PAYMENT is enabled on backend.
 */
export async function devConfirmPayment(
  paymentSessionId: string
): Promise<APIResponse<PaymentStatusResponse>> {
  return apiClient<APIResponse<PaymentStatusResponse>>(
    `/api/v1/payment/dev/confirm/${encodeURIComponent(paymentSessionId)}`,
    { method: 'POST' }
  );
}

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
  PaymentVerifyRequest,
  PaymentStatusResponse,
} from '../types/api';

export type {
  PaymentInitiateResponse,
  PaymentCheckoutVerifyRequest,
  PaymentVerifyRequest,
  PaymentStatusResponse,
};

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

export interface VerifyPaymentParams {
  verification_request_id?: string | null;
  payment_session_id?: string | null;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Submits the Razorpay payment response and verification request ID for server-side verification.
 * Backend endpoint: POST /api/v1/payment/verify
 * Requires: Authorization: Bearer <session_token>
 */
export async function verifyPayment(
  paramsOrSessionId: VerifyPaymentParams | string,
  razorpayPaymentId?: string,
  razorpayOrderId?: string,
  razorpaySignature?: string,
  verificationRequestId?: string | null,
  token?: string
): Promise<APIResponse<PaymentStatusResponse>> {
  let payload: PaymentVerifyRequest;

  if (typeof paramsOrSessionId === 'object') {
    payload = {
      verification_request_id: paramsOrSessionId.verification_request_id || null,
      payment_session_id: paramsOrSessionId.payment_session_id || null,
      razorpay_payment_id: paramsOrSessionId.razorpay_payment_id,
      razorpay_order_id: paramsOrSessionId.razorpay_order_id,
      razorpay_signature: paramsOrSessionId.razorpay_signature,
    };
  } else {
    payload = {
      verification_request_id: verificationRequestId || null,
      payment_session_id: paramsOrSessionId,
      razorpay_payment_id: razorpayPaymentId || '',
      razorpay_order_id: razorpayOrderId || '',
      razorpay_signature: razorpaySignature || '',
    };
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiClient<APIResponse<PaymentStatusResponse>>('/api/v1/payment/verify', {
    method: 'POST',
    headers,
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

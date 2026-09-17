import { apiClient } from './client';

export interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  data: {
    payment_session_id: string;
    gateway_order_id: string;
    gateway_key_id: string;
    amount_paise: number;
    currency: string;
    description: string;
  };
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  data: {
    payment_session_id: string;
    status: string;
    verification_request_id?: string;
  };
}

export async function initiatePayment(): Promise<PaymentInitiateResponse> {
  return apiClient<PaymentInitiateResponse>('/api/v1/payment/initiate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function verifyPayment(
  _paymentSessionId: string, // Kept for interface compatibility, but unused in URL
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
): Promise<PaymentVerifyResponse> {
  return apiClient<PaymentVerifyResponse>(`/api/v1/payment/verify-checkout`, {
    method: 'POST',
    body: JSON.stringify({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }),
  });
}

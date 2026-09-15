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
  });
}

export async function verifyPayment(
  paymentSessionId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
): Promise<PaymentVerifyResponse> {
  return apiClient<PaymentVerifyResponse>(`/api/v1/payment/verify/${encodeURIComponent(paymentSessionId)}`, {
    method: 'POST',
    body: JSON.stringify({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }),
  });
}

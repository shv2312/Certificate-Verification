/**
 * src/services/api.ts
 * ===================
 * Service layer providing typed API invocation and envelope unwrapping
 * for the SIET Academic Background Verification Portal.
 *
 * Backend Envelope Contract:
 *   {
 *     "success": true,
 *     "message": "Human-readable status message",
 *     "data": { ... }
 *   }
 */

import { apiClient, apiUnwrap, ApiError, type RequestOptions } from '../api/client';
import type {
  APIResponse,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  PaymentInitiateResponse,
  PaymentCheckoutVerifyRequest,
  PaymentStatusResponse,
  BindCandidateRequest,
  BindCandidateResponse,
  ConfirmVerificationRequest,
  VerificationResultResponse,
  VerificationStatusResponse,
  VerificationHistoryResponse,
  PublicVerificationStatusResponse,
  PublicVerificationLookupResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminStats,
  VerificationRequestSummary,
  CertificateUploadResponse,
} from '../types/api';

export { apiClient, apiUnwrap, ApiError };
export type { RequestOptions };

// -----------------------------------------------------------------------------
// Generic Typed REST Helpers
// -----------------------------------------------------------------------------

/**
 * Perform a GET request and unwrap the `data` payload from `APIResponse<T>`.
 */
export async function get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return apiUnwrap<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Perform a POST request and unwrap the `data` payload from `APIResponse<T>`.
 */
export async function post<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
  return apiUnwrap<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
}

/**
 * Perform a raw request returning the full `APIResponse<T>` envelope.
 */
export async function rawRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
  return apiClient<APIResponse<T>>(endpoint, options);
}

// -----------------------------------------------------------------------------
// 1. Email Verification / HR Onboarding Service
// -----------------------------------------------------------------------------

export const authService = {
  /**
   * POST /api/v1/email/send-otp
   * Initiates HR email verification and generates an OTP challenge.
   */
  async sendOTP(payload: SendOTPRequest): Promise<{ challenge_id: string; masked_email: string; resend_allowed_after_seconds: number; message: string }> {
    const response = await rawRequest<SendOTPResponse>('/api/v1/email/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      challenge_id: response.data.challenge_id,
      masked_email: response.data.masked_email,
      resend_allowed_after_seconds: response.data.resend_allowed_after_seconds,
      message: response.message,
    };
  },

  /**
   * POST /api/v1/email/verify-otp
   * Validates OTP and returns authenticated session token.
   */
  async verifyOTP(payload: VerifyOTPRequest): Promise<{ session_token: string; verified_company: string; verified_email: string; role: string; message: string }> {
    const response = await rawRequest<VerifyOTPResponse>('/api/v1/email/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      session_token: response.data.session_token,
      verified_company: response.data.verified_company,
      verified_email: response.data.verified_email,
      role: response.data.role,
      message: response.message,
    };
  },

  /**
   * POST /api/v1/email/resend-otp
   * Requests a fresh OTP for an existing challenge.
   */
  async resendOTP(payload: ResendOTPRequest): Promise<{ challenge_id: string; masked_email: string; resend_allowed_after_seconds: number; message: string }> {
    const response = await rawRequest<SendOTPResponse>('/api/v1/email/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      challenge_id: response.data.challenge_id,
      masked_email: response.data.masked_email,
      resend_allowed_after_seconds: response.data.resend_allowed_after_seconds,
      message: response.message,
    };
  },
};

// -----------------------------------------------------------------------------
// 2. Payment Service
// -----------------------------------------------------------------------------

export const paymentService = {
  /**
   * POST /api/v1/payment/initiate
   * Creates a payment session and returns gateway details.
   */
  async initiate(): Promise<PaymentInitiateResponse> {
    return post<PaymentInitiateResponse>('/api/v1/payment/initiate', {});
  },

  /**
   * POST /api/v1/payment/verify-checkout
   * Verifies Razorpay checkout signature and unblocks verification.
   */
  async verifyCheckout(payload: PaymentCheckoutVerifyRequest): Promise<PaymentStatusResponse> {
    return post<PaymentStatusResponse>('/api/v1/payment/verify-checkout', payload);
  },

  /**
   * GET /api/v1/payment/{payment_session_id}/status
   * Polls the payment status.
   */
  async getStatus(paymentSessionId: string): Promise<PaymentStatusResponse> {
    return get<PaymentStatusResponse>(`/api/v1/payment/${encodeURIComponent(paymentSessionId)}/status`);
  },

  /**
   * POST /api/v1/payment/dev/confirm/{payment_session_id}
   * [DEV ONLY] Simulates mock payment when gateway is stubbed.
   */
  async devConfirm(paymentSessionId: string): Promise<PaymentStatusResponse> {
    return post<PaymentStatusResponse>(`/api/v1/payment/dev/confirm/${encodeURIComponent(paymentSessionId)}`);
  },
};

// -----------------------------------------------------------------------------
// 3. Verification Service
// -----------------------------------------------------------------------------

export const verificationService = {
  /**
   * POST /api/v1/verification/bind-candidate
   * Binds candidate academic details to a paid verification request.
   */
  async bindCandidate(payload: BindCandidateRequest): Promise<BindCandidateResponse> {
    return post<BindCandidateResponse>('/api/v1/verification/bind-candidate', payload);
  },

  /**
   * POST /api/v1/verification/confirm
   * Confirms candidate details and executes the authoritative verification engine.
   */
  async confirm(payload: ConfirmVerificationRequest): Promise<VerificationResultResponse> {
    return post<VerificationResultResponse>('/api/v1/verification/confirm', payload);
  },

  /**
   * GET /api/v1/verification/{request_id}/status
   * Retrieves request status for authenticated HR owner.
   */
  async getStatus(requestId: string): Promise<VerificationStatusResponse> {
    return get<VerificationStatusResponse>(`/api/v1/verification/${encodeURIComponent(requestId)}/status`);
  },

  /**
   * GET /api/v1/verification/history
   * Retrieves all verification requests for authenticated HR owner.
   */
  async getHistory(): Promise<VerificationStatusResponse[]> {
    const data = await get<VerificationHistoryResponse>('/api/v1/verification/history');
    return data.requests;
  },

  /**
   * GET /api/v1/verification/{request_id}/report
   * Retrieves official verification outcome report for authenticated HR.
   */
  async getReport(requestId: string): Promise<VerificationResultResponse> {
    return get<VerificationResultResponse>(`/api/v1/verification/${encodeURIComponent(requestId)}/report`);
  },

  /**
   * GET /api/v1/verification/public-status/{request_id}
   * Public unauthenticated masked status check.
   */
  async getPublicStatus(requestId: string): Promise<PublicVerificationStatusResponse> {
    return get<PublicVerificationStatusResponse>(`/api/v1/verification/public-status/${encodeURIComponent(requestId)}`);
  },

  /**
   * GET /api/v1/verification/status/{lookup_id}
   * Public QR code verification lookup.
   */
  async publicLookup(lookupId: string): Promise<PublicVerificationLookupResponse> {
    return apiClient<PublicVerificationLookupResponse>(`/api/v1/verification/status/${encodeURIComponent(lookupId)}`);
  },

  /**
   * POST /api/v1/verification/upload-certificate
   * Uploads candidate degree or provisional certificate document (PDF, JPG, PNG).
   */
  async uploadCertificate(file: File): Promise<CertificateUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<CertificateUploadResponse>('/api/v1/verification/upload-certificate', {
      method: 'POST',
      body: formData,
    });
  },
};

// -----------------------------------------------------------------------------
// 4. Admin Portal Service
// -----------------------------------------------------------------------------

export const adminService = {
  /**
   * POST /api/v1/admin/login
   * Authenticates administrator.
   */
  async login(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
    return post<AdminLoginResponse>('/api/v1/admin/login', payload);
  },

  /**
   * GET /api/v1/admin/stats
   * Retrieves aggregated verification metrics.
   */
  async getStats(): Promise<AdminStats> {
    return get<AdminStats>('/api/v1/admin/stats');
  },

  /**
   * GET /api/v1/admin/requests
   * Retrieves paginated list of verification requests.
   */
  async getRequests(limit = 100, offset = 0): Promise<VerificationRequestSummary[]> {
    return get<VerificationRequestSummary[]>('/api/v1/admin/requests', {
      params: { limit, offset },
    });
  },
};

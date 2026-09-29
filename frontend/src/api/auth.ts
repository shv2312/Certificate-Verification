/**
 * src/api/auth.ts
 * ===============
 * Auth & HR Email Verification API client.
 * Strictly aligned with FastAPI backend endpoints:
 *   - POST /api/v1/email/send-otp
 *   - POST /api/v1/email/verify-otp
 *   - POST /api/v1/email/resend-otp
 */

import { apiClient } from './client';
import type {
  APIResponse,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
} from '../types/api';

export type { SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, ResendOTPRequest };

// Legacy aliases for backward compatibility if needed across existing pages
export type RequesterRegistrationPayload = SendOTPRequest;

export interface RequesterRegistrationResponse {
  requestId: string; // challenge_id
  message: string;
  resendAllowedAfterSeconds: number;
}

export interface EmailVerificationPayload {
  requestId: string; // challenge_id
  token: string;     // 6-digit OTP
}

export interface AuthResponse {
  role: 'hr' | 'admin' | string;
  message: string;
  token?: string; // session_token
  verifiedCompany?: string;
  verifiedEmail?: string;
}

/**
 * Step 1: Submit Requester & Organization Details and dispatch verification OTP.
 * Backend endpoint: POST /api/v1/email/send-otp
 */
export async function registerRequester(
  payload: SendOTPRequest
): Promise<RequesterRegistrationResponse> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] registerRequester called with:', payload);
        resolve({
          requestId: `challenge_${Math.random().toString(36).substring(2, 9)}`,
          message: `Verification code sent to ${payload.requester_email}`,
          resendAllowedAfterSeconds: 60,
        });
      }, 500);
    });
  }

  // Exact payload matching backend SendOTPRequest schema
  const response = await apiClient<APIResponse<SendOTPResponse>>('/api/v1/email/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      organization_type: payload.organization_type || null,
      organization_name: payload.organization_name.trim(),
      requester_name: payload.requester_name.trim(),
      requester_email: payload.requester_email.trim(),
      requester_role: payload.requester_role?.trim() || null,
      requester_phone: payload.requester_phone.trim(),
    }),
  });

  return {
    requestId: response.data.challenge_id,
    message: response.message,
    resendAllowedAfterSeconds: response.data.resend_allowed_after_seconds,
  };
}

/**
 * Step 2: Verify HR email using the 6-digit OTP received.
 * Backend endpoint: POST /api/v1/email/verify-otp
 */
export async function verifyEmail(
  payload: EmailVerificationPayload | VerifyOTPRequest
): Promise<AuthResponse> {
  const challenge_id = 'challenge_id' in payload ? payload.challenge_id : payload.requestId;
  const otp = 'otp' in payload ? payload.otp : payload.token;

  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] verifyEmail called with:', { challenge_id, otp });
        if (otp === '000000') {
          reject(new Error('Invalid verification token.'));
          return;
        }
        const mockEmail = sessionStorage.getItem('mock_hrEmail') || '';
        const role = mockEmail.toLowerCase() === 'admin@siet.ac.in' ? 'admin' : 'hr';
        resolve({
          role,
          message: 'Email verified successfully',
          token: 'mock-session-token',
        });
      }, 600);
    });
  }

  // Exact payload matching backend VerifyOTPRequest schema
  const response = await apiClient<APIResponse<VerifyOTPResponse>>('/api/v1/email/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      challenge_id,
      otp,
    }),
  });

  return {
    role: response.data.role.toLowerCase(),
    message: response.message,
    token: response.data.session_token,
    verifiedCompany: response.data.verified_company,
    verifiedEmail: response.data.verified_email,
  };
}

/**
 * Helper to resend the verification OTP.
 * Backend endpoint: POST /api/v1/email/resend-otp
 */
export async function resendVerification(
  challengeId: string
): Promise<{ message: string; resendAllowedAfterSeconds?: number }> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] resendVerification for challenge_id:', challengeId);
        resolve({ message: 'Verification email resent.', resendAllowedAfterSeconds: 60 });
      }, 500);
    });
  }

  // Exact payload matching backend ResendOTPRequest schema
  const response = await apiClient<APIResponse<SendOTPResponse>>('/api/v1/email/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ challenge_id: challengeId }),
  });

  return {
    message: response.message,
    resendAllowedAfterSeconds: response.data?.resend_allowed_after_seconds,
  };
}

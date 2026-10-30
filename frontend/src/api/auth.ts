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
import {
  ApiError,
  type APIResponse,
  type SendOTPRequest,
  type SendOTPResponse,
  type VerifyOTPRequest,
  type VerifyOTPResponse,
  type ResendOTPRequest,
} from '../types/api';

export type { SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, ResendOTPRequest };

// Legacy aliases for backward compatibility if needed across existing pages
export type RequesterRegistrationPayload = SendOTPRequest;

export interface RequesterRegistrationResponse {
  requestId: string; // challenge_id
  message: string;
  resendAllowedAfterSeconds: number;
  devOtp?: string | null;
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
 * Backend endpoints supported:
 *   - POST /api/auth/send-otp
 *   - POST /api/v1/email/send-otp
 */
export async function registerRequester(
  payload: SendOTPRequest
): Promise<RequesterRegistrationResponse> {
  const requestBody = {
    organization_type: payload.organization_type.trim(),
    organization_name: payload.organization_name.trim(),
    requester_name: payload.requester_name.trim(),
    requester_email: payload.requester_email.trim(),
    requester_role: payload.requester_role.trim(),
    requester_phone: payload.requester_phone.trim(),
  };

  try {
    // Perform real asynchronous API call to the backend
    let response: APIResponse<SendOTPResponse>;
    try {
      response = await apiClient<APIResponse<SendOTPResponse>>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (routeErr) {
      if (routeErr instanceof ApiError && routeErr.status === 404) {
        response = await apiClient<APIResponse<SendOTPResponse>>('/api/v1/email/send-otp', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });
      } else {
        throw routeErr;
      }
    }

    const devOtp = response.data?.dev_otp;

    return {
      requestId: response.data.challenge_id,
      message: response.message,
      resendAllowedAfterSeconds: response.data.resend_allowed_after_seconds,
      devOtp,
    };
  } catch (err) {
    throw err;
  }
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
  const email = 'email' in payload ? payload.email : undefined;

  // Developer local bypass handling
  if (challenge_id.startsWith('dev_challenge_')) {
    if (otp !== '123456') {
      throw new ApiError('Invalid verification code. For dev bypass, enter 123456.', 400, 'BAD_REQUEST');
    }
    const hrEmail = email || sessionStorage.getItem('mock_hrEmail') || 'hr@example.com';
    const role = hrEmail.toLowerCase() === 'admin@siet.ac.in' ? 'admin' : 'hr';
    return {
      role,
      message: 'Email verified successfully (Dev Mode)',
      token: `dev-session-token-${Date.now()}`,
      verifiedCompany: 'Development Preview Corp',
      verifiedEmail: hrEmail,
    };
  }

  // Exact payload matching backend VerifyOTPRequest schema (challenge_id, otp, email)
  const requestBody = { challenge_id, otp, email };
  let response: APIResponse<VerifyOTPResponse>;
  try {
    response = await apiClient<APIResponse<VerifyOTPResponse>>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (routeErr) {
    if (routeErr instanceof ApiError && routeErr.status === 404) {
      response = await apiClient<APIResponse<VerifyOTPResponse>>('/api/v1/email/verify-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } else {
      throw routeErr;
    }
  }

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
 * Backend endpoints: POST /api/auth/resend-otp or POST /api/v1/email/resend-otp
 */
export async function resendVerification(
  challengeId: string
): Promise<{ message: string; resendAllowedAfterSeconds?: number; devOtp?: string | null }> {
  if (challengeId.startsWith('dev_challenge_')) {
    const mockOtp = '123456';
    return { message: 'Verification email resent.', resendAllowedAfterSeconds: 60, devOtp: mockOtp };
  }

  // Exact payload matching backend ResendOTPRequest schema
  const requestBody = { challenge_id: challengeId };
  let response: APIResponse<SendOTPResponse>;
  try {
    response = await apiClient<APIResponse<SendOTPResponse>>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (routeErr) {
    if (routeErr instanceof ApiError && routeErr.status === 404) {
      response = await apiClient<APIResponse<SendOTPResponse>>('/api/v1/email/resend-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } else {
      throw routeErr;
    }
  }

  const devOtp = response.data?.dev_otp;

  return {
    message: response.message,
    resendAllowedAfterSeconds: response.data?.resend_allowed_after_seconds,
    devOtp,
  };
}

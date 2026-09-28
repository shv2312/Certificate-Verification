/**
 * Auth & Onboarding API integration.
 *
 * ARCHITECTURE NOTE:
 * When `import.meta.env.DEV` is true (development mode), mock implementations
 * are used to simulate backend responses until Shri Hari Vishnu S's FastAPI backend is connected.
 *
 * In production builds (`import.meta.env.DEV` is false), the client strictly executes
 * live API calls via `apiClient` to the FastAPI backend endpoints.
 */

import { apiClient } from './client';

export interface CompanyRegistrationPayload {
  companyName: string;
  hrName: string;
  hrEmail: string;
  hrPhone: string;
}

export interface CompanyRegistrationResponse {
  requestId: string;
  message: string;
  resendAllowedAfterSeconds?: number;
}

export interface EmailVerificationPayload {
  requestId: string;
  token: string; // The code/token entered by the user
}

export interface AuthResponse {
  role: 'hr' | 'admin';
  message: string;
  token?: string; // Auth token returned by backend upon verification
}

/**
 * Step 1: Register company & HR details to start verification.
 * Production endpoint: POST /api/v1/email/send-otp
 */
export async function registerCompany(payload: CompanyRegistrationPayload): Promise<CompanyRegistrationResponse> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    // --- DEVELOPMENT MOCK ONLY ---
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] registerCompany called with:', payload);
        resolve({
          requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
          message: 'Registration successful. Email sent.',
          resendAllowedAfterSeconds: 60,
        });
      }, 800);
    });
  }

  // --- PRODUCTION API PATH ---
  const response = await apiClient<any>('/api/v1/email/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      company_name: payload.companyName,
      hr_email: payload.hrEmail,
      hr_name: payload.hrName,
      hr_phone: payload.hrPhone,
    }),
  });

  return {
    // Note: If challenge_id is missing, default to empty string as per Sprint 1 patch note.
    requestId: response.data?.challenge_id || 'pending-patch-id',
    message: response.message,
    resendAllowedAfterSeconds: response.data?.resend_allowed_after_seconds || 60,
  };
}

/**
 * Step 2: Verify HR email using the token sent.
 * Production endpoint: POST /api/v1/email/verify-otp
 *
 * NOTE: The backend determines the role (HR or ADMIN). The frontend must
 * NEVER infer the role from the email address in production.
 */
export async function verifyEmail(payload: EmailVerificationPayload): Promise<AuthResponse> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    // --- DEVELOPMENT MOCK ONLY ---
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] verifyEmail called with:', payload);
        
        if (payload.token === '000000') {
          reject(new Error("Invalid verification token"));
          return;
        }

        // Isolated test simulation to allow local UI testing of Admin & HR routes
        const mockEmail = sessionStorage.getItem('mock_hrEmail') || '';
        const role = mockEmail === 'admin@siet.ac.in' ? 'admin' : 'hr';

        resolve({
          role,
          message: 'Email verified successfully',
          token: 'mock-session-token',
        });
      }, 1000);
    });
  }

  // --- PRODUCTION API PATH ---
  const response = await apiClient<any>('/api/v1/email/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      challenge_id: payload.requestId,
      otp: payload.token,
    }),
  });

  return {
    role: response.data?.role || 'hr',
    message: response.message,
    token: response.data?.session_token,
  };
}

/**
 * Helper to resend the verification email.
 * Production endpoint: POST /api/v1/email/resend-otp
 */
export async function resendVerification(requestId: string): Promise<{ message: string, resendAllowedAfterSeconds?: number }> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    // --- DEVELOPMENT MOCK ONLY ---
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] resendVerification called for requestId:', requestId);
        resolve({ message: 'Verification email resent.', resendAllowedAfterSeconds: 60 });
      }, 600);
    });
  }

  // --- PRODUCTION API PATH ---
  const response = await apiClient<any>('/api/v1/email/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ challenge_id: requestId }),
  });

  return { 
    message: response?.message || 'Verification email resent.',
    resendAllowedAfterSeconds: response?.data?.resend_allowed_after_seconds || 60,
  };
}

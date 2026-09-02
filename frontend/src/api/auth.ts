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
import type { CompanyDetails } from '../types';

export interface CompanyRegistrationPayload extends CompanyDetails {}

export interface CompanyRegistrationResponse {
  requestId: string;
  message: string;
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
 * Production endpoint: POST /api/v1/auth/register
 */
export async function registerCompany(payload: CompanyRegistrationPayload): Promise<CompanyRegistrationResponse> {
  if (import.meta.env.DEV) {
    // --- DEVELOPMENT MOCK ONLY ---
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] registerCompany called with:', payload);
        resolve({
          requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
          message: 'Registration successful. Email sent.',
        });
      }, 800);
    });
  }

  // --- PRODUCTION API PATH ---
  return apiClient<CompanyRegistrationResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Step 2: Verify HR email using the token sent.
 * Production endpoint: POST /api/v1/auth/verify-email
 *
 * NOTE: The backend determines the role (HR or ADMIN). The frontend must
 * NEVER infer the role from the email address in production.
 */
export async function verifyEmail(payload: EmailVerificationPayload): Promise<AuthResponse> {
  if (import.meta.env.DEV) {
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
        });
      }, 1000);
    });
  }

  // --- PRODUCTION API PATH ---
  return apiClient<AuthResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Helper to resend the verification email.
 * Production endpoint: POST /api/v1/auth/resend-verification
 */
export async function resendVerification(requestId: string): Promise<{ message: string }> {
  if (import.meta.env.DEV) {
    // --- DEVELOPMENT MOCK ONLY ---
    return new Promise((resolve) => {
      setTimeout(() => {
        console.info('[DEV MOCK API] resendVerification called for requestId:', requestId);
        resolve({ message: 'Verification email resent.' });
      }, 600);
    });
  }

  // --- PRODUCTION API PATH ---
  return apiClient<{ message: string }>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
}

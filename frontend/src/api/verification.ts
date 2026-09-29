/**
 * src/api/verification.ts
 * =======================
 * Candidate verification API client.
 * Strictly aligned with FastAPI backend endpoints:
 *   - POST /api/v1/verification/bind-candidate
 *   - POST /api/v1/verification/confirm
 *   - GET  /api/v1/verification/{request_id}/status
 *   - GET  /api/v1/verification/history
 *   - GET  /api/v1/verification/{request_id}/report
 *   - GET  /api/v1/verification/public-status/{request_id}
 *   - GET  /api/v1/verification/status/{lookup_id}
 *   - POST /api/v1/verification/upload-certificate
 */

import { apiClient } from './client';
import type {
  APIResponse,
  CandidateDetails,
  BindCandidateRequest,
  BindCandidateResponse,
  ConfirmVerificationRequest,
  VerificationResultResponse,
  VerificationStatusResponse,
  VerificationHistoryResponse,
  PublicVerificationStatusResponse,
  PublicVerificationLookupResponse,
  CertificateUploadResponse,
} from '../types/api';

// Export canonical backend types
export type {
  CandidateDetails,
  BindCandidateRequest,
  BindCandidateResponse,
  ConfirmVerificationRequest,
  VerificationResultResponse,
  VerificationStatusResponse,
  PublicVerificationStatusResponse,
  PublicVerificationLookupResponse,
};

// Backwards-compatible aliases
export type VerificationCandidate = CandidateDetails;
export type BindCandidatePayload = BindCandidateRequest;
export type VerificationConfirmPayload = ConfirmVerificationRequest;
export type VerificationResult = VerificationResultResponse;
export type VerificationHistoryItem = VerificationStatusResponse;

/**
 * Step 3: Bind candidate academic details to a paid verification request.
 * Backend endpoint: POST /api/v1/verification/bind-candidate
 */
export async function bindCandidate(
  payload: BindCandidateRequest
): Promise<BindCandidateResponse> {
  const response = await apiClient<APIResponse<BindCandidateResponse>>(
    '/api/v1/verification/bind-candidate',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

/**
 * Step 4: Confirm candidate details and trigger the official verification engine.
 * Backend endpoint: POST /api/v1/verification/confirm
 */
export async function confirmVerification(
  payload: ConfirmVerificationRequest
): Promise<VerificationResultResponse> {
  const response = await apiClient<APIResponse<VerificationResultResponse>>(
    '/api/v1/verification/confirm',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

/**
 * Polling / lookup for a verification request by authenticated HR owner.
 * Backend endpoint: GET /api/v1/verification/{request_id}/status
 */
export async function getVerificationStatus(
  requestId: string
): Promise<VerificationStatusResponse> {
  const response = await apiClient<APIResponse<VerificationStatusResponse>>(
    `/api/v1/verification/${encodeURIComponent(requestId)}/status`,
    { method: 'GET' }
  );
  return response.data;
}

/**
 * Get all verification requests owned by the authenticated HR user.
 * Backend endpoint: GET /api/v1/verification/history
 */
export async function getVerificationHistory(): Promise<VerificationStatusResponse[]> {
  const response = await apiClient<APIResponse<VerificationHistoryResponse>>(
    '/api/v1/verification/history',
    { method: 'GET' }
  );
  return response.data.requests;
}

/**
 * Fetch detailed verification outcome report for authenticated HR owner.
 * Backend endpoint: GET /api/v1/verification/{request_id}/report
 */
export async function getVerificationReport(
  requestId: string
): Promise<VerificationResultResponse> {
  const response = await apiClient<APIResponse<VerificationResultResponse>>(
    `/api/v1/verification/${encodeURIComponent(requestId)}/report`,
    { method: 'GET' }
  );
  return response.data;
}

/**
 * Public lookup for verification status with masked PII.
 * Backend endpoint: GET /api/v1/verification/public-status/{request_id}
 */
export async function getPublicVerificationStatus(
  requestId: string
): Promise<PublicVerificationStatusResponse> {
  const response = await apiClient<APIResponse<PublicVerificationStatusResponse>>(
    `/api/v1/verification/public-status/${encodeURIComponent(requestId)}`,
    { method: 'GET' }
  );
  return response.data;
}

/**
 * Public QR credential verification lookup.
 * Backend endpoint: GET /api/v1/verification/status/{lookup_id}
 */
export async function lookupPublicCredential(
  lookupId: string
): Promise<PublicVerificationLookupResponse> {
  return apiClient<PublicVerificationLookupResponse>(
    `/api/v1/verification/status/${encodeURIComponent(lookupId)}`,
    { method: 'GET' }
  );
}

/**
 * Upload a degree / provisional certificate file (PDF, JPG, PNG under 5MB).
 * Backend endpoint: POST /api/v1/verification/upload-certificate
 */
export async function uploadCertificate(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient<CertificateUploadResponse | { file_url: string }>(
    '/api/v1/verification/upload-certificate',
    {
      method: 'POST',
      body: formData,
    }
  );

  if ('file_url' in response && response.file_url) {
    return response.file_url;
  }
  throw new Error('Server response missing uploaded certificate URL.');
}

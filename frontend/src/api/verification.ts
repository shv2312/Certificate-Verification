import { apiClient } from './client';

export interface VerificationCandidate {
  candidate_name: string;
  register_number: string;
}

export interface BindCandidatePayload {
  verification_request_id: string;
  candidate: VerificationCandidate;
}

export interface VerificationConfirmPayload {
  verification_request_id: string;
}

export interface VerificationResult {
  verification_request_id: string;
  display_request_id: string;
  status: string;
  candidate_name: string | null;
  university_name: string | null;
  institute_name: string | null;
  course: string | null;
  branch: string | null;
  register_number: string | null;
  year_of_passing: number | null;
  backlog_status: string | null;
  period_of_study: string | null;
  mode_of_education: string | null;
  message: string;
}

export async function bindCandidate(payload: BindCandidatePayload): Promise<{ success: boolean; message?: string }> {

  const response = await apiClient<{ message?: string }>('/api/v1/verification/bind-candidate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, message: response.message };
}

export async function confirmVerification(payload: VerificationConfirmPayload): Promise<VerificationResult> {

  const response = await apiClient<{ data: VerificationResult }>('/api/v1/verification/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function getVerificationStatus(requestId: string): Promise<{ status: string }> {

  const response = await apiClient<{ data: { status: string } }>(`/api/v1/verification/${requestId}/status`);
  return response.data;
}

export interface VerificationHistoryItem {
  id: string;
  display_request_id: string;
  status: string;
  created_at: number;
}

export async function getVerificationHistory(): Promise<VerificationHistoryItem[]> {
  const response = await apiClient<{ data: { requests: VerificationHistoryItem[] } }>('/api/v1/verification/history');
  return response.data.requests;
}

/**
 * Upload a degree/provisional certificate file.
 * Sends a multipart/form-data POST to the backend and returns the stored URL.
 */
export async function uploadCertificate(file: File): Promise<string> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${API_BASE_URL}/api/v1/verification/upload-certificate`;

  const formData = new FormData();
  formData.append('file', file);

  // Auth header (same pattern as apiClient, but no Content-Type override)
  const headers = new Headers();
  const authStateStr = sessionStorage.getItem('siet_auth_state');
  if (authStateStr) {
    try {
      const authState = JSON.parse(authStateStr);
      if (authState.sessionToken) {
        headers.set('Authorization', `Bearer ${authState.sessionToken}`);
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch(url, { method: 'POST', body: formData, headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let detail = `Upload failed (${response.status})`;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const json: { data: { certificate_url: string } } = await response.json();
  return json.data.certificate_url;
}

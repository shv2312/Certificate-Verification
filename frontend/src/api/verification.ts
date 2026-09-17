import { apiClient } from './client';

export interface VerificationCandidate {
  candidate_name: string;
  register_number: string;
  course: string;
  branch: string;
  year_of_passing: number;
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

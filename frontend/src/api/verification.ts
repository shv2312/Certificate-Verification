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
  if (import.meta.env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Candidate bound successfully.' });
      }, 1000);
    });
  }

  const response = await apiClient<{ message?: string }>('/api/v1/verification/bind-candidate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, message: response.message };
}

export async function confirmVerification(payload: VerificationConfirmPayload): Promise<VerificationResult> {
  if (import.meta.env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          verification_request_id: payload.verification_request_id,
          display_request_id: 'SIET-DEV-123',
          status: 'VERIFIED',
          candidate_name: 'ARJUN RAMASWAMY',
          university_name: 'Sri Shakthi Institute of Engineering and Technology',
          institute_name: 'SIET',
          course: 'B.E.',
          branch: 'COMPUTER SCIENCE AND ENGINEERING',
          register_number: '710621104001',
          year_of_passing: 2024,
          backlog_status: 'NO BACKLOGS',
          period_of_study: '2020-2024',
          mode_of_education: 'FULL TIME',
          message: 'Candidate verified successfully.',
        });
      }, 1500);
    });
  }

  const response = await apiClient<{ data: VerificationResult }>('/api/v1/verification/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function getVerificationStatus(requestId: string): Promise<{ status: string }> {
  if (import.meta.env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ status: 'VERIFIED' }), 500);
    });
  }

  const response = await apiClient<{ data: { status: string } }>(`/api/v1/verification/${requestId}/status`);
  return response.data;
}

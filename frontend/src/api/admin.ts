/**
 * src/api/admin.ts
 * ================
 * API client functions for SIET Admin Portal endpoints.
 */

import { apiClient, type APIResponse } from './client';

export interface StudentRecordItem {
  id: number;
  register_number: string;
  full_name: string;
  programme_name: string;
  branch_name: string;
  year_of_passing: number;
  university_name: string;
  institute_name: string;
  mode_of_education: string;
  has_arrear: boolean;
  is_active: boolean;
}

export interface StudentListResult {
  total: number;
  limit: number;
  offset: number;
  students: StudentRecordItem[];
}

export interface ImportResult {
  imported_count: number;
  updated_count: number;
  total_processed: number;
  errors: string[];
}

export interface AuditQueueItem {
  id: string;
  display_request_id: string;
  company_name: string;
  hr_email: string;
  status: string;
  admin_decision: string;
  created_at: any;
  certificate_url?: string | null;
  similarity_percentage: number;
  similarity_badge_color: 'green' | 'yellow' | 'red';
  submitted_name: string;
  submitted_register_number: string;
  submitted_programme: string;
  submitted_branch: string;
  submitted_year_of_passing: string;
  submitted_dob: string;
  db_name?: string | null;
  db_register_number?: string | null;
  db_programme?: string | null;
  db_branch?: string | null;
  db_year_of_passing?: string | null;
  matches: {
    name: boolean;
    register_number: boolean;
    programme: boolean;
    year_of_passing: boolean;
    dob: boolean;
  };
}

export interface SystemOverviewData {
  total_verifications: number;
  pending_queue_size: number;
  approved_count: number;
  denied_count: number;
  approval_rate: string;
  average_turnaround: string;
  database_status: {
    status: string;
    engine: string;
    total_student_records: number;
    read_latency_ms: number;
  };
  payment_gateway_status: {
    provider: string;
    status: string;
    mode: string;
    ping_latency_ms: number;
  };
  storage_status: {
    status: string;
    mounted_path: string;
    files_count: number;
    disk_usage_mb: number;
  };
}

/**
 * Fetch paginated list of student records from the database
 */
export async function getStudents(params: {
  search?: string;
  programme_id?: number;
  limit?: number;
  offset?: number;
}): Promise<APIResponse<StudentListResult>> {
  return apiClient<APIResponse<StudentListResult>>('/api/v1/admin/students', {
    method: 'GET',
    params: {
      search: params.search,
      programme_id: params.programme_id,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    },
  });
}

/**
 * Bulk upload student data (.xlsx, .xls, .csv, .json up to 25MB)
 */
export async function importStudentData(file: File): Promise<APIResponse<ImportResult>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient<APIResponse<ImportResult>>('/api/v1/admin/students/import', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Fetch active approval queue with similarity match calculations
 */
export async function getAuditQueue(): Promise<APIResponse<AuditQueueItem[]>> {
  return apiClient<APIResponse<AuditQueueItem[]>>('/api/v1/admin/audit/queue', {
    method: 'GET',
  });
}

/**
 * One-click approve verification request
 */
export async function approveVerification(requestId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/api/v1/admin/requests/${requestId}/approve`, {
    method: 'POST',
  });
}

/**
 * One-click deny verification request with reason
 */
export async function rejectVerification(requestId: string, reason: string): Promise<{ status: string }> {
  return apiClient<{ status: string }>(`/api/v1/admin/requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Fetch system overview metrics, gateway health, and database metrics
 */
export async function getSystemOverview(): Promise<APIResponse<SystemOverviewData>> {
  return apiClient<APIResponse<SystemOverviewData>>('/api/v1/admin/system/overview', {
    method: 'GET',
  });
}

/**
 * Fetch pending requests for notifications
 */
export async function getPendingRequests(): Promise<any[]> {
  return apiClient<any[]>('/api/v1/admin/requests/pending', {
    method: 'GET',
  });
}

/**
 * src/types/api.ts
 * ================
 * TypeScript definitions strictly mirroring the FastAPI backend schemas,
 * database models, and API envelope contracts for the SIET Academic Background
 * Verification Portal.
 *
 * Backend reference files:
 *   - backend/app/schemas/common.py
 *   - backend/app/schemas/email_verification.py
 *   - backend/app/schemas/verification.py
 *   - backend/app/schemas/payment.py
 *   - backend/app/routes/auth.py
 *   - backend/app/routes/admin.py
 *   - backend/app/db/models.py
 */

// -----------------------------------------------------------------------------
// 1. Common Response Envelopes & Error Structures
// -----------------------------------------------------------------------------

/**
 * Standard backend response envelope.
 * Defined in backend/app/schemas/common.py: APIResponse[T]
 */
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Standard backend error envelope.
 * Defined in backend/app/schemas/common.py: APIError
 */
export interface APIErrorResponse {
  success: false;
  message: string;
  error_code: string;
  details?: Record<string, any> | Array<{ loc: string[]; msg: string; type: string }> | string | null;
}

/**
 * Custom Error class with rich backend error details.
 */
export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: any;

  constructor(message: string, status: number, errorCode = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Health check response: GET /api/health
 */
export interface HealthResponse {
  status: string;
  environment: string;
  version: string;
}

// -----------------------------------------------------------------------------
// 2. Email Verification & HR Onboarding Schemas
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/email/send-otp Request Body
 * Defined in backend/app/schemas/email_verification.py: SendOTPRequest
 */
export interface SendOTPRequest {
  organization_type?: string | null;
  organization_name: string; // 2-200 chars
  requester_email: string;   // RFC-5321 email
  requester_name: string;    // 2-255 chars
  requester_role: string;    // 2-150 chars (Required)
  requester_phone: string;   // E.164 phone format e.g. +919876543210
}

/**
 * POST /api/v1/email/send-otp Response Data
 * Defined in backend/app/schemas/email_verification.py: SendOTPResponse
 */
export interface SendOTPResponse {
  challenge_id: string;
  masked_email: string;
  resend_allowed_after_seconds: number;
  dev_otp?: string | null;
}

/**
 * POST /api/v1/email/resend-otp Request Body
 * Defined in backend/app/schemas/email_verification.py: ResendOTPRequest
 */
export interface ResendOTPRequest {
  challenge_id: string; // 10-128 chars
}

/**
 * POST /api/v1/email/verify-otp Request Body
 * Defined in backend/app/schemas/email_verification.py: VerifyOTPRequest
 */
export interface VerifyOTPRequest {
  challenge_id: string; // 10-128 chars
  otp: string;          // 6 digits: ^\d{6}$
  email?: string;       // optional requester email
}

/**
 * POST /api/v1/email/verify-otp Response Data
 * Defined in backend/app/schemas/email_verification.py: VerifyOTPResponse
 */
export interface VerifyOTPResponse {
  session_token: string;
  verified_company: string;
  verified_email: string;
  role: 'HR' | 'ADMIN' | string;
}

/**
 * GET /api/v1/auth/me Response Data
 * Defined in backend/app/routes/auth.py: AuthMeResponse
 */
export interface AuthMeResponse {
  company_name: string;
  hr_email: string;
  role: string;
}

// -----------------------------------------------------------------------------
// 3. Payment Flow Schemas
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/payment/initiate Request Body
 * Defined in backend/app/schemas/payment.py: PaymentInitiateRequest
 */
export interface PaymentInitiateRequest {
  // Empty body in Sprint 1; plan_id may be added in future tiers
}

/**
 * POST /api/v1/payment/initiate Response Data
 * Defined in backend/app/schemas/payment.py: PaymentInitiateResponse
 */
export interface PaymentInitiateResponse {
  payment_session_id: string;
  gateway_order_id: string;
  gateway_key_id: string;
  amount_paise: number;
  currency: string;
  description: string;
}

/**
 * POST /api/v1/payment/verify-checkout Request Body
 * Defined in backend/app/schemas/payment.py: PaymentCheckoutVerifyRequest
 */
export interface PaymentCheckoutVerifyRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * POST /api/v1/payment/verify Request Body
 * Defined in backend/app/schemas/payment.py: PaymentVerifyRequest
 */
export interface PaymentVerifyRequest {
  verification_request_id?: string | null;
  payment_session_id?: string | null;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export type PaymentStatus = 'PENDING' | 'PAID_UNUSED' | 'FAILED' | 'EXPIRED';

/**
 * GET /api/v1/payment/{payment_session_id}/status Response Data
 * and POST /api/v1/payment/verify-checkout Response Data
 * Defined in backend/app/schemas/payment.py: PaymentStatusResponse
 */
export interface PaymentStatusResponse {
  payment_session_id: string;
  status: PaymentStatus;
  verification_request_id?: string | null;
  display_request_id?: string | null;
}

// -----------------------------------------------------------------------------
// 4. Candidate & Verification Flow Schemas
// -----------------------------------------------------------------------------

/**
 * Candidate academic details submitted by HR.
 * Defined in backend/app/schemas/verification.py: CandidateDetails
 */
export interface CandidateDetails {
  candidate_name: string;         // 2-150 chars
  dob: string;                    // YYYY-MM-DD
  register_number: string;        // 3-30 chars, ^[A-Za-z0-9\-/]+$
  degree: string;                 // 2-100 chars (e.g. B.E., B.Tech)
  degree_course?: string;         // alias for degree
  specialization: string;         // 2-150 chars (e.g. Computer Science)
  year_of_passing: number;        // integer, 1990-2100
  certificate_no: string;         // 2-100 chars
  year_of_enrolment?: number | null; // optional integer, 1990-2100
  class_obtained?: string | null;    // optional string (e.g., First Class)
  certificate_url?: string | null;   // optional file URL uploaded
}

/**
 * POST /api/verification/initiate Request Body
 * Defined in backend/app/schemas/verification.py: InitiateVerificationRequest
 */
export interface InitiateVerificationRequest {
  candidate_name: string;
  register_number: string;
  degree?: string | null;
  degree_course?: string | null;
  specialization?: string | null;
  year_of_passing?: number | null;
  dob?: string | null;
  certificate_no?: string | null;
  year_of_enrolment?: number | null;
  class_obtained?: string | null;
  certificate_url?: string | null;
}

/**
 * POST /api/verification/initiate Response Data
 * Defined in backend/app/schemas/verification.py: InitiateVerificationResponse
 */
export interface InitiateVerificationResponse {
  verification_request_id: string;
  display_request_id: string;
  payment_order_id: string;
  payment_session_id: string;
  gateway_key_id: string;
  amount_paise: number;
  currency: string;
  candidate_summary: {
    candidate_name: string;
    register_number: string;
    degree_course: string;
    year_of_passing: number;
  };
}

/**
 * POST /api/v1/verification/bind-candidate Request Body
 * Defined in backend/app/schemas/verification.py: BindCandidateRequest
 */
export interface BindCandidateRequest {
  verification_request_id: string;
  candidate: CandidateDetails;
}

/**
 * POST /api/v1/verification/bind-candidate Response Data
 * Defined in backend/app/schemas/verification.py: BindCandidateResponse
 */
export interface BindCandidateResponse {
  verification_request_id: string;
  display_request_id: string;
  status: string; // CANDIDATE_BOUND
  candidate: CandidateDetails;
  warning: string;
}

/**
 * POST /api/v1/verification/confirm Request Body
 * Defined in backend/app/schemas/verification.py: ConfirmVerificationRequest
 */
export interface ConfirmVerificationRequest {
  verification_request_id: string;
}

export type VerificationOutcomeStatus =
  | 'VERIFIED'
  | 'NAME_MISMATCH'
  | 'NOT_FOUND'
  | 'ERROR'
  | 'NOT_VERIFIED'
  | 'PAID_UNUSED'
  | 'CANDIDATE_BOUND'
  | 'VERIFICATION_IN_PROGRESS';

/**
 * POST /api/v1/verification/confirm Response Data
 * GET /api/v1/verification/{request_id}/report Response Data
 * Defined in backend/app/schemas/verification.py: VerificationResultResponse
 */
export interface VerificationResultResponse {
  verification_request_id: string;
  display_request_id: string;
  status: VerificationOutcomeStatus | string;
  candidate_name?: string | null;
  university_name?: string | null;
  institute_name?: string | null;
  course?: string | null;
  branch?: string | null;
  register_number?: string | null;
  year_of_passing?: number | null;
  backlog_status?: string | null;
  period_of_study?: string | null;
  mode_of_education?: string | null;
  message: string;
  verification_reference_url?: string | null;
}

/**
 * GET /api/v1/verification/{request_id}/status Response Data
 * Defined in backend/app/schemas/verification.py: VerificationStatusResponse
 */
export interface VerificationStatusResponse {
  verification_request_id: string;
  display_request_id: string;
  status: string;
  company_name: string;
  hr_email: string;
}

/**
 * GET /api/v1/verification/history Response Data
 * Defined in backend/app/schemas/verification.py: VerificationHistoryResponse
 */
export interface VerificationHistoryResponse {
  requests: VerificationStatusResponse[];
}

/**
 * GET /api/v1/verification/public-status/{request_id} Response Data
 * Defined in backend/app/schemas/verification.py: PublicVerificationStatusResponse
 */
export interface PublicVerificationStatusResponse {
  display_request_id: string;
  status: string;
  status_label: string;
  company_name: string;
  candidate_name_masked?: string | null;
  verification_reference_url?: string | null;
}

/**
 * GET /api/v1/verification/status/{lookup_id} Response Data
 * Defined in backend/app/routes/verification.py: PublicVerificationLookupResponse
 */
export interface PublicVerificationLookupResponse {
  display_request_id: string;
  institution_id: string;
  status: string;
  admin_decision?: string | null;
  verified_at?: string | number | null;
  candidate_name_masked?: string | null;
  is_verified: boolean;
  academic_year?: number | null;
  course_name?: string | null;
}

/**
 * Upload certificate response: POST /api/v1/verification/upload-certificate
 */
export interface CertificateUploadResponse {
  file_url: string;
  filename: string;
}

// -----------------------------------------------------------------------------
// 5. Admin Portal Schemas
// -----------------------------------------------------------------------------

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  session_token: string;
  role: string;
}

export interface VerificationRequestSummary {
  verification_request_id: string;
  display_request_id: string;
  status: string;
  company_name: string;
  hr_email: string;
  hr_name?: string | null;
  candidate_name?: string | null;
  created_at: any;
}

export interface CompanyDistribution {
  company_name: string;
  count: number;
}

export interface AdminStats {
  total: number;
  verified: number;
  not_verified: number;
  pending: number;
  in_progress: number;
  error: number;
  total_hrs?: number | null;
  company_distribution?: CompanyDistribution[] | null;
}

export interface RejectRequestPayload {
  reason: string;
}

// -----------------------------------------------------------------------------
// 6. Database Entity Models (mirroring backend/app/db/models.py)
// -----------------------------------------------------------------------------

export interface InstitutionModel {
  id: string;
  name: string;
  code: string;
  admin_email?: string | null;
  is_active: boolean;
}

export interface StudentModel {
  id: number;
  register_number: string;
  full_name: string;
  full_name_normalized: string;
  programme_id: number;
  branch_id: number;
  year_of_passing: number;
  university_name: string;
  institute_name: string;
  period_of_study_start?: number | null;
  period_of_study_end?: number | null;
  mode_of_education?: string | null;
  has_arrear: boolean;
  is_active: boolean;
  imported_at: string;
  updated_at: string;
  institution_id?: string | null;
}

export interface AdminAccountModel {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface EmailChallengeModel {
  id: string; // challenge_id
  email: string;
  company_name: string;
  hr_name?: string | null;
  hr_phone?: string | null;
  otp_hmac: string;
  attempts: number;
  verified: boolean;
  last_sent_at: number;
  created_at: number;
}

export interface PaymentSessionModel {
  id: string; // payment_session_id
  gateway_order_id?: string | null;
  amount_paise: number;
  status: string;
  verification_request_id?: string | null;
  created_at: number;
}

export interface VerificationRequestModel {
  id: string; // verification_request_id
  display_request_id: string;
  owner_id?: number | null;
  payment_session_id?: string | null;
  status: string;
  company_name: string;
  hr_email: string;
  hr_name?: string | null;
  hr_phone?: string | null;
  hr_submitted_name?: string | null;
  hr_submitted_register_number?: string | null;
  hr_submitted_programme?: string | null;
  hr_submitted_branch?: string | null;
  hr_submitted_year_of_passing?: number | null;
  candidate_data?: string | null; // JSON string
  verification_result?: string | null; // JSON string
  institution_id?: string | null;
  certificate_url?: string | null;
  admin_decision: string;
  admin_remarks?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: number;
  completed_at?: number | null;
}

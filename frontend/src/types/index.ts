/**
 * Shared TypeScript types for the SIET Academic Background Verification Portal.
 *
 * These types represent the data contracts between the frontend UI and
 * the FastAPI backend (owned by Shri Hari Vishnu S).
 *
 * NOTE: Backend API endpoints are NOT yet available.
 * These types are defined for UI development only.
 * Update this file when the backend API contract is finalized.
 */

// ── Verification Workflow Steps ──────────────────────────────────────────────

/**
 * Represents a single step in the verification workflow.
 * Used by the ProgressStepper component.
 */
export type StepStatus = 'completed' | 'current' | 'upcoming';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
}

// ── Company / HR Information ─────────────────────────────────────────────────

/**
 * Information collected from the HR / company initiating the verification.
 * Submitted to the backend before email verification.
 *
 * MOCK: Company details API endpoint not yet available.
 */
export interface CompanyDetails {
  companyName: string;
  hrName: string;
  hrEmail: string;
}

// ── Candidate Information ────────────────────────────────────────────────────

/**
 * Minimum required candidate details provided by HR for verification.
 * These fields are matched against the official SIET institutional database
 * (managed by Parthiban V).
 *
 * NOTE: Exact field set may be revised after HOD feedback.
 * Fields marked with (mandatory) must always be present.
 */
export interface CandidateDetails {
  candidateName: string;        // (mandatory)
  registerNumber: string;       // (mandatory) Register / Roll Number
  course: string;               // (mandatory) Programme / Degree
  branch: string;               // (mandatory) Branch / Specialization
  yearOfPassing: string;        // (mandatory) YYYY format
}

// ── Verification Result ──────────────────────────────────────────────────────

/**
 * Verification outcome returned by the backend after comparing candidate
 * details against the institutional database.
 *
 * MOCK: Verification API endpoint not yet available.
 * This type is defined for future integration.
 */
export type VerificationStatus = 'verified' | 'not_verified' | 'pending';

export interface VerificationResult {
  requestId: string;
  status: VerificationStatus;
  candidateName: string;
  instituteName: string;
  universityName?: string;
  course?: string;
  branch?: string;
  registerNumber?: string;
  yearOfPassing?: string;
  backlogStatus?: 'none' | 'cleared' | 'pending';
  periodOfStudy?: string;
  modeOfEducation?: string;
  verifiedAt?: string; // ISO datetime string
  reportEmailSent?: boolean;
}

// ── Payment ──────────────────────────────────────────────────────────────────

/**
 * Payment session data.
 * The frontend initiates a payment session but NEVER verifies payment success
 * based on a frontend redirect alone.
 * Backend payment verification is required before unlocking the candidate form.
 *
 * MOCK: Payment gateway integration not yet available.
 */
export interface PaymentSession {
  sessionId: string;
  requestId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isPlaceholder?: boolean; // Pages not yet implemented in this sprint
}

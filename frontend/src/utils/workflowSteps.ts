/**
 * Verification workflow step definitions.
 *
 * These are used by the ProgressStepper component to render the
 * step-by-step workflow indicator across all verification pages.
 *
 * Import this array and override the `status` field per page to
 * indicate which step is current/completed/upcoming.
 */

import type { WorkflowStep } from '../types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id:          'company',
    label:       'Company Details',
    description: 'Provide company and HR information',
    status:      'upcoming',
  },
  {
    id:          'email-verify',
    label:       'Email Verification',
    description: 'Verify official HR email address',
    status:      'upcoming',
  },
  {
    id:          'payment',
    label:       'Payment',
    description: 'Secure payment for verification service',
    status:      'upcoming',
  },
  {
    id:          'candidate',
    label:       'Candidate Details',
    description: 'Enter candidate academic information',
    status:      'upcoming',
  },
  {
    id:          'verification',
    label:       'Verification',
    description: 'Processing against institutional records',
    status:      'upcoming',
  },
  {
    id:          'result',
    label:       'Result',
    description: 'Verification outcome and report',
    status:      'upcoming',
  },
];

/**
 * Helper: produce a steps array with statuses set appropriately
 * based on which step index is currently active (0-indexed).
 */
export function buildStepStatuses(currentIndex: number): WorkflowStep[] {
  return WORKFLOW_STEPS.map((step, i) => ({
    ...step,
    status: i < currentIndex ? 'completed' : i === currentIndex ? 'current' : 'upcoming',
  }));
}

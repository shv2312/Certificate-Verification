/**
 * Shared TypeScript types for the SIET Academic Background Verification Portal.
 *
 * Re-exports the authoritative backend API contract types defined in api.ts
 * alongside frontend UI workflow types.
 */

export * from './api';

// ── Verification Workflow Steps ──────────────────────────────────────────────

export type StepStatus = 'completed' | 'current' | 'upcoming';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isPlaceholder?: boolean;
}

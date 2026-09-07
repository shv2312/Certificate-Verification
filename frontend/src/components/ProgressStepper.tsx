/**
 * ProgressStepper — Reusable verification workflow progress indicator.
 *
 * Renders the multi-step verification workflow horizontally on desktop
 * and as a compact numbered list on mobile.
 *
 * Usage:
 *   import { buildStepStatuses } from '../utils/workflowSteps';
 *   const steps = buildStepStatuses(2); // 0 = Company, 1 = Email, 2 = Payment (current)
 *   <ProgressStepper steps={steps} />
 *
 * The component does NOT own state — pass the correct steps array from the page.
 * This keeps the component pure and easy to test in isolation.
 */

import type { WorkflowStep } from '../types';

interface ProgressStepperProps {
  steps: WorkflowStep[];
  className?: string;
}

// ── Icon for each state ──────────────────────────────────────────────────────

function StepIcon({ status, stepNumber }: { status: WorkflowStep['status']; stepNumber: number }) {
  if (status === 'completed') {
    return (
      <span
        className="flex items-center justify-center w-8 h-8 rounded-full
                   bg-siet-sky text-white flex-shrink-0"
        aria-hidden="true"
      >
        {/* Checkmark */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span
        className="flex items-center justify-center w-8 h-8 rounded-full
                   border-2 border-siet-sky bg-white text-siet-sky
                   font-semibold text-sm flex-shrink-0 animate-step-pulse"
        aria-hidden="true"
      >
        {stepNumber}
      </span>
    );
  }

  // upcoming
  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-full
                 border-2 border-siet-border bg-white text-siet-muted
                 font-semibold text-sm flex-shrink-0"
      aria-hidden="true"
    >
      {stepNumber}
    </span>
  );
}



// ── Main Component ───────────────────────────────────────────────────────────

export default function ProgressStepper({ steps, className = '' }: ProgressStepperProps) {
  return (
    <div
      className={`surface-card p-4 sm:p-6 ${className}`}
      aria-label="Verification workflow progress"
    >
      {/* ── Desktop: Horizontal stepper ── */}
      <ol
        className="hidden sm:flex justify-between w-full relative"
        aria-label="Verification steps"
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="relative flex flex-col items-center flex-1 text-center"
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            {/* Connector (not after last step) */}
            {index < steps.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full px-2" aria-hidden="true">
                <div className={`h-0.5 w-full transition-colors duration-300 ${step.status === 'completed' ? 'bg-siet-sky' : 'bg-siet-border'}`} />
              </div>
            )}
            
            {/* Step node */}
            <div className="relative z-10 bg-white">
              <StepIcon status={step.status} stepNumber={index + 1} />
            </div>
            
            <span
              className={`mt-2 text-xs font-medium text-center leading-tight w-24 ${
                step.status === 'completed'
                  ? 'text-siet-sky'
                  : step.status === 'current'
                  ? 'text-siet-navy font-semibold'
                  : 'text-siet-muted'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {/* ── Mobile: Compact numbered list ── */}
      <div className="sm:hidden" aria-label="Verification steps — mobile">
        {/* Show current step prominently */}
        {steps.map((step, index) => {
          if (step.status !== 'current') return null;
          return (
            <div key={step.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <StepIcon status="current" stepNumber={index + 1} />
                <div>
                  <p className="text-sm font-semibold text-siet-navy">{step.label}</p>
                  {step.description && (
                    <p className="text-xs text-siet-slate">{step.description}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-siet-muted mt-1">
                Step {index + 1} of {steps.length}
              </p>
            </div>
          );
        })}

        {/* Compact progress bar */}
        <div
          className="mt-3 h-1.5 bg-siet-silver rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={steps.filter((s) => s.status === 'completed').length + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label="Overall verification progress"
        >
          <div
            className="h-full bg-siet-sky rounded-full transition-all duration-500"
            style={{
              width: `${
                ((steps.filter((s) => s.status !== 'upcoming').length) /
                  steps.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

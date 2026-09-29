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
                   bg-[#16A34A] text-white flex-shrink-0 shadow-xs"
        aria-hidden="true"
      >
        {/* Checkmark */}
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span
        className="flex items-center justify-center w-8 h-8 rounded-full
                   bg-[#0B6A3E] text-white font-bold text-sm flex-shrink-0
                   ring-4 ring-emerald-100 shadow-xs"
        aria-hidden="true"
      >
        {stepNumber}
      </span>
    );
  }

  // upcoming / inactive
  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-full
                 bg-slate-100 border-2 border-slate-300 text-slate-500
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
      className={`surface-card p-4 sm:p-6 w-full ${className}`}
      aria-label="Verification workflow progress"
    >
      {/* ── Desktop: Horizontal stepper ── */}
      <ol
        className="hidden sm:grid grid-cols-6 gap-0 relative"
        aria-label="Verification steps"
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="relative flex flex-col items-center"
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            {/* Connector Line (behind icon) */}
            {index < steps.length - 1 && (
              <div
                className={`absolute top-4 left-1/2 w-full transition-colors duration-300 ${
                  step.status === 'completed' ? 'bg-[#16A34A] h-1' : 'bg-slate-200 h-0.5'
                }`}
                style={{ zIndex: 0 }}
                aria-hidden="true"
              />
            )}

            {/* Step Icon */}
            <div className="relative flex flex-col items-center gap-1 flex-shrink-0" style={{ zIndex: 10 }}>
              <StepIcon status={step.status} stepNumber={index + 1} />
              
              {/* Step Label */}
              <span
                className={`text-xs sm:text-sm text-center leading-tight max-w-[95%] px-1 mt-1 transition-colors duration-200 ${
                  step.status === 'current'
                    ? 'text-[#0B6A3E] font-bold'
                    : step.status === 'completed'
                    ? 'text-[#074828] font-semibold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
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
                  <p className="text-sm font-bold text-[#0B6A3E]">{step.label}</p>
                  {step.description && (
                    <p className="text-xs text-slate-500">{step.description}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Step {index + 1} of {steps.length}
              </p>
            </div>
          );
        })}

        {/* Compact progress bar */}
        <div
          className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
          role="progressbar"
          aria-valuenow={steps.filter((s) => s.status === 'completed').length + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label="Overall verification progress"
        >
          <div
            className="h-full bg-[#0B6A3E] rounded-full transition-all duration-500"
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

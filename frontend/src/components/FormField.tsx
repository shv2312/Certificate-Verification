/**
 * FormField — Accessible labeled form field wrapper.
 *
 * Renders a label + input (or any children) with consistent styling.
 * Supports mandatory field indicator ("*" in red) and helper/error messages.
 *
 * Usage:
 *   <FormField id="candidate-name" label="Candidate Name" required>
 *     <input id="candidate-name" className="form-input" ... />
 *   </FormField>
 */

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
  className = '',
}: FormFieldProps) {
  const hintId    = hint  ? `${id}-hint`    : undefined;
  const errorId   = error ? `${id}-error`   : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && (
          <span className="required-star" aria-label="required" role="img">
            *
          </span>
        )}
      </label>

      {/* Pass aria-describedby to the child via a wrapper div with data attribute */}
      <div aria-describedby={describedBy}>
        {children}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-siet-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-siet-error flex items-center gap-1" role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

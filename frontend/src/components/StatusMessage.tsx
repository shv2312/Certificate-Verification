/**
 * StatusMessage — Displays a contextual status/alert message.
 *
 * Used to show success, error, warning, or informational messages
 * on any page.  Does NOT rely solely on colour — uses icons and
 * border treatments for accessibility.
 *
 * Usage:
 *   <StatusMessage type="success" title="Verified" message="Candidate details match." />
 *   <StatusMessage type="error"   title="Not Verified" message="Details did not match." />
 */

import { clsx } from 'clsx';

type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type: StatusType;
  title?: string;
  message: string;
  className?: string;
}

const CONFIG: Record<StatusType, {
  bg: string; border: string; titleColor: string; textColor: string; icon: React.ReactNode;
}> = {
  success: {
    bg:         'bg-green-50',
    border:     'border-green-300',
    titleColor: 'text-siet-success',
    textColor:  'text-green-800',
    icon: (
      <svg className="w-5 h-5 text-siet-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    bg:         'bg-red-50',
    border:     'border-red-300',
    titleColor: 'text-siet-error',
    textColor:  'text-red-800',
    icon: (
      <svg className="w-5 h-5 text-siet-error flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    bg:         'bg-amber-50',
    border:     'border-amber-300',
    titleColor: 'text-siet-amber',
    textColor:  'text-amber-800',
    icon: (
      <svg className="w-5 h-5 text-siet-amber flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  info: {
    bg:         'bg-blue-50',
    border:     'border-blue-200',
    titleColor: 'text-siet-blue',
    textColor:  'text-blue-800',
    icon: (
      <svg className="w-5 h-5 text-siet-sky flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export default function StatusMessage({ type, title, message, className = '' }: StatusMessageProps) {
  const cfg = CONFIG[type];
  const roleAttr = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={roleAttr}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={clsx(
        'flex items-start gap-3 p-4 rounded border',
        cfg.bg, cfg.border, className
      )}
    >
      {cfg.icon}
      <div className="min-w-0">
        {title && (
          <p className={clsx('text-sm font-semibold', cfg.titleColor)}>
            {title}
          </p>
        )}
        <p className={clsx('text-sm', cfg.textColor, title ? 'mt-0.5' : '')}>
          {message}
        </p>
      </div>
    </div>
  );
}

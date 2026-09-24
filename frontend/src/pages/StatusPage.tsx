/**
 * StatusPage — Public verification status lookup.
 *
 * Allows anyone to enter a Verification Request ID (display_request_id)
 * and see the masked status. No authentication is required.
 *
 * API: GET /api/v1/verification/public-status/{request_id}
 *
 * PII policy (enforced by backend):
 *  - Candidate name is masked: first initial of each word + '***'
 *  - HR email is never returned
 *  - Only display_request_id (e.g. SIET-2024-0001) is shown, not the raw UUID
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';

interface PublicStatusData {
  display_request_id: string;
  status: string;
  status_label: string;
  company_name: string;
  candidate_name_masked?: string | null;
  verification_reference_url?: string | null;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: PublicStatusData;
}

// Map status codes to visual styles
const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  VERIFIED:                  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
  NOT_VERIFIED:              { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' },
  NAME_MISMATCH:             { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' },
  NOT_FOUND:                 { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' },
  ERROR:                     { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', dot: '#f97316' },
  VERIFICATION_IN_PROGRESS:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
  CANDIDATE_BOUND:           { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
  PAID_UNUSED:               { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', dot: '#8b5cf6' },
};

const DEFAULT_STYLE = { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', dot: '#94a3b8' };

export default function StatusPage() {
  const [requestId,  setRequestId]  = useState('');
  const [statusData, setStatusData] = useState<PublicStatusData | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | undefined>();

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmedId = requestId.trim();
    if (!trimmedId) {
      setError('Please enter a Verification Request ID.');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setStatusData(null);

    try {
      const url = `/api/v1/verification/public-status/${encodeURIComponent(trimmedId)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const json: APIResponse = await resp.json();

      if (!resp.ok) {
        // Surface the backend error message (404 = not found, etc.)
        const detail = (json as any).detail;
        const msg =
          typeof detail === 'object' ? detail?.message :
          typeof detail === 'string' ? detail :
          json.message || `Server error ${resp.status}`;
        throw new Error(msg);
      }

      setStatusData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setStatusData(null);
    } finally {
      setIsLoading(false);
    }
  }

  const style = statusData ? (STATUS_STYLES[statusData.status] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

  return (
    <PageContainer narrow>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-siet-navy mb-2">Track Verification Status</h1>
        <p className="text-siet-slate text-sm">
          Enter the Verification Request ID from your result email to check the current status.
          No login required.
        </p>
      </div>

      {/* Search card */}
      <div className="surface-card p-6 sm:p-8">
        <form onSubmit={handleSearch} noValidate className="space-y-5">
          <FormField
            id="status-request-id"
            label="Verification Request ID"
            required
            error={error}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="status-request-id"
                type="text"
                className="form-input flex-1"
                placeholder="e.g. SIET-2024-0001"
                value={requestId}
                onChange={(e) => {
                  setRequestId(e.target.value);
                  setError(undefined);
                }}
                disabled={isLoading}
                aria-required="true"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                id="status-search-btn"
                className="btn-primary sm:w-auto w-full whitespace-nowrap"
                disabled={isLoading || !requestId.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Searching…
                  </span>
                ) : 'Track Status'}
              </button>
            </div>
          </FormField>
        </form>

        {/* Result card */}
        {statusData && (
          <div className="mt-8 pt-6 border-t border-siet-border animate-fade-in">
            <h2 className="text-lg font-semibold text-siet-navy mb-4">Verification Result</h2>

            {/* Status badge */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-4"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: style.dot }}
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-0.5"
                   style={{ color: style.text, opacity: 0.7 }}>
                  Status
                </p>
                <p className="text-base font-bold" style={{ color: style.text }}>
                  {statusData.status_label}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="bg-siet-silver rounded-xl p-4 space-y-3">
              <DetailRow label="Request ID" value={statusData.display_request_id} mono />

              <DetailRow label="Requesting Company" value={statusData.company_name} />

              {statusData.candidate_name_masked && (
                <DetailRow
                  label="Candidate Name"
                  value={statusData.candidate_name_masked}
                  hint="Name masked for privacy"
                />
              )}
            </div>

            {/* Verified badge link */}
            {statusData.status === 'VERIFIED' && statusData.verification_reference_url && (
              <div className="mt-4 p-4 rounded-xl flex items-center gap-3"
                   style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">SIET Verified ✔</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Academic credentials have been verified against official SIET records.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy notice */}
            <p className="text-xs text-siet-muted mt-4 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Candidate name is masked to protect personal information.
              Full details are only accessible to the authorized HR representative.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Small helper component for consistent detail rows
function DetailRow({
  label, value, mono, hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4">
      <span className="text-sm font-medium text-siet-slate sm:w-44 flex-shrink-0">{label}:</span>
      <div>
        <span className={`text-sm font-semibold text-siet-navy ${mono ? 'font-mono tracking-wide' : ''}`}>
          {value}
        </span>
        {hint && <p className="text-xs text-siet-muted mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

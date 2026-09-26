/**
 * StatusPage — Public credential verification and QR landing page.
 *
 * Allows visitors, HR representatives, and background check auditors
 * to verify academic credential authenticity by scanning the QR code
 * or searching by Verification Request ID.
 *
 * API: GET /api/v1/verification/status/{lookup_id}
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';

interface PublicVerificationData {
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

export default function StatusPage() {
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id') || '';

  const [requestId, setRequestId] = useState(urlId);
  const [statusData, setStatusData] = useState<PublicVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (urlId.trim()) {
      setRequestId(urlId.trim());
      fetchVerificationStatus(urlId.trim());
    }
  }, [urlId]);

  async function fetchVerificationStatus(lookupId: string) {
    setIsLoading(true);
    setError(undefined);
    setStatusData(null);

    try {
      const url = `/api/v1/verification/status/${encodeURIComponent(lookupId)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json = await resp.json();

      if (!resp.ok) {
        const msg =
          typeof json.detail === 'string'
            ? json.detail
            : json.message || 'Verification record not found. Please check the ID.';
        throw new Error(msg);
      }

      setStatusData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification lookup.');
      setStatusData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmedId = requestId.trim();
    if (!trimmedId) {
      setError('Please enter a valid Verification Request ID.');
      return;
    }
    fetchVerificationStatus(trimmedId);
  }

  // Render Status Badge
  function renderStatusBadge(data: PublicVerificationData) {
    if (data.is_verified) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800">
          <svg className="w-8 h-8 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Verification Outcome</span>
            <p className="text-lg font-bold text-emerald-900 leading-tight">OFFICIALLY VERIFIED &amp; AUTHENTIC</p>
            <p className="text-xs text-emerald-700 mt-0.5">This certificate record has been certified by the Office of the Controller of Examinations.</p>
          </div>
        </div>
      );
    }

    if (data.admin_decision === 'PENDING_REVIEW' || data.status === 'PENDING' || data.status === 'VERIFICATION_IN_PROGRESS') {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6 bg-amber-50 border border-amber-200 text-amber-800">
          <svg className="w-8 h-8 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Verification Status</span>
            <p className="text-lg font-bold text-amber-900 leading-tight">UNDER INSTITUTIONAL REVIEW</p>
            <p className="text-xs text-amber-700 mt-0.5">Application is currently queued for institutional attestation and admin authorization.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 p-4 rounded-xl mb-6 bg-red-50 border border-red-200 text-red-800">
        <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">Verification Alert</span>
          <p className="text-lg font-bold text-red-900 leading-tight">NOT VERIFIED / RECORD MISMATCH</p>
          <p className="text-xs text-red-700 mt-0.5">The provided academic details could not be matched against official student registers.</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer narrow>
      {/* Institutional Crest / Seal banner */}
      <div className="surface-card mb-8 p-6 sm:p-8 border-l-4 border-l-siet-gold bg-gradient-to-r from-siet-navy to-[#1e293b] text-white rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
            <svg className="w-8 h-8 text-siet-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              Sri Shakthi Institute of Engineering and Technology
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide uppercase">
              Official Credential Verification System &bull; Office of the Controller of Examinations
            </p>
          </div>
        </div>
      </div>

      {/* Search card */}
      <div className="surface-card p-6 sm:p-8">
        <form onSubmit={handleSearch} noValidate className="space-y-4">
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
                placeholder="e.g. VR-2026-TEST"
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  'Verify ID'
                )}
              </button>
            </div>
          </FormField>
        </form>

        {/* Verification Result Card */}
        {statusData && (
          <div className="mt-8 pt-6 border-t border-siet-border animate-fade-in">
            {/* Status Badge */}
            {renderStatusBadge(statusData)}

            {/* Credential Details Table */}
            <div className="bg-siet-silver rounded-xl p-5 space-y-3.5 border border-slate-200/80">
              <h3 className="text-sm font-bold text-siet-navy uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                Credential Transcript Details
              </h3>

              <DetailRow
                label="Candidate Name"
                value={statusData.candidate_name_masked || '—'}
                hint="Candidate name masked in accordance with institutional privacy standards."
              />

              <DetailRow
                label="Degree / Course"
                value={statusData.course_name || 'Bachelor of Engineering'}
              />

              <DetailRow
                label="Academic Year"
                value={statusData.academic_year ? String(statusData.academic_year) : '—'}
              />

              <DetailRow
                label="Verification ID"
                value={statusData.display_request_id}
                mono
              />

              <DetailRow
                label="Institution Code"
                value={statusData.institution_id || 'siet-cbe'}
                mono
              />
            </div>

            {/* Action Button: Download Official Verification Report */}
            {statusData.is_verified && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-siet-navy">Official PDF Report Available</p>
                  <p className="text-xs text-siet-slate">Download digitally sealed institutional attestation document.</p>
                </div>
                <a
                  href={`/api/v1/verification/${encodeURIComponent(statusData.display_request_id)}/download-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm px-4 py-2.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Official Verification Report
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function DetailRow({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-xs sm:text-sm font-medium text-siet-slate sm:w-44 flex-shrink-0">{label}:</span>
      <div className="flex-1">
        <span className={`text-sm font-semibold text-siet-navy ${mono ? 'font-mono tracking-wide' : ''}`}>
          {value}
        </span>
        {hint && <p className="text-[11px] text-siet-muted mt-0.5 leading-snug">{hint}</p>}
      </div>
    </div>
  );
}


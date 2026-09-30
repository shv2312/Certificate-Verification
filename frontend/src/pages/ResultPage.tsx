import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ProgressStepper from '../components/ProgressStepper';
import { buildStepStatuses } from '../utils/workflowSteps';
import { ROUTES } from '../utils/routes';
import type { VerificationResultResponse } from '../types/api';
import { Download } from 'lucide-react';

const steps = buildStepStatuses(5); // Result step

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDownloadingAck, setIsDownloadingAck] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  const result = (location.state?.result as VerificationResultResponse) || (() => {
    try {
      const cached = sessionStorage.getItem('siet_verification_result');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    // Clear temporary workflow drafts upon reaching the final verification result
    sessionStorage.removeItem('siet_requester_draft');
    sessionStorage.removeItem('siet_candidate_draft');
    sessionStorage.removeItem('candidatePayload');
    sessionStorage.removeItem('siet_payment_draft');
    sessionStorage.removeItem('siet_active_request_id');
  }, []);

  if (!result) {
    return <Navigate to={ROUTES.REQUESTER} replace />;
  }

  const isPendingReview =
    result.status === 'PENDING_ADMIN_REVIEW' ||
    result.status === 'PENDING_REVIEW' ||
    (result as any).current_state === 'PENDING_ADMIN_REVIEW';
  const isVerified = result.status === 'VERIFIED';
  const isNameMismatch = result.status === 'NAME_MISMATCH';
  const isNotFound = result.status === 'NOT_FOUND';
  const isError = !isPendingReview && !isVerified && !isNameMismatch && !isNotFound;

  const displayRequestId =
    result.display_request_id ||
    (result as any).request_id ||
    result.verification_request_id ||
    sessionStorage.getItem('siet_active_display_id') ||
    'BGV-2026-000001';

  const downloadPdfUrl = result.verification_request_id
    ? `/api/v1/verification/${encodeURIComponent(result.verification_request_id)}/download-pdf`
    : null;

  async function handleDownloadAcknowledgment() {
    setIsDownloadingAck(true);
    setDownloadError(null);
    try {
      const targetId = result.verification_request_id || displayRequestId;
      const res = await fetch(`/api/v1/verification/${encodeURIComponent(targetId)}/acknowledgment-pdf`);
      if (!res.ok) {
        throw new Error(`Failed to generate acknowledgment slip (${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SIET_Acknowledgment_${displayRequestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download acknowledgment PDF failed:', err);
      setDownloadError(err.message || 'Failed to download acknowledgment slip. Please try again.');
    } finally {
      setIsDownloadingAck(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">
          {isPendingReview ? 'Verification Request Submitted' : 'Verification Result'}
        </h1>
        <p className="text-siet-slate text-sm">
          {isPendingReview
            ? 'Your verification request has been successfully queued for institutional review.'
            : 'Final official outcome of the academic verification request.'}
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <div className="max-w-3xl mx-auto surface-card overflow-hidden">
        <div
          className={`p-6 border-b ${
            isVerified
              ? 'bg-green-50 border-green-200'
              : isPendingReview
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isVerified
                  ? 'bg-green-100 text-siet-success'
                  : isPendingReview
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-siet-error'
              }`}
            >
              {isVerified ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : isPendingReview ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <div>
              <h2
                className={`text-xl font-bold ${
                  isVerified
                    ? 'text-siet-success'
                    : isPendingReview
                    ? 'text-amber-900'
                    : 'text-siet-error'
                }`}
              >
                {isPendingReview
                  ? 'Verification Submitted — Pending Institutional Review'
                  : result.status}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-slate-800">
                  Request ID: {displayRequestId}
                </span>
                {isPendingReview && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    PENDING_ADMIN_REVIEW
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-siet-navy font-medium">
            {isPendingReview
              ? 'Your request has been routed to the SIET Office of Academic Records. Estimated turnaround: 2–5 business days.'
              : result.message}
          </p>
        </div>

        <div className="p-6">
          {isPendingReview && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Institutional Review Queued</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    Your request has been routed to the SIET Office of Academic Records. Estimated turnaround: 2–5 business days.
                    An official institutional verification report will be dispatched to your verified email address upon completion.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-siet-navy mb-4">Submitted Candidate Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Candidate Name</dt>
                    <dd className="text-sm text-siet-navy font-semibold">{result.candidate_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Register Number</dt>
                    <dd className="text-sm text-siet-navy font-semibold">{result.register_number || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Degree / Programme</dt>
                    <dd className="text-sm text-siet-navy font-semibold">{result.course || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Field of Study / Specialization</dt>
                    <dd className="text-sm text-siet-navy font-semibold">{result.branch || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Year of Passing</dt>
                    <dd className="text-sm text-siet-navy font-semibold">{result.year_of_passing || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Status</dt>
                    <dd className="text-sm text-amber-700 font-semibold font-mono">Pending Institutional Review</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 border-t border-siet-border">
                <p className="text-xs text-siet-muted italic">
                  Institutional Notice: Payment has been confirmed and verified against banking records.
                  The verification docket has been forwarded to the Registrar's verification committee.
                </p>
              </div>
            </div>
          )}
          {isVerified && (
            <>
              <h3 className="text-lg font-bold text-siet-navy mb-4">Official Academic Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Candidate Name</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.candidate_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Register Number</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.register_number || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Course & Branch</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.course} {result.branch ? `- ${result.branch}` : ''}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Period of Study</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.period_of_study || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Year of Passing</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.year_of_passing || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Mode of Education</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.mode_of_education || 'Regular (Full-time)'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Backlog Status</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.backlog_status || 'None'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Institution</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.institute_name || result.university_name || 'Sri Shakthi Institute of Engineering and Technology'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-siet-muted font-medium uppercase tracking-wider mb-1">Affiliated University</dt>
                  <dd className="text-sm text-siet-navy font-semibold">{result.university_name || 'Anna University'}</dd>
                </div>
              </dl>
              <div className="mt-8 pt-4 border-t border-siet-border">
                <p className="text-xs text-siet-muted italic">
                  Institutional Disclaimer: This document is an electronic verification report issued directly from the 
                  official records of Sri Shakthi Institute of Engineering and Technology. It confirms the academic standing 
                  of the specified candidate at the time of verification.
                </p>
              </div>
            </>
          )}

          {isNameMismatch && (
            <div className="bg-siet-silver p-4 rounded text-center">
              <p className="text-sm font-medium text-siet-navy">
                The submitted candidate name does not match the official record.
              </p>
              <p className="text-xs text-siet-slate mt-2">
                For privacy and security reasons, academic details are not disclosed when candidate names mismatch.
              </p>
            </div>
          )}

          {isNotFound && (
            <div className="bg-siet-silver p-4 rounded text-center">
              <p className="text-sm font-medium text-siet-navy">
                No official record was found for the submitted register number.
              </p>
              <p className="text-xs text-siet-slate mt-2">
                Please verify the register number format and try again.
              </p>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 p-4 rounded text-center border border-red-200">
              <p className="text-sm font-medium text-siet-error">
                {result.message || 'Service is temporarily unavailable.'}
              </p>
              <p className="text-xs text-red-700 mt-2">
                Please retry your request later or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="p-6 bg-slate-50 border-t border-siet-border flex flex-col gap-4">
          {downloadError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center justify-between">
              <span>{downloadError}</span>
              <button 
                type="button" 
                onClick={() => setDownloadError(null)} 
                className="text-red-900 font-bold ml-2 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {isPendingReview && (
                <button
                  id="download-acknowledgment-btn"
                  type="button"
                  onClick={handleDownloadAcknowledgment}
                  disabled={isDownloadingAck}
                  className="h-12 flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-sm disabled:opacity-60"
                  title="Download Official Submission Acknowledgment Slip (PDF)"
                >
                  <Download className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span>{isDownloadingAck ? 'Generating Slip...' : 'Download Acknowledgment (PDF)'}</span>
                </button>
              )}

              {isVerified && downloadPdfUrl && (
                <a
                  href={downloadPdfUrl}
                  download
                  className="h-12 flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-sm"
                >
                  <Download className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span>Download Report (PDF)</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="h-12 flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all active:scale-[0.98] text-sm"
              >
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Slip</span>
              </button>

              {isPendingReview && (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STATUS)}
                  className="h-12 flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all active:scale-[0.98] text-sm"
                >
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Track Status</span>
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('siet_requester_draft');
                  sessionStorage.removeItem('siet_candidate_draft');
                  sessionStorage.removeItem('candidatePayload');
                  sessionStorage.removeItem('siet_payment_draft');
                  sessionStorage.removeItem('siet_active_request_id');
                  sessionStorage.removeItem('siet_verification_result');
                  navigate(ROUTES.REQUESTER);
                }}
                className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#074828] border border-emerald-300 font-bold px-6 rounded-xl shadow-xs transition-all active:scale-[0.98] text-sm"
              >
                <svg className="w-4 h-4 text-[#0B6A3E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Verify Another Candidate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

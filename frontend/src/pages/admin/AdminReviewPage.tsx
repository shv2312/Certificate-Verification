/**
 * AdminReviewPage — Split-screen review interface for college admin.
 *
 * Route: /admin/review/:id
 *
 * LEFT HALF  — Embedded document viewer (PDF or image) with zoom & rotate.
 * RIGHT HALF — Comparison card (submitted vs DB record) + match badges + notes textarea.
 * BOTTOM BAR — Approve & Reject action buttons.
 *
 * Data is mocked locally; replace MOCK_DATA with a real API call when ready.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CandidateRecord {
  name: string;
  registerNumber: string;
  branch: string;
  yearOfPassing: string;
  certificateUrl: string; // PDF or image URL
  certificateType: 'pdf' | 'image';
}

interface DbRecord {
  name: string;
  registerNumber: string;
  branch: string;
  yearOfPassing: string;
}

interface ReviewData {
  requestId: string;
  displayId: string;
  companyName: string;
  hrEmail: string;
  submittedAt: string;
  submitted: CandidateRecord;
  dbRecord: DbRecord;
}



// ── Mock data (replace with API call) ──────────────────────────────────────────

function getMockReviewData(id: string): ReviewData {
  return {
    requestId: id,
    displayId: `SIET-${id.substring(0, 8).toUpperCase()}`,
    companyName: 'Acme Technologies Pvt. Ltd.',
    hrEmail: 'hr@acme.com',
    submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    submitted: {
      name: 'Rajesh Kumar S',
      registerNumber: '812821104058',
      branch: 'Computer Science and Engineering',
      yearOfPassing: '2024',
      certificateUrl: '',
      certificateType: 'image',
    },
    dbRecord: {
      name: 'Rajesh Kumar S',
      registerNumber: '812821104058',
      branch: 'Computer Science & Engineering',
      yearOfPassing: '2024',
    },
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MatchBadge({ match }: { match: boolean }) {
  return match ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Match
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Mismatch
    </span>
  );
}

function ComparisonRow({
  submitted,
  dbValue,
}: {
  label: string;
  submitted: string;
  dbValue: string;
}) {
  const match = submitted.trim().toLowerCase() === dbValue.trim().toLowerCase();
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] items-start gap-3 p-3 rounded-lg transition-colors ${
        match ? 'bg-green-50/50' : 'bg-red-50/60'
      }`}
    >
      {/* Submitted value */}
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-siet-muted mb-0.5">Submitted</p>
        <p className="text-sm font-medium text-siet-navy break-words">{submitted}</p>
      </div>

      {/* Match badge (centre) */}
      <div className="flex flex-col items-center pt-4">
        <div className={`w-px h-full min-h-[1.5rem] ${match ? 'bg-green-200' : 'bg-red-200'}`} />
        <MatchBadge match={match} />
        <div className={`w-px h-full min-h-[1.5rem] ${match ? 'bg-green-200' : 'bg-red-200'}`} />
      </div>

      {/* DB value */}
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-siet-muted mb-0.5">Database Record</p>
        <p className="text-sm font-medium text-siet-navy break-words">{dbValue}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminReviewPage() {
  const { id = 'demo' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data] = useState<ReviewData>(() => getMockReviewData(id));
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<'approved' | 'rejected' | null>(null);

  // Document viewer state
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [viewerError, setViewerError] = useState(false);

  const hasPlaceholderCertificate = !data.submitted.certificateUrl;
  const isPdf =
    data.submitted.certificateType === 'pdf' ||
    data.submitted.certificateUrl.toLowerCase().endsWith('.pdf');

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.25, 3));
  }
  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }
  function handleRotate() {
    setRotation((r) => (r + 90) % 360);
  }
  function handleZoomReset() {
    setZoom(1);
    setRotation(0);
  }

  async function handleAction(action: 'approve' | 'reject') {
    if (!remarks.trim()) {
      setRemarksError('Admin remarks are mandatory before taking any action.');
      document.getElementById('admin-remarks')?.focus();
      return;
    }
    setRemarksError('');
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    setIsSubmitting(false);
    setActionDone(action === 'approve' ? 'approved' : 'rejected');
  }

  // ── Action Done State ──────────────────────────────────────────────
  if (actionDone) {
    return (
      <div className="flex flex-col md:flex-row flex-1 bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="surface-card p-10 max-w-md w-full text-center animate-slide-up">
            {actionDone === 'approved' ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-700 mb-2">Certificate Approved</h2>
                <p className="text-sm text-siet-slate">
                  The verification request <strong>{data.displayId}</strong> has been approved. An official
                  certificate will be issued.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-700 mb-2">Request Rejected</h2>
                <p className="text-sm text-siet-slate">
                  The verification request <strong>{data.displayId}</strong> has been flagged as inauthentic and
                  rejected.
                </p>
              </>
            )}
            <div className="mt-6 pt-4 border-t border-siet-border">
              <p className="text-xs text-siet-muted italic">
                <strong>Admin Remarks:</strong> {remarks}
              </p>
            </div>
            <button
              className="btn-secondary mt-6 w-full"
              onClick={() => navigate('/admin')}
            >
              ← Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-gray-50/50 min-h-screen">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ── Page Header ── */}
        <header className="bg-white border-b border-siet-border px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-siet-muted hover:text-siet-sky flex items-center gap-1 mb-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin Dashboard
            </button>
            <h1 className="text-xl font-bold text-siet-navy">Review Verification Request</h1>
            <p className="text-xs text-siet-muted mt-0.5">
              {data.displayId} — submitted by <strong>{data.hrEmail}</strong> ({data.companyName}) on{' '}
              {data.submittedAt}
            </p>
          </div>
          <span className="badge-pending">Pending Review</span>
        </header>

        {/* ── Split Screen Body ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-auto">
          {/* ══════════════════════════════════════════════════════════
              LEFT HALF — Document Viewport
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-siet-border flex flex-col bg-gray-900">
            {/* Viewer toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700 shrink-0">
              <span className="text-xs font-semibold text-gray-300 mr-auto truncate">
                {data.submitted.certificateUrl
                  ? data.submitted.certificateUrl.split('/').pop()
                  : 'certificate_preview.pdf'}
              </span>

              {/* Zoom out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>

              {/* Zoom level */}
              <button
                type="button"
                onClick={handleZoomReset}
                className="text-xs font-mono text-gray-400 hover:text-white transition-colors w-10 text-center"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* Zoom in */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30"
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                title="Rotate 90°"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Document area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-900">
              {hasPlaceholderCertificate ? (
                /* Placeholder when no certificate is uploaded */
                <div className="text-center text-gray-500 space-y-3">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-400">No certificate uploaded</p>
                  <p className="text-xs text-gray-600">The HR did not attach a certificate file.</p>
                </div>
              ) : isPdf ? (
                /* PDF embed */
                <iframe
                  src={`${data.submitted.certificateUrl}#toolbar=0&view=FitH`}
                  title="Certificate PDF"
                  className="rounded shadow-lg transition-transform duration-300 origin-center"
                  style={{
                    width: `${Math.round(zoom * 100)}%`,
                    height: '70vh',
                    minHeight: '400px',
                    transform: `rotate(${rotation}deg)`,
                    border: 'none',
                    background: 'white',
                  }}
                />
              ) : (
                /* Image viewer */
                <div
                  className="overflow-auto flex items-center justify-center w-full h-full"
                  style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                >
                  {!viewerError ? (
                    <img
                      src={data.submitted.certificateUrl}
                      alt="Uploaded certificate"
                      className="rounded shadow-xl transition-transform duration-300 origin-center max-w-none"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                      onError={() => setViewerError(true)}
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-sm">Failed to load image.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT HALF — Comparison Card + Remarks
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:w-1/2 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-6 pb-32">

              {/* Section: Comparison Table */}
              <section>
                <h2 className="text-sm font-bold text-siet-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-siet-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Field-by-Field Comparison
                </h2>

                <div className="surface-card overflow-hidden divide-y divide-siet-border">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-3 py-2 bg-siet-silver/40">
                    <p className="text-2xs font-bold uppercase tracking-wider text-siet-muted">HR Submitted</p>
                    <p className="text-2xs font-bold uppercase tracking-wider text-siet-muted text-center w-20">Status</p>
                    <p className="text-2xs font-bold uppercase tracking-wider text-siet-muted">DB Record</p>
                  </div>

                  <div className="p-3 space-y-3">
                    {(
                      [
                        {
                          label: 'Candidate Name',
                          submitted: data.submitted.name,
                          dbValue: data.dbRecord.name,
                        },
                        {
                          label: 'Register Number',
                          submitted: data.submitted.registerNumber,
                          dbValue: data.dbRecord.registerNumber,
                        },
                        {
                          label: 'Branch / Department',
                          submitted: data.submitted.branch,
                          dbValue: data.dbRecord.branch,
                        },
                        {
                          label: 'Year of Passing',
                          submitted: data.submitted.yearOfPassing,
                          dbValue: data.dbRecord.yearOfPassing,
                        },
                      ] as { label: string; submitted: string; dbValue: string }[]
                    ).map((row) => (
                      <div key={row.label} className="space-y-1">
                        <p className="text-2xs font-bold text-siet-muted uppercase tracking-wide">{row.label}</p>
                        <ComparisonRow label={row.label} submitted={row.submitted} dbValue={row.dbValue} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section: Overall Match Summary */}
              <section className="surface-card p-4">
                <h3 className="text-sm font-bold text-siet-navy mb-3">Match Summary</h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { field: 'Name', submitted: data.submitted.name, db: data.dbRecord.name },
                      { field: 'Register No.', submitted: data.submitted.registerNumber, db: data.dbRecord.registerNumber },
                      { field: 'Branch', submitted: data.submitted.branch, db: data.dbRecord.branch },
                      { field: 'Year', submitted: data.submitted.yearOfPassing, db: data.dbRecord.yearOfPassing },
                    ] as { field: string; submitted: string; db: string }[]
                  ).map(({ field, submitted, db }) => {
                    const match = submitted.trim().toLowerCase() === db.trim().toLowerCase();
                    return (
                      <span
                        key={field}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                          match
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}
                      >
                        {match ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {field}
                      </span>
                    );
                  })}
                </div>
              </section>

              {/* Section: Admin Remarks */}
              <section className="surface-card p-4 space-y-2">
                <label htmlFor="admin-remarks" className="form-label flex items-center gap-1">
                  <svg className="w-4 h-4 text-siet-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Admin Remarks / Notes
                  <span className="required-star">*</span>
                </label>
                <textarea
                  id="admin-remarks"
                  rows={5}
                  className={`form-input resize-none ${remarksError ? 'border-siet-error ring-1 ring-siet-error' : ''}`}
                  placeholder="Describe your findings, observations, or reason for decision. Required before approving or rejecting."
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (e.target.value.trim()) setRemarksError('');
                  }}
                />
                {remarksError && (
                  <p className="text-xs text-siet-error flex items-center gap-1" role="alert">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {remarksError}
                  </p>
                )}
                <p className="text-2xs text-siet-muted">
                  {remarks.length} character{remarks.length !== 1 ? 's' : ''} — minimum 20 characters recommended.
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM STICKY ACTION BAR
        ══════════════════════════════════════════════════════════ */}
        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-40 bg-white border-t border-siet-border shadow-card-md">
          <div className="flex items-center justify-between gap-4 px-6 py-4 max-w-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-siet-muted truncate">
                Review ID: <span className="font-mono font-semibold text-siet-navy">{data.displayId}</span>
              </p>
              {!remarks.trim() && (
                <p className="text-2xs text-amber-600 flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Admin remarks required before taking action
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Reject button */}
              <button
                type="button"
                id="btn-reject"
                onClick={() => handleAction('reject')}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 font-semibold px-5 py-2.5 rounded border-2 border-red-300 hover:bg-red-50 hover:border-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                {isSubmitting ? 'Processing…' : 'Reject / Flag as Inauthentic'}
              </button>

              {/* Approve button */}
              <button
                type="button"
                id="btn-approve"
                onClick={() => handleAction('approve')}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-5 py-2.5 rounded border-2 border-transparent hover:bg-green-700 hover:shadow-card-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSubmitting ? 'Processing…' : 'Approve & Issue Official Certificate'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

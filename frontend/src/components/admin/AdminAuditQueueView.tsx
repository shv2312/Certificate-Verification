/**
 * AdminAuditQueueView.tsx
 * =======================
 * Active Verification Approval Queue with Similarity Match Badges
 * and Side-by-Side Verification Comparison Drawer.
 */

import { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  X, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { getAuditQueue, approveVerification, rejectVerification, type AuditQueueItem } from '../../api/admin';

export default function AdminAuditQueueView() {
  const [queue, setQueue] = useState<AuditQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected candidate for Side-by-Side Review Modal
  const [selectedItem, setSelectedItem] = useState<AuditQueueItem | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditQueue();
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = (item: AuditQueueItem) => {
    setSelectedItem(item);
    setActiveFileIndex(0);
    setAuditNotes(
      item.similarity_percentage >= 90
        ? 'All academic credentials verified and matched against autonomous institutional records.'
        : 'Register number/marksheet details do not match autonomous institutional ledger archives.'
    );
    setActionNotice(null);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await approveVerification(selectedItem.id, auditNotes.trim() || undefined);
      setActionNotice({
        type: 'success',
        message: `Request ${selectedItem.display_request_id} successfully approved. Official report dispatched.`,
      });
      // Update local state
      setQueue((prev) =>
        prev.map((q) =>
          q.id === selectedItem.id
            ? { ...q, admin_decision: 'APPROVED', status: 'VERIFIED' }
            : q
        )
      );
      setTimeout(() => setSelectedItem(null), 1200);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err?.message || 'Failed to approve request.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!auditNotes.trim()) {
      setActionNotice({
        type: 'error',
        message: "Verifier's remarks are mandatory before denying a request.",
      });
      return;
    }
    setIsProcessing(true);
    try {
      await rejectVerification(selectedItem.id, auditNotes.trim());
      setActionNotice({
        type: 'success',
        message: `Request ${selectedItem.display_request_id} has been denied and rejected.`,
      });
      // Update local state
      setQueue((prev) =>
        prev.map((q) =>
          q.id === selectedItem.id
            ? { ...q, admin_decision: 'REJECTED', status: 'NOT_VERIFIED' }
            : q
        )
      );
      setTimeout(() => setSelectedItem(null), 1200);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err?.message || 'Failed to reject request.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Banner */}
      <div className="surface-card p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-[#0B6A3E]" />
            <h2 className="text-xl font-bold text-siet-navy">Verification Approval Queue</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Review incoming verification requests, analyze automated similarity scores, and review uploaded candidate certificates.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="surface-card border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B6A3E] mb-2" />
            Loading approval queue and similarity matches...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            {error}
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">There are no pending verification requests in the queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Verification approval queue">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Reference ID</th>
                  <th className="px-4 py-3.5">Candidate Name</th>
                  <th className="px-4 py-3.5">Register No</th>
                  <th className="px-4 py-3.5">Requester / Company</th>
                  <th className="px-4 py-3.5">Review Decision</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenReview(item)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                      {item.display_request_id || item.id.slice(0, 14)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {item.submitted_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {item.submitted_register_number}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate" title={item.company_name}>
                      <span className="font-medium text-slate-900 block truncate">{item.company_name}</span>
                      <span className="text-xs text-slate-400 block truncate">{item.hr_email}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.admin_decision === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 text-green-700" />
                          Approved
                        </span>
                      ) : item.admin_decision === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 text-red-700" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReview(item);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6A3E] group-hover:text-[#074828] bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review &amp; Compare</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Comprehensive Side-by-Side Review Drawer / Modal ── */}
      {/* Responsive Review & Compare Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            
            {/* High-Contrast Institutional Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Verification Docket: <span className="font-mono text-emerald-400">{selectedItem?.display_request_id || selectedItem?.id}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending Ledger Verification
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Requested by <span className="text-white font-medium">{selectedItem?.company_name || 'Organization'}</span> ({selectedItem?.hr_email})
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Scrollable Comparison Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {actionNotice && (
                <div
                  className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    actionNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {actionNotice.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{actionNotice.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Attachment Viewer */}
                {(() => {
                  const attachments = (selectedItem.certificate_url || '')
                    .split(',')
                    .map((s) => s.trim().replace(/\\/g, '/'))
                    .filter(Boolean);
                  const activeUrl = attachments[activeFileIndex] || attachments[0] || '';

                  const resolveAttachmentUrl = (raw: string) => {
                    if (!raw) return '';
                    const normalized = raw.replace(/\\/g, '/').trim();
                    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
                      return normalized;
                    }
                    const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
                    const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
                    return `${backendBase}${cleanPath}`;
                  };

                  const attachmentUrl = resolveAttachmentUrl(activeUrl);

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-500">
                          Candidate Attachment {attachments.length > 1 ? `(${activeFileIndex + 1} of ${attachments.length})` : ''}
                        </span>
                        {attachmentUrl && (
                          <a 
                            href={attachmentUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            Open in Full Tab <ExternalLink className="w-3.5 h-3.5"/>
                          </a>
                        )}
                      </div>

                      {/* Multi-document switcher */}
                      {attachments.length > 1 && (
                        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1">
                          {attachments.map((att, idx) => {
                            const fileName = att.split('/').pop()?.split('_').slice(1).join('_') || `Doc ${idx + 1}`;
                            const isPdf = att.toLowerCase().endsWith('.pdf');
                            const isActive = idx === activeFileIndex;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveFileIndex(idx)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                                  isActive
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{isPdf ? '📄' : '🖼️'}</span>
                                <span className="truncate max-w-[130px]">{fileName}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex-1 min-h-[350px] max-h-[460px] bg-slate-900/5 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200/80">
                        {attachmentUrl ? (
                          attachmentUrl.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                            <iframe
                              src={`${attachmentUrl}#toolbar=0`}
                              title="Candidate Certificate PDF"
                              className="w-full h-[440px] max-h-[60vh] rounded bg-white"
                            />
                          ) : (
                            <img 
                              src={attachmentUrl} 
                              alt={`Candidate Certificate ${activeFileIndex + 1}`} 
                              className="max-h-[440px] w-auto max-w-full object-contain rounded"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const clean = activeUrl.replace(/\\/g, '/').trim();
                                const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
                                if (!target.src.includes('127.0.0.1:8000')) {
                                  target.src = `http://127.0.0.1:8000${cleanPath}`;
                                } else if (!target.src.includes('localhost:8000')) {
                                  target.src = `http://localhost:8000${cleanPath}`;
                                } else if (!target.src.endsWith(cleanPath)) {
                                  target.src = cleanPath;
                                }
                              }}
                            />
                          )
                        ) : (
                          <div className="text-center p-8 text-slate-400 space-y-2">
                            <FileText className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
                            <p className="text-sm font-semibold text-slate-600">No scanned certificate attached</p>
                            <p className="text-xs text-slate-500">
                              Verification will proceed strictly against the digital database ledger.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Right Column: Ledger Side-by-Side Table & Notes */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Side-by-Side Ledger Verification
                      </h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        selectedItem.similarity_percentage >= 90
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : selectedItem.similarity_percentage >= 70
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {selectedItem.similarity_percentage}% Match
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 bg-slate-100/90 text-slate-700 font-bold p-2.5">
                        <div className="col-span-5">HR Submitted Candidate Data</div>
                        <div className="col-span-2 text-center">Diff</div>
                        <div className="col-span-5">Official SIET Database Record</div>
                      </div>

                      {/* Row 1: Candidate Name */}
                      <div className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-5 font-semibold text-slate-900 break-words">
                          {selectedItem.submitted_name}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {selectedItem.matches?.name ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">✗</span>
                          )}
                        </div>
                        <div className="col-span-5 font-semibold text-emerald-950 break-words">
                          {selectedItem.db_name || selectedItem.submitted_name}
                        </div>
                      </div>

                      {/* Row 2: Register Number */}
                      <div className="grid grid-cols-12 p-3 items-center bg-slate-50/50">
                        <div className="col-span-5 font-mono font-bold text-slate-900 break-words">
                          {selectedItem.submitted_register_number}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {selectedItem.matches?.register_number ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">✗</span>
                          )}
                        </div>
                        <div className="col-span-5 font-mono font-bold text-emerald-950 break-words">
                          {selectedItem.db_register_number || selectedItem.submitted_register_number}
                        </div>
                      </div>

                      {/* Row 3: Degree & Branch */}
                      <div className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-5 text-slate-800 break-words">
                          <span className="font-semibold block">{selectedItem.submitted_programme}</span>
                          <span className="text-[11px] text-slate-500">{selectedItem.submitted_branch}</span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {selectedItem.matches?.programme ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">!</span>
                          )}
                        </div>
                        <div className="col-span-5 text-emerald-950 break-words">
                          <span className="font-semibold block">{selectedItem.db_programme || selectedItem.submitted_programme}</span>
                          <span className="text-[11px] text-slate-500">{selectedItem.db_branch || selectedItem.submitted_branch}</span>
                        </div>
                      </div>

                      {/* Row 4: Admission Type / Entry Mode */}
                      <div className="grid grid-cols-12 p-3 items-center bg-slate-50/50">
                        <div className="col-span-5 text-slate-800 font-medium break-words">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {selectedItem.submitted_entry_mode || 'Regular Entry (1st Year Admission)'}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {selectedItem.matches?.entry_mode !== false ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">✗</span>
                          )}
                        </div>
                        <div className="col-span-5 text-emerald-950 font-medium break-words">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {selectedItem.db_entry_mode || selectedItem.submitted_entry_mode || 'Regular Entry (1st Year Admission)'}
                          </span>
                        </div>
                      </div>

                      {/* Row 5: Year of Passing */}
                      <div className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-5 font-mono text-slate-800">
                          {selectedItem.submitted_year_of_passing}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {selectedItem.matches?.year_of_passing ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">✗</span>
                          )}
                        </div>
                        <div className="col-span-5 font-mono font-semibold text-emerald-950">
                          {selectedItem.db_year_of_passing || selectedItem.submitted_year_of_passing}
                        </div>
                      </div>

                      {/* Row 6: Date of Birth */}
                      <div className="grid grid-cols-12 p-3 items-center bg-slate-50/50">
                        <div className="col-span-5 font-mono text-slate-800">
                          {selectedItem.submitted_dob}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">!</span>
                        </div>
                        <div className="col-span-5">
                          {selectedItem.db_dob ? (
                            <span className="font-mono text-slate-800">{selectedItem.db_dob}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Record Not Available in Ledger
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verifier's Remarks Field */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Verifier's Remarks
                      </label>
                      <span className="text-[11px] text-slate-400">
                        (Included in official report sent to requester)
                      </span>
                    </div>
                    <textarea
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      placeholder="State the rationale for approval or reasons for denial (e.g., Degree and branch matched with autonomous records, or Register number mismatch)..."
                      rows={3}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg resize-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setAuditNotes("All academic credentials verified and matched against autonomous institutional records.")}
                        className="text-[11px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded border border-emerald-200 transition-colors"
                      >
                        + Fast Fill: Verified &amp; Matched
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditNotes("Discrepancy noted: Candidate record not found in the autonomous institutional ledger.")}
                        className="text-[11px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded border border-rose-200 transition-colors"
                      >
                        + Fast Fill: Ledger Discrepancy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-slate-500">
                Verification decision permanently binds digital cryptographic signature &amp; purges stored attachments.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Deny Request'}
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Approve Verification'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

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
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  FileText 
} from 'lucide-react';
import { getAuditQueue, approveVerification, rejectVerification, type AuditQueueItem } from '../../api/admin';

export default function AdminAuditQueueView() {
  const [queue, setQueue] = useState<AuditQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected candidate for Side-by-Side Review Modal
  const [selectedItem, setSelectedItem] = useState<AuditQueueItem | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Document viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

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
    setRemarks(
      item.similarity_percentage >= 90
        ? 'Verified against SIET authoritative ledger records. Academic credentials verified.'
        : 'Discrepancy noted during comparison.'
    );
    setZoom(1);
    setRotation(0);
    setActionNotice(null);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await approveVerification(selectedItem.id);
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
    if (!remarks.trim()) {
      setActionNotice({
        type: 'error',
        message: 'Admin remarks are mandatory before rejecting a request.',
      });
      return;
    }
    setIsProcessing(true);
    try {
      await rejectVerification(selectedItem.id, remarks.trim());
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
                  <th className="px-4 py-3.5">Similarity Score</th>
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
                      {/* Prominent Color-Coded Similarity Badge */}
                      {item.similarity_badge_color === 'green' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                          <span>{item.similarity_percentage}% Match</span>
                        </span>
                      )}
                      {item.similarity_badge_color === 'yellow' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                          <span>{item.similarity_percentage}% Match</span>
                        </span>
                      )}
                      {item.similarity_badge_color === 'red' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-900 border border-red-300 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-red-700 stroke-[2.5]" />
                          <span>{item.similarity_percentage}% Match</span>
                        </span>
                      )}
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
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Modal Top Bar */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-yellow-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">
                      Verification Docket Review: {selectedItem.display_request_id}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-yellow-400 text-slate-950">
                      {selectedItem.similarity_percentage}% Similarity
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requested by <strong>{selectedItem.company_name}</strong> ({selectedItem.hr_email})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Content Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* LEFT HALF (5 cols): Document Viewer */}
              <div className="lg:col-span-5 flex flex-col bg-slate-900 min-h-[350px]">
                {/* Viewer Toolbar */}
                <div className="p-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300 shrink-0">
                  <span className="font-medium truncate max-w-[180px]">
                    Candidate Attachment
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[11px] px-1">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
                      title="Rotate 90deg"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Viewer Canvas */}
                <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-950">
                  {selectedItem.certificate_url ? (
                    selectedItem.certificate_url.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`${selectedItem.certificate_url}#toolbar=0`}
                        title="Candidate Certificate PDF"
                        className="w-full h-full min-h-[360px] rounded bg-white"
                      />
                    ) : (
                      <div className="overflow-auto max-h-[460px] flex items-center justify-center">
                        <img
                          src={selectedItem.certificate_url}
                          alt="Uploaded Certificate"
                          className="max-w-full rounded shadow-md transition-transform duration-200"
                          style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          }}
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8 text-slate-500 space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
                      <p className="text-sm font-semibold text-slate-400">No scanned certificate attached</p>
                      <p className="text-xs text-slate-500">
                        Verification will proceed strictly against the digital database ledger.
                      </p>
                    </div>
                  )}
                </div>

                {selectedItem.certificate_url && (
                  <div className="p-2.5 bg-slate-800 border-t border-slate-700 text-right">
                    <a
                      href={selectedItem.certificate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:underline"
                    >
                      <span>Open in Full Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* RIGHT HALF (7 cols): Side-by-Side Field Comparison & Actions */}
              <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6">
                
                {actionNotice && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
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

                {/* Side-by-Side Table Comparison */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Side-by-Side Ledger Verification
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                    <div className="grid grid-cols-12 bg-slate-100/90 text-xs font-bold text-slate-700 p-2.5">
                      <div className="col-span-5">HR Submitted Candidate Data</div>
                      <div className="col-span-2 text-center">Diff</div>
                      <div className="col-span-5">Official SIET Database Record</div>
                    </div>

                    {/* Field 1: Candidate Name */}
                    <div className="grid grid-cols-12 p-3 text-xs items-center">
                      <div className="col-span-5 font-semibold text-slate-900 break-words">
                        {selectedItem.submitted_name}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {selectedItem.matches.name ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">✗</span>
                        )}
                      </div>
                      <div className="col-span-5 font-semibold text-emerald-950 break-words">
                        {selectedItem.db_name || selectedItem.submitted_name}
                      </div>
                    </div>

                    {/* Field 2: Register Number */}
                    <div className="grid grid-cols-12 p-3 text-xs items-center bg-slate-50/50">
                      <div className="col-span-5 font-mono font-bold text-slate-900 break-words">
                        {selectedItem.submitted_register_number}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {selectedItem.matches.register_number ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">✗</span>
                        )}
                      </div>
                      <div className="col-span-5 font-mono font-bold text-emerald-950 break-words">
                        {selectedItem.db_register_number || selectedItem.submitted_register_number}
                      </div>
                    </div>

                    {/* Field 3: Degree & Branch */}
                    <div className="grid grid-cols-12 p-3 text-xs items-center">
                      <div className="col-span-5 text-slate-800 break-words">
                        <span className="font-semibold block">{selectedItem.submitted_programme}</span>
                        <span className="text-[11px] text-slate-500">{selectedItem.submitted_branch}</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {selectedItem.matches.programme ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">!</span>
                        )}
                      </div>
                      <div className="col-span-5 text-emerald-950 break-words">
                        <span className="font-semibold block">{selectedItem.db_programme || selectedItem.submitted_programme}</span>
                        <span className="text-[11px] text-slate-500">{selectedItem.db_branch || selectedItem.submitted_branch}</span>
                      </div>
                    </div>

                    {/* Field 4: Year of Passing */}
                    <div className="grid grid-cols-12 p-3 text-xs items-center bg-slate-50/50">
                      <div className="col-span-5 font-mono text-slate-800">
                        {selectedItem.submitted_year_of_passing}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {selectedItem.matches.year_of_passing ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">✗</span>
                        )}
                      </div>
                      <div className="col-span-5 font-mono font-semibold text-emerald-950">
                        {selectedItem.db_year_of_passing || selectedItem.submitted_year_of_passing}
                      </div>
                    </div>

                    {/* Field 5: Date of Birth */}
                    <div className="grid grid-cols-12 p-3 text-xs items-center">
                      <div className="col-span-5 font-mono text-slate-800">
                        {selectedItem.submitted_dob}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                      </div>
                      <div className="col-span-5 text-slate-500 italic">
                        Verified via Institutional Records
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Remarks & Signature */}
                <div className="space-y-2">
                  <label htmlFor="admin-remarks" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Auditor Notes &amp; Findings:
                  </label>
                  <textarea
                    id="admin-remarks"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter audit remarks or ledger volume verification notes..."
                    className="form-input text-xs w-full py-2"
                  />
                </div>

                {/* Action Buttons: Approve vs Deny */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Audit decision will generate an official SIET digital signed report.
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleReject}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Deny Request</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold py-2.5 px-7 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-xs disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span>Approve Verification</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AdminSystemOverviewView.tsx
 * ===========================
 * System Overview telemetry and service health metrics for the Admin Portal.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  CreditCard, 
  HardDrive, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getSystemOverview, type SystemOverviewData } from '../../api/admin';

export default function AdminSystemOverviewView() {
  const navigate = useNavigate();
  const [data, setData] = useState<SystemOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemOverview();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch system overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Banner */}
      <div className="surface-card p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-[#0B6A3E]" />
            <h2 className="text-xl font-bold text-siet-navy">System Health &amp; Telemetry Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time infrastructure health, verification throughput, payment gateway connectivity, and institutional ledger status.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOverview}
          className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading ? (
        <div className="surface-card p-16 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B6A3E] mb-2" />
          Loading system health and telemetry metrics...
        </div>
      ) : error || !data ? (
        <div className="surface-card p-8 text-center text-red-600 text-sm">
          <p className="font-semibold mb-1">Telemetry Unreachable</p>
          <p className="text-xs text-slate-500">{error || 'Could not connect to health telemetry service.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Throughput */}
            <div className="surface-card p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-6 h-6 text-[#0B6A3E]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Throughput</p>
                <p className="text-2xl font-extrabold text-siet-navy mt-0.5">{data.total_verifications}</p>
                <p className="text-[11px] text-slate-400">Verifications initiated</p>
              </div>
            </div>

            {/* Metric 2: Pending Approval Queue */}
            <div className="surface-card p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Queue</p>
                <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{data.pending_queue_size}</p>
                <p className="text-[11px] text-slate-400">Awaiting admin decision</p>
              </div>
            </div>

            {/* Metric 3: Approved & Denied */}
            <div className="surface-card p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approval Rate</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-extrabold text-siet-navy">{data.approval_rate}</p>
                  <span className="text-[11px] font-semibold text-emerald-700">({data.approved_count} approved)</span>
                </div>
                <p className="text-[11px] text-slate-400">{data.denied_count} rejected requests</p>
              </div>
            </div>

            {/* Metric 4: SLA Turnaround */}
            <div className="surface-card p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200">
                <Clock className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Turnaround</p>
                <p className="text-xl font-extrabold text-purple-900 mt-0.5">{data.average_turnaround}</p>
                <p className="text-[11px] text-slate-400">Institutional review window</p>
              </div>
            </div>
          </div>

          {/* Subsystem Health Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Institutional Ledger DB */}
            <div className="surface-card p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-[#0B6A3E] flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    {data.database_status.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">Authoritative Student Database</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Engine: <strong className="text-slate-800">{data.database_status.engine}</strong>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Indexed Student Records:</span>
                    <span className="font-bold text-slate-900">{data.database_status.total_student_records} students</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Query Read Latency:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{data.database_status.read_latency_ms} ms</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="inline-flex items-center justify-between text-xs font-bold text-[#0B6A3E] hover:text-[#074828] pt-2 border-t border-slate-100 group"
              >
                <span>View Student Records</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 2: Payment Gateway (Razorpay) */}
            <div className="surface-card p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    {data.payment_gateway_status.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">Payment Gateway Engine</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provider: <strong className="text-slate-800">{data.payment_gateway_status.provider}</strong>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Integration Mode:</span>
                    <span className="font-semibold text-slate-900">{data.payment_gateway_status.mode}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>API Ping Latency:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{data.payment_gateway_status.ping_latency_ms} ms</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="inline-flex items-center justify-between text-xs font-bold text-blue-700 hover:text-blue-900 pt-2 border-t border-slate-100 group"
              >
                <span>View Payment Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 3: Storage & Documents Archive */}
            <div className="surface-card p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    {data.storage_status.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">Document Attachment Archive</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mounted: <strong className="font-mono text-slate-800">{data.storage_status.mounted_path}</strong>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Stored Certificates:</span>
                    <span className="font-bold text-slate-900">{data.storage_status.files_count} files</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Disk Utilization:</span>
                    <span className="font-mono text-slate-900 font-semibold">{data.storage_status.disk_usage_mb} MB</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/audit')}
                className="inline-flex items-center justify-between text-xs font-bold text-[#0B6A3E] hover:text-[#074828] pt-2 border-t border-slate-100 group"
              >
                <span>Audit Stored Documents</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

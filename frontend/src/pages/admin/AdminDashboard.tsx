/**
 * AdminDashboard — Live data dashboard for SIET Verification admins.
 *
 * Fetches:
 *   GET /api/v1/admin/stats   → Aggregate counts by status
 *   GET /api/v1/admin/requests → Paginated list of all verification requests
 *
 * Features:
 *   - Stats cards (Total, Verified, Pending, In Progress, Not Verified, Error)
 *   - Searchable + filterable table of verification requests
 *   - Status badges with color coding
 *   - Responsive sidebar layout
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiClient } from '../../api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  total: number;
  verified: number;
  not_verified: number;
  pending: number;
  in_progress: number;
  error: number;
  total_hrs?: number;
  company_distribution?: { company_name: string; count: number }[];
}

interface VerificationRequestRow {
  verification_request_id: string;
  display_request_id: string;
  status: string;
  company_name: string;
  hr_email: string;
  hr_name?: string | null;
  candidate_name?: string | null;
  created_at: number | string;
}

interface StatsResponse {
  success: boolean;
  data: AdminStats;
}

interface RequestsResponse {
  success: boolean;
  data: VerificationRequestRow[];
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  VERIFIED:                 { label: 'Verified',        bg: '#dcfce7', text: '#15803d' },
  NOT_VERIFIED:             { label: 'Not Verified',    bg: '#fee2e2', text: '#b91c1c' },
  NAME_MISMATCH:            { label: 'Name Mismatch',   bg: '#fee2e2', text: '#b91c1c' },
  NOT_FOUND:                { label: 'Not Found',       bg: '#fee2e2', text: '#b91c1c' },
  ERROR:                    { label: 'Error',           bg: '#ffedd5', text: '#c2410c' },
  VERIFICATION_IN_PROGRESS: { label: 'In Progress',    bg: '#dbeafe', text: '#1d4ed8' },
  CANDIDATE_BOUND:          { label: 'Awaiting Confirm',bg: '#ede9fe', text: '#6d28d9' },
  PAID_UNUSED:              { label: 'Paid / Unused',   bg: '#f3e8ff', text: '#7c3aed' },
  PAYMENT_PENDING:          { label: 'Pending Payment', bg: '#f1f5f9', text: '#475569' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#f1f5f9', text: '#475569' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(ts: number | string): string {
  if (!ts) return '—';
  // If it's a Unix timestamp (integer seconds or ms)
  const n = typeof ts === 'string' ? parseFloat(ts) : ts;
  const ms = n > 1e10 ? n : n * 1000; // ms vs seconds
  const d = new Date(ms);
  if (isNaN(d.getTime())) return String(ts).slice(0, 10);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number | undefined;
  icon: string;
  color: string;
}) {
  return (
    <div className="surface-card p-5 flex items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-default">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20' }}
      >
        <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-xs font-medium text-siet-muted uppercase tracking-wider mb-0.5">{label}</p>
        {value !== undefined ? (
          <p className="text-2xl font-bold text-siet-navy">{value}</p>
        ) : (
          <div className="h-7 w-12 bg-siet-silver rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}

const CustomLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name, index, activeIndex } = props;
  if (index === activeIndex) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fontSize={12}>
      <tspan fill="#475569">{name}</tspan>
      <tspan fontWeight="bold" fill="#1e293b"> {(percent * 100).toFixed(0)}%</tspan>
    </text>
  );
};

const CustomLabelLine = (props: any) => {
  const { points, index, activeIndex } = props;
  if (index === activeIndex || !points) return null;
  const pointString = points.map((p: any) => `${p.x},${p.y}`).join(' ');
  return <polyline points={pointString} fill="none" stroke="#94a3b8" strokeWidth={1.5} />;
};

const ActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, percent, name, fill } = props;
  const RADIAN = Math.PI / 180;
  
  const popupOuterRadius = outerRadius + 12;
  const popupInnerRadius = innerRadius + 2;

  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const sx = cx + popupOuterRadius * cos;
  const sy = cy + popupOuterRadius * sin;
  const mx = cx + (popupOuterRadius + 15) * cos;
  const my = cy + (popupOuterRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={popupInnerRadius}
        outerRadius={popupOuterRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }}
      />
      <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} fill="none" stroke={fill} strokeWidth={2} />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey - 8} textAnchor={textAnchor} dominantBaseline="central" fontSize={14} fontWeight="bold" fill="#0f172a">
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey + 8} textAnchor={textAnchor} dominantBaseline="central" fontSize={13} fontWeight="bold" fill={fill}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

export default function AdminDashboard() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [stats,       setStats]       = useState<AdminStats | null>(null);
  const [requests,    setRequests]    = useState<VerificationRequestRow[]>([]);
  const [loadingReqs,  setLoadingReqs]  = useState(true);
  const [statsError,   setStatsError]   = useState<string | null>(null);
  const [reqsError,    setReqsError]    = useState<string | null>(null);

  const location = useLocation();
  const currentView = location.pathname.endsWith('/admin') || location.pathname.endsWith('/admin/') 
    ? 'overview' 
    : location.pathname.split('/').pop() || 'overview';

  const [companySearch, setCompanySearch] = useState('');
  const [volumeFilter, setVolumeFilter] = useState<'all' | '5' | '10' | '25'>('all');

  // Filtering + search
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch stats on mount
  useEffect(() => {
    apiClient<StatsResponse>('/api/v1/admin/stats')
      .then((r) => { if (r.success) setStats(r.data); })
      .catch((e) => setStatsError(e instanceof Error ? e.message : 'Failed to load stats.'));
  }, []);

  // Fetch requests on mount
  useEffect(() => {
    apiClient<RequestsResponse>('/api/v1/admin/requests?limit=200')
      .then((r) => { if (r.success) setRequests(r.data); })
      .catch((e) => setReqsError(e instanceof Error ? e.message : 'Failed to load requests.'))
      .finally(() => setLoadingReqs(false));
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!stats?.company_distribution) return [];
    let comps = stats.company_distribution;

    if (volumeFilter !== 'all') {
      comps = comps.slice(0, Number(volumeFilter));
    }

    if (companySearch.trim()) {
      const q = companySearch.trim().toLowerCase();
      comps = comps.filter((c) => c.company_name.toLowerCase().includes(q));
    }
    return comps;
  }, [stats?.company_distribution, companySearch, volumeFilter]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let rows = requests;
    if (statusFilter !== 'ALL') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.display_request_id.toLowerCase().includes(q) ||
          r.company_name.toLowerCase().includes(q) ||
          r.hr_email.toLowerCase().includes(q) ||
          (r.candidate_name ?? '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [requests, search, statusFilter]);

  const allStatuses = useMemo(
    () => Array.from(new Set(requests.map((r) => r.status))).sort(),
    [requests],
  );

  const renderPlaceholder = (title: string, desc: string) => (
    <div className="surface-card p-16 text-center flex flex-col items-center justify-center animate-slide-up">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-siet-navy mb-3">{title}</h2>
      <p className="text-siet-slate max-w-md mx-auto">{desc}</p>
    </div>
  );

  const renderVerificationTable = () => (
    <section className="animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-siet-navy">
                Verification Requests
                {!loadingReqs && (
                  <span className="ml-2 text-sm font-normal text-siet-muted">
                    ({filtered.length} of {requests.length})
                  </span>
                )}
              </h2>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Status filter */}
                <select
                  id="admin-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input text-sm py-1.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  aria-label="Filter by status"
                >
                  <option value="ALL">All Statuses</option>
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s]?.label ?? s}
                    </option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-siet-muted"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    id="admin-search"
                    type="search"
                    placeholder="Search ID, company, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input pl-8 text-sm py-1.5 w-full sm:w-56 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    aria-label="Search verification requests"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="surface-card overflow-hidden">
              {loadingReqs ? (
                <div className="flex items-center justify-center py-16 gap-3 text-siet-slate">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading requests…
                </div>
              ) : reqsError ? (
                <div className="p-8 text-center text-sm text-red-600">
                  ⚠ {reqsError}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-siet-slate text-sm">
                  {requests.length === 0
                    ? 'No verification requests yet.'
                    : 'No requests match your search or filter.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Verification requests">
                    <thead>
                      <tr className="bg-siet-silver border-b border-siet-border">
                        {['Request ID', 'Company', 'HR Email', 'Candidate', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-siet-slate uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-siet-border">
                      {filtered.map((row) => (
                        <tr
                          key={row.verification_request_id}
                          className="hover:bg-siet-silver/50 transition-colors duration-100"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-siet-navy font-semibold whitespace-nowrap">
                            {row.display_request_id}
                          </td>
                          <td className="px-4 py-3 text-siet-navy max-w-[160px] truncate" title={row.company_name}>
                            {row.company_name}
                          </td>
                          <td className="px-4 py-3 text-siet-slate max-w-[180px] truncate" title={row.hr_email}>
                            {row.hr_email}
                          </td>
                          <td className="px-4 py-3 text-siet-slate">
                            {row.candidate_name ?? <span className="text-siet-muted italic text-xs">Not submitted</span>}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 text-siet-muted whitespace-nowrap text-xs">
                            {formatDate(row.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-gray-50/50">
      <AdminSidebar />

      <main className="flex-1 w-full">
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold text-siet-navy mb-1 capitalize">
              {currentView === 'overview' ? 'Dashboard Overview' : currentView.replace('-', ' ')}
            </h1>
            <p className="text-siet-slate text-sm">
              Signed in as <strong className="text-siet-navy">Administrator</strong>
            </p>
          </header>

          {currentView === 'overview' && (
            <div className="space-y-8 animate-slide-up">
              {/* Stats Cards */}
              {statsError ? (
                <div className="p-4 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
                  ⚠ Could not load statistics: {statsError}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard label="Total"       value={stats?.total}       color="#0047AB" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <StatCard label="Verified"    value={stats?.verified}    color="#16a34a" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <StatCard label="Pending"     value={stats?.pending}     color="#7c3aed" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <StatCard label="In Progress" value={stats?.in_progress} color="#2563eb" icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  <StatCard label="Not Verified" value={stats?.not_verified} color="#dc2626" icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <StatCard label="Errors"      value={stats?.error}       color="#ea580c" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  <StatCard label="Total HRs Attempted" value={stats?.total_hrs} color="#db2777" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </div>
              )}

              {/* Company Distribution Chart */}
              {!statsError && stats?.company_distribution && stats.company_distribution.length > 0 && (
                <section className="surface-card p-6 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-siet-navy">Company Distribution</h2>
                    <div className="flex items-center gap-3">
                      <select 
                        value={volumeFilter} 
                        onChange={(e) => setVolumeFilter(e.target.value as any)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="all">All Companies</option>
                        <option value="5">Top 5 Most Visited</option>
                        <option value="10">Top 10 Most Visited</option>
                        <option value="25">Top 25 Most Visited</option>
                      </select>
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="search"
                          placeholder="Search companies..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          className="form-input pl-9 text-sm py-1.5 w-full sm:w-56 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          aria-label="Search companies in chart"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full max-w-4xl mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredCompanies}
                          dataKey="count"
                          nameKey="company_name"
                          cx="40%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                          // @ts-expect-error Recharts 3.x types might be missing activeIndex on Pie
                          activeIndex={activeIndex}
                          activeShape={<ActiveShape />}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(-1)}
                          label={<CustomLabel activeIndex={activeIndex} />}
                          labelLine={<CustomLabelLine activeIndex={activeIndex} />}
                          isAnimationActive={true}
                          animationBegin={100}
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {filteredCompanies.map((_, index) => {
                            const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1', '#a4de6c', '#d0ed57'];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                          })}
                        </Pie>
                        {/* Tooltip removed to prevent duplicate text with ActiveShape callout */}
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right" 
                          wrapperStyle={{ paddingLeft: '20px' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {renderVerificationTable()}
            </div>
          )}

          {currentView === 'verifications' && renderVerificationTable()}

          {currentView === 'students' && renderPlaceholder(
            'Student Records',
            'This view will display all students in the database loaded from the batch Excel import. The API endpoint for this is currently pending.'
          )}

          {currentView === 'audit' && renderPlaceholder(
            'Audit / Activity Log',
            'Detailed historical logs for verification attempts, state changes, and admin activities will appear here.'
          )}

          {currentView === 'system' && renderPlaceholder(
            'System Overview',
            'Displays core service health, API ping times, database status, and error rate telemetry.'
          )}

        </div>
      </main>
    </div>
  );
}

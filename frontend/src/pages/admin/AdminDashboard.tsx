/**
 * AdminDashboard — Foundation for the Admin experience.
 *
 * MOCK NOTE:
 * Deliberately contains no fake charts, statistics, or records.
 * Built to wait for actual data from the backend.
 */

import AdminSidebar from '../../components/AdminSidebar';
import StatusMessage from '../../components/StatusMessage';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { hrEmail } = useAuth();

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-gray-50/50">
      <AdminSidebar />
      
      <main className="flex-1 w-full animate-slide-up">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-siet-navy mb-1">
              Dashboard Overview
            </h1>
            <p className="text-siet-slate text-sm">
              Welcome to the SIET Academic Verification Admin Portal. Logged in as <strong className="text-siet-navy">{hrEmail}</strong>.
            </p>
          </header>

          <StatusMessage
            type="info"
            title="Backend Integration Pending"
            message="The Dashboard UI is structurally complete, but no real data is available yet. Verification records and statistics will populate here once connected to the FastAPI backend and Verification Engine."
          />

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Structural placeholders for future data cards */}
            {[
              { label: 'Total Verifications (Month)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { label: 'Pending Reviews', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'System Status', icon: 'M5 13l4 4L19 7' },
            ].map((card, idx) => (
              <div key={idx} className="surface-card p-5 opacity-75">
                <div className="flex items-center gap-3 text-siet-slate mb-3">
                  <svg className="w-5 h-5 text-siet-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                  </svg>
                  <h3 className="text-sm font-semibold">{card.label}</h3>
                </div>
                <div className="h-8 bg-siet-silver rounded w-16 animate-pulse" aria-hidden="true" />
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

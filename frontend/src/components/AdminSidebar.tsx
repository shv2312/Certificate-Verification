/**
 * AdminSidebar — Navigation for the Admin Dashboard.
 *
 * Uses the SIET design system. Does NOT contain fake data or analytics links,
 * only the structural foundation requested in Sprint 2.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard Overview', end: true },
  { to: '/admin/verifications', label: 'Verification Records', disabled: true },
  { to: '/admin/students', label: 'Student Records', disabled: true },
  { to: '/admin/audit', label: 'Audit / Activity Log', disabled: true },
  { to: '/admin/system', label: 'System Overview', disabled: true },
];

export default function AdminSidebar() {
  const { clearAuth } = useAuth();

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r border-siet-border flex flex-col h-full min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-siet-border bg-siet-silver">
        <h2 className="text-sm font-bold text-siet-navy uppercase tracking-wider">
          Admin Portal
        </h2>
        <p className="text-xs text-siet-slate mt-0.5">
          SIET Verification Service
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Admin Navigation">
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              clsx(
                'block px-3 py-2 rounded text-sm font-medium transition-colors duration-150',
                link.disabled
                  ? 'text-siet-muted cursor-not-allowed pointer-events-none'
                  : isActive
                  ? 'bg-blue-50 text-siet-sky border-l-2 border-siet-sky'
                  : 'text-siet-slate hover:bg-siet-silver hover:text-siet-navy'
              )
            }
          >
            {link.label}
            
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-siet-border">
        <button
          onClick={clearAuth}
          className="flex items-center gap-2 text-sm font-medium text-siet-error hover:text-red-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

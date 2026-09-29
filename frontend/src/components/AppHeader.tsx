/**
 * AppHeader — Persistent site header for the SIET Verification Portal.
 *
 * Contains:
 *  - Institutional identity (SIET name + portal title)
 *  - SIET logo (top-right, per institutional identity guidelines)
 *  - Primary navigation
 *  - Admin Login button → opens AdminLoginModal overlay
 *  - Admin Dashboard button (shown when logged in as admin)
 *  - Mobile hamburger menu
 *
 * LOGO NOTE:
 *  The official SIET logo asset has not yet been provided.
 *  A clearly labelled placeholder is rendered instead.
 *  Replace `src/assets/siet-logo.png` with the official logo file
 *  when it becomes available.
 */

import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ROUTES } from '../utils/routes';
import AdminLoginModal from './AdminLoginModal';

interface NavItem {
  label: string;
  to: string;
  isPlaceholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',   to: ROUTES.HOME },
  { label: 'Verify', to: ROUTES.REQUESTER },
  { label: 'About',  to: '/#how-it-works' },
  { label: 'Help',   to: ROUTES.HELP },
];

export default function AppHeader() {
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const location = useLocation();
  const navigate  = useNavigate();

  const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem('siet_admin_token')));

  // Listen for admin login/logout events
  useEffect(() => {
    const handleLogin = () => setIsAdmin(true);
    const handleLogout = () => setIsAdmin(false);
    window.addEventListener('siet:admin-login-success', handleLogin);
    window.addEventListener('siet:admin-logout', handleLogout);
    return () => {
      window.removeEventListener('siet:admin-login-success', handleLogin);
      window.removeEventListener('siet:admin-logout', handleLogout);
    };
  }, []);

  // Listen for custom event from ProtectedRoute (unauthenticated /admin access)
  useEffect(() => {
    const openModal = () => setAdminModalOpen(true);
    window.addEventListener('siet:open-admin-login', openModal);
    return () => window.removeEventListener('siet:open-admin-login', openModal);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Subtle shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleAdminButtonClick() {
    if (isAdmin) {
      navigate('/admin');
    } else {
      setAdminModalOpen(true);
    }
  }

  function handleAdminLogout() {
    localStorage.removeItem('siet_admin_token');
    sessionStorage.removeItem('siet_requester_draft');
    sessionStorage.removeItem('siet_candidate_draft');
    sessionStorage.removeItem('candidatePayload');
    sessionStorage.removeItem('siet_payment_draft');
    sessionStorage.removeItem('siet_active_request_id');
    sessionStorage.removeItem('siet_verification_result');
    window.dispatchEvent(new Event('siet:admin-logout'));
    navigate(ROUTES.HOME);
  }

  return (
    <>
      <header
        role="banner"
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Left: Brand Identity with Academic Cap Crest ── */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6A3E] rounded group flex-shrink-0"
              aria-label="SIET Academic Verification Portal – Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-green-900 text-yellow-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" fill="#0B6A3E" stroke="#FACC15" />
                  <path d="M22 10v6" stroke="#FACC15" />
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" stroke="#FFFFFF" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Academic Verification Portal
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Sri Shakthi Institute of Engineering and Technology
                </span>
              </div>
            </Link>

            {/* ── Centre: Desktop Navigation (Centered) ── */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-8 justify-center flex-1"
            >
              <NavLink
                to={ROUTES.HOME}
                end
                className={({ isActive }) =>
                  [
                    'text-sm font-semibold transition-all py-1 border-b-2',
                    isActive
                      ? 'text-[#0B6A3E] border-[#0B6A3E]'
                      : 'text-slate-600 hover:text-[#0B6A3E] border-transparent hover:border-slate-300',
                  ].join(' ')
                }
              >
                Home
              </NavLink>
              <NavLink
                to={ROUTES.REQUESTER}
                className={({ isActive }) =>
                  [
                    'text-sm font-semibold transition-all py-1 border-b-2',
                    isActive
                      ? 'text-[#0B6A3E] border-[#0B6A3E]'
                      : 'text-slate-600 hover:text-[#0B6A3E] border-transparent hover:border-slate-300',
                  ].join(' ')
                }
              >
                Verify
              </NavLink>
              <a
                href="/#how-it-works"
                className="text-sm font-semibold text-slate-600 hover:text-[#0B6A3E] transition-all py-1 border-b-2 border-transparent hover:border-slate-300"
              >
                About
              </a>
              <NavLink
                to={ROUTES.HELP}
                className={({ isActive }) =>
                  [
                    'text-sm font-semibold transition-all py-1 border-b-2',
                    isActive
                      ? 'text-[#0B6A3E] border-[#0B6A3E]'
                      : 'text-slate-600 hover:text-[#0B6A3E] border-transparent hover:border-slate-300',
                  ].join(' ')
                }
              >
                Help
              </NavLink>
            </nav>

            {/* ── Right: Yellow Pill Admin Portal button ── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Yellow pill-shaped "Admin Portal" button */}
              <button
                id="admin-portal-header-btn"
                type="button"
                onClick={handleAdminButtonClick}
                className="hidden sm:inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-5 py-2 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98] text-xs sm:text-sm"
                title="Access Administrative Portal"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Admin Portal</span>
              </button>

              {/* Admin Sign Out button (when logged-in) */}
              {isAdmin && (
                <button
                  id="admin-logout-btn"
                  type="button"
                  onClick={handleAdminLogout}
                  className="hidden md:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold
                             text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
                  title="Sign out of admin"
                >
                  Sign Out
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-slate-700
                           hover:bg-brand-light hover:text-brand-forest
                           focus-visible:ring-2 focus-visible:ring-brand-green
                           transition-colors duration-150"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="md:hidden border-t border-slate-200 bg-white animate-fade-in"
          >
            <ul className="section-container py-2 flex flex-col gap-0.5" role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      [
                        'block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150',
                        item.isPlaceholder
                          ? 'text-slate-400 pointer-events-none'
                          : isActive
                          ? 'text-brand-forest bg-brand-light border-l-4 border-brand-gold'
                          : 'text-slate-600 hover:text-brand-forest hover:bg-brand-light/50',
                      ].join(' ')
                    }
                    aria-label={item.label}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}

              <li className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleAdminButtonClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-full shadow-xs transition-colors"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Admin Portal</span>
                </button>
              </li>
              {isAdmin && (
                <li className="pt-2 border-t border-slate-200 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleAdminLogout();
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold
                               text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Sign Out (Admin)
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      {/* Admin Login Modal (portal-level, outside header DOM) */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </>
  );
}

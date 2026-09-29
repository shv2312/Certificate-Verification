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
import { ROUTES } from '../utils/routes';
import AdminLoginModal from './AdminLoginModal';
import sietLogo from '../assets/siet-logo.jpg';

interface NavItem {
  label: string;
  to: string;
  isPlaceholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',   to: ROUTES.HOME },
  { label: 'Verify', to: ROUTES.REQUESTER },
  { label: 'Status', to: ROUTES.STATUS },
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

            {/* ── Left: Brand Identity with Crest ── */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#0B6A3E] rounded group"
              aria-label="SIET Academic Verification Portal – Home"
            >
              <img
                src={sietLogo}
                alt="Official SIET Crest"
                className="h-10 w-auto object-contain flex-shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-mono text-2xs uppercase tracking-widest text-[#0B6A3E] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SIET Institutional Portal
                </span>
                <span className="text-base sm:text-lg font-bold text-[#074828] tracking-tight group-hover:text-[#0B6A3E] transition-colors">
                  Academic Verification
                </span>
              </div>
            </Link>

            {/* ── Centre: Desktop Navigation ── */}
            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-6"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  aria-label={item.label}
                  className={({ isActive }) =>
                    [
                      'text-sm transition-colors relative py-1',
                      'focus-visible:ring-2 focus-visible:ring-[#0B6A3E] focus-visible:outline-none rounded',
                      item.isPlaceholder
                        ? 'text-slate-400 cursor-default pointer-events-none'
                        : isActive
                        ? 'text-[#0B6A3E] font-semibold after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-[#0B6A3E]'
                        : 'text-slate-600 hover:text-[#0B6A3E] font-medium',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* ── Right: Admin controls + Mobile Menu ── */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Admin Dashboard button (logged-in state) */}
              {isAdmin ? (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    id="admin-dashboard-btn"
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium
                               bg-[#074828] text-white hover:bg-[#0B6A3E] border border-amber-400/40 transition-colors shadow-xs"
                    title="Go to Admin Dashboard"
                  >
                    <svg className="w-3.5 h-3.5 text-[#FACC15]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    id="admin-logout-btn"
                    type="button"
                    onClick={handleAdminLogout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono font-medium
                               text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
                    title="Sign out of admin"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Admin Login button (logged-out state) */
                <button
                  id="admin-login-btn"
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="hidden md:inline-flex items-center gap-1.5 border border-slate-200 hover:border-[#0B6A3E] text-slate-700 hover:text-[#0B6A3E] text-xs font-mono font-medium px-3.5 py-1.5 rounded-full transition-all"
                  aria-label="Admin Login"
                  title="Admin Portal Login"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Admin Portal
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

              {/* Mobile Admin section */}
              <li className="pt-2 border-t border-slate-200 mt-1">
                {isAdmin ? (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold
                                 text-brand-forest bg-brand-light hover:bg-emerald-100 transition-colors"
                    >
                      Admin Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold
                                 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Sign Out (Admin)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAdminModalOpen(true); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold
                               text-slate-700 hover:text-brand-forest hover:bg-brand-light transition-colors"
                  >
                    Admin Login
                  </button>
                )}
              </li>
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

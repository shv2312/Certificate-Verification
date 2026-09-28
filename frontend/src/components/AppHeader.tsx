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
  { label: 'Verify', to: ROUTES.COMPANY },
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
    window.dispatchEvent(new Event('siet:admin-logout'));
    navigate(ROUTES.HOME);
  }

  return (
    <>
      <header
        role="banner"
        className={`sticky top-0 z-40 bg-white border-b border-siet-border transition-shadow duration-200 ${
          scrolled ? 'shadow-header' : ''
        }`}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Left: Institutional Identity ── */}
            <Link
              to={ROUTES.HOME}
              className="flex flex-col leading-tight focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-siet-sky rounded"
              aria-label="SIET Academic Verification Portal – Home"
            >
              <span className="text-xs font-medium text-siet-sky uppercase tracking-widest">
                Sri Shakthi Institute of Engineering and Technology
              </span>
              <span className="text-sm font-semibold text-siet-navy">
                Academic Background Verification Portal
              </span>
            </Link>

            {/* ── Centre: Desktop Navigation ── */}
            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-1"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  aria-label={item.label}
                  className={({ isActive }) =>
                    [
                      'px-3 py-2 rounded text-sm font-medium transition-colors duration-150',
                      'focus-visible:ring-2 focus-visible:ring-siet-sky focus-visible:outline-none',
                      item.isPlaceholder
                        ? 'text-siet-muted cursor-default pointer-events-none'
                        : isActive
                        ? 'text-siet-sky bg-blue-50'
                        : 'text-siet-slate hover:text-siet-navy hover:bg-siet-silver',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* ── Right: Admin controls + Logo + Mobile Menu ── */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Admin Dashboard button (logged-in state) */}
              {isAdmin ? (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    id="admin-dashboard-btn"
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-siet-navy text-white hover:bg-blue-900 transition-colors duration-150"
                    title="Go to Admin Dashboard"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    id="admin-logout-btn"
                    type="button"
                    onClick={handleAdminLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                               text-siet-error border border-red-200 hover:bg-red-50 transition-colors duration-150"
                    title="Sign out of admin"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Admin Login button (logged-out state) */
                <button
                  id="admin-login-btn"
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             text-siet-navy border border-siet-border hover:bg-siet-silver
                             hover:border-siet-slate transition-colors duration-150"
                  aria-label="Admin Login"
                  title="Admin Portal Login"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Admin
                </button>
              )}

              {/* SIET Logo — top-right institutional identity */}
              <img
                src={sietLogo}
                alt="Official SIET Logo"
                className="hidden sm:block h-11 w-auto object-contain"
              />

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden p-2 rounded text-siet-slate
                           hover:bg-siet-silver hover:text-siet-navy
                           focus-visible:ring-2 focus-visible:ring-siet-sky
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
            className="md:hidden border-t border-siet-border bg-white animate-fade-in"
          >
            <ul className="section-container py-2 flex flex-col gap-0.5" role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      [
                        'block px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150',
                        item.isPlaceholder
                          ? 'text-siet-muted pointer-events-none'
                          : isActive
                          ? 'text-siet-sky bg-blue-50'
                          : 'text-siet-slate hover:text-siet-navy hover:bg-siet-silver',
                      ].join(' ')
                    }
                    aria-label={item.label}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}

              {/* Mobile Admin section */}
              <li className="pt-2 border-t border-siet-border mt-1">
                {isAdmin ? (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 rounded text-sm font-semibold
                                 text-siet-navy bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Admin Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="block w-full text-left px-3 py-2.5 rounded text-sm font-medium
                                 text-siet-error hover:bg-red-50 transition-colors"
                    >
                      Sign Out (Admin)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAdminModalOpen(true); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 rounded text-sm font-medium
                               text-siet-slate hover:text-siet-navy hover:bg-siet-silver transition-colors"
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

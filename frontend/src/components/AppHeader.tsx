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

import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Lock, LockOpen, Bell } from 'lucide-react';
import { ROUTES } from '../utils/routes';
import AdminLoginModal from './AdminLoginModal';
import FAQModal from './FAQModal';
import { playNotificationAlert } from '../utils/soundAlert';
import { getPendingRequests } from '../api/admin';

interface NavItem {
  label: string;
  to: string;
  isPlaceholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',         to: ROUTES.HOME },
  { label: 'Verify',       to: ROUTES.REQUESTER },
  { label: 'Track Status', to: ROUTES.STATUS },
];

export default function AppHeader() {
  const [menuOpen,          setMenuOpen]          = useState(false);
  const [scrolled,          setScrolled]          = useState(false);
  const [adminModalOpen,    setAdminModalOpen]    = useState(false);
  const [faqModalOpen,      setFaqModalOpen]      = useState(false);
  const [pendingRequests,   setPendingRequests]   = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const prevCountRef = useRef<number | null>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

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

  // Close notification popover when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifDropdownOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Real-time polling for incoming verification requests when admin is active
  useEffect(() => {
    if (!isAdmin && !isAdminRoute) return;

    let mounted = true;
    const fetchPending = async () => {
      try {
        const data = await getPendingRequests();
        if (mounted && Array.isArray(data)) {
          setPendingRequests(data);
          // If a new request arrives, trigger audio chime
          if (prevCountRef.current !== null && data.length > prevCountRef.current) {
            playNotificationAlert();
          }
          prevCountRef.current = data.length;
        }
      } catch (err) {
        // Silently handle polling network blip
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isAdmin, isAdminRoute]);

  // Listen for custom event from ProtectedRoute (unauthenticated /admin access)
  useEffect(() => {
    const openModal = () => setAdminModalOpen(true);
    window.addEventListener('siet:open-admin-login', openModal);
    return () => window.removeEventListener('siet:open-admin-login', openModal);
  }, []);

  // Listen for custom event to open FAQ modal
  useEffect(() => {
    const openFaq = () => setFaqModalOpen(true);
    window.addEventListener('siet:open-faq-modal', openFaq);
    return () => window.removeEventListener('siet:open-faq-modal', openFaq);
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

            {/* ── Centre: Desktop Navigation (Centered - Hidden on Admin routes) ── */}
            {!isAdminRoute && (
              <nav
                aria-label="Main navigation"
                className="hidden lg:flex items-center gap-8 justify-center flex-1"
              >
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === ROUTES.HOME}
                    className={({ isActive }) =>
                      [
                        'text-sm font-semibold transition-all py-1 border-b-2',
                        isActive
                          ? 'text-[#0B6A3E] border-[#0B6A3E]'
                          : 'text-slate-600 hover:text-[#0B6A3E] border-transparent hover:border-slate-300',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* ── Right: Admin Portal button / Sign Out button ── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Yellow pill-shaped "Admin Portal" button (hidden on Admin routes) */}
              {!isAdminRoute && (
                <button
                  id="admin-portal-header-btn"
                  type="button"
                  onClick={handleAdminButtonClick}
                  className="hidden sm:inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-5 py-2 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98] text-xs sm:text-sm"
                  title={isAdmin ? 'Go to Admin Dashboard' : 'Access Administrative Portal'}
                >
                  {isAdmin
                    ? <LockOpen className="w-4 h-4 text-slate-950" />
                    : <Lock className="w-4 h-4 text-slate-950" />}
                  <span>Admin Portal</span>
                  {isAdmin && (
                    <span className="bg-emerald-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      ✓
                    </span>
                  )}
                </button>
              )}

              {/* Admin Notification Bell (shown when on admin route or admin logged in) */}
              {(isAdmin || isAdminRoute) && (
                <div className="relative" ref={notifRef}>
                  <button
                    id="admin-notification-bell-btn"
                    type="button"
                    onClick={() => setNotifDropdownOpen((prev) => !prev)}
                    className="relative p-2 rounded-full text-slate-800 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6A3E]"
                    title="Verification Notifications"
                    aria-label="Admin Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Menu */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-slide-up">
                      {/* Popover header — light background, high-contrast text */}
                      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Pending Verifications</h4>
                            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Admin review queue</p>
                          </div>
                        </div>
                        <span className="text-[11px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                          {pendingRequests.length} Queued
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {pendingRequests.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No requests pending administrative review.
                          </div>
                        ) : (
                          pendingRequests.map((req: any) => (
                            <div
                              key={req.id}
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                navigate('/admin/audit');
                              }}
                              className="p-3 hover:bg-emerald-50/50 transition-colors cursor-pointer text-left"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs font-bold text-slate-800">
                                  {req.display_request_id || req.id.slice(0, 12)}
                                </span>
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Review Needed
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {req.candidate_name || 'Candidate Verification'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {req.company_name} ({req.hr_email})
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            navigate('/admin/audit');
                          }}
                          className="w-full text-xs font-bold text-[#0B6A3E] hover:text-[#074828] py-1.5 transition-colors"
                        >
                          View All in Audit Queue →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Sign Out button (shown when logged-in or on admin route) */}
              {(isAdmin || isAdminRoute) && (
                <button
                  id="admin-logout-btn"
                  type="button"
                  onClick={handleAdminLogout}
                  className="inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-semibold
                             text-red-700 hover:bg-red-50 border border-red-200 transition-colors shadow-xs"
                  title="Sign out of admin"
                >
                  Sign Out
                </button>
              )}

              {/* Mobile hamburger (only on public routes) */}
              {!isAdminRoute && (
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
              )}
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
                  {isAdmin
                    ? <LockOpen className="w-4 h-4 text-slate-950" />
                    : <Lock className="w-4 h-4 text-slate-950" />}
                  <span>Admin Portal</span>
                  {isAdmin && (
                    <span className="bg-emerald-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">✓</span>
                  )}
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

      {/* Interactive FAQ Decision Tree Modal */}
      <FAQModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
      />
    </>
  );
}

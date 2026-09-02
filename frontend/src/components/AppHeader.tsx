/**
 * AppHeader — Persistent site header for the SIET Verification Portal.
 *
 * Contains:
 *  - Institutional identity (SIET name + portal title)
 *  - SIET logo (top-right, per institutional identity guidelines)
 *  - Primary navigation
 *  - Mobile hamburger menu
 *
 * LOGO NOTE:
 *  The official SIET logo asset has not yet been provided.
 *  A clearly labelled placeholder is rendered instead.
 *  Replace `src/assets/siet-logo.png` with the official logo file
 *  when it becomes available.
 */

import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

interface NavItem {
  label: string;
  to: string;
  isPlaceholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',   to: ROUTES.HOME },
  { label: 'Verify', to: ROUTES.COMPANY },
  { label: 'Status', to: ROUTES.STATUS,  isPlaceholder: true },
  { label: 'Help',   to: ROUTES.HELP,    isPlaceholder: true },
];

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const location = useLocation();

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

  return (
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
                aria-label={item.isPlaceholder ? `${item.label} (coming soon)` : item.label}
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
                {item.isPlaceholder && (
                  <span className="ml-1 text-2xs text-siet-muted">(soon)</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Right: SIET Logo + Mobile Menu Button ── */}
          <div className="flex items-center gap-3">
            {/* SIET Logo — top-right institutional identity */}
            <div
              aria-label="SIET Logo placeholder – replace with official asset at src/assets/siet-logo.png"
              title="Official SIET logo asset required. Place at: src/assets/siet-logo.png"
              className="hidden sm:flex flex-col items-center justify-center
                         w-11 h-11 rounded border-2 border-dashed border-siet-border
                         text-center cursor-default select-none"
            >
              <span className="text-2xs font-bold text-siet-navy leading-none">SIET</span>
              <span className="text-2xs text-siet-muted leading-none">LOGO</span>
            </div>

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
                /* X icon */
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger icon */
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
                  aria-label={item.isPlaceholder ? `${item.label} (coming soon)` : item.label}
                >
                  {item.label}
                  {item.isPlaceholder && (
                    <span className="ml-1.5 text-xs text-siet-muted">(coming soon)</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

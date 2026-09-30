/**
 * HelpFloatingButton — Global Floating Action Button (FAB) for the FAQ Assistant.
 * Positioned fixed at bottom-right on public pages; automatically hidden on /admin routes.
 */

import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function HelpFloatingButton() {
  const location = useLocation();

  // Do not render floating help button on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleOpenFaq = () => {
    window.dispatchEvent(new Event('siet:open-faq-modal'));
  };

  return (
    <button
      type="button"
      onClick={handleOpenFaq}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-800 to-green-900 text-yellow-400 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 border border-emerald-700/50"
      aria-label="Open Help & FAQ Decision Tree"
      title="Need help? Click to open FAQ Assistant"
    >
      <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-200" />
      
      {/* Subtle indicator pulse dot */}
      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400 border-2 border-emerald-900"></span>
      </span>
    </button>
  );
}

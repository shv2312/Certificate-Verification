/**
 * AppFooter — Institutional footer for the SIET Verification Portal.
 *
 * Contains:
 *  - SIET institutional identity
 *  - Portal description
 *  - Official website link (placeholder — replace with confirmed URL)
 *  - Copyright notice
 *
 * NOTE:
 *  Phone numbers, email addresses, and physical addresses have NOT been
 *  included because they were not confirmed in project documentation.
 *  Add verified contact details here when confirmed by project leads.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import { 
  ShieldCheck, 
  Link as LinkIcon, 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AppFooter() {
  return (
    <footer
      role="contentinfo"
      className="bg-[#052b17] text-white mt-auto border-t border-emerald-950 relative overflow-hidden"
    >
      {/* Decorative subtle corner yellow accent */}
      <div 
        className="absolute -bottom-10 -right-10 w-44 h-44 bg-yellow-400/90 rotate-45 transform origin-bottom-right pointer-events-none hidden md:block"
        aria-hidden="true" 
      />

      {/* Main footer content */}
      <div className="section-container pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 items-start">

          {/* Column 1: Brand & Institutional Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-yellow-400 flex items-center justify-center border border-emerald-700/60 shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  Academic Verification Portal
                </h3>
                <p className="text-xs text-yellow-400 font-medium">
                  Trusted Credentials. Brighter Futures.
                </p>
              </div>
            </div>

            <p className="text-sm text-emerald-100/75 leading-relaxed pr-4">
              Official Academic Background Verification Portal for Sri Shakthi Institute of Engineering and Technology (SIET), serving students, institutions, and employers.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Secure
              </span>
              <span className="text-emerald-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Reliable
              </span>
              <span className="text-emerald-600">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Official
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider text-yellow-400 uppercase flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-yellow-400" />
              Quick Links
            </h4>

            <ul className="space-y-2.5 text-sm" role="list">
              <li>
                <Link
                  to={ROUTES.HOME}
                  className="text-emerald-100/80 hover:text-yellow-400 transition-colors inline-flex items-center gap-2 group"
                >
                  <span>Home</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.REQUESTER}
                  className="text-emerald-100/80 hover:text-yellow-400 transition-colors inline-flex items-center gap-2 group"
                >
                  <span>Verify</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="text-emerald-100/80 hover:text-yellow-400 transition-colors inline-flex items-center gap-2 group"
                >
                  <span>About</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('siet:open-faq-modal'))}
                  className="text-emerald-100/80 hover:text-yellow-400 transition-colors inline-flex items-center gap-2 group text-left"
                >
                  <span>Help & FAQs</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </li>
              <li>
                <Link
                  to={ROUTES.ADMIN}
                  className="text-emerald-100/80 hover:text-yellow-400 transition-colors inline-flex items-center gap-2 group"
                >
                  <span>Admin Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider text-yellow-400 uppercase flex items-center gap-2">
              <Mail className="w-4 h-4 text-yellow-400" />
              Contact Us
            </h4>

            <ul className="space-y-2.5 text-sm text-emerald-100/80" role="list">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <a 
                  href="mailto:support@siet.ac.in" 
                  className="hover:text-yellow-400 transition-colors"
                >
                  support@siet.ac.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Sri Shakthi Nagar, Coimbatore, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a 
                  href="tel:+919876543210" 
                  className="hover:text-yellow-400 transition-colors font-mono text-xs sm:text-sm"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Mon – Fri, 9:00 AM – 6:00 PM</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom copyright and official service bar */}
      <div className="bg-[#031d0f] text-xs text-emerald-300/70 border-t border-emerald-900/60 py-4 px-4 sm:px-6">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-center sm:text-left">
            &copy; {CURRENT_YEAR} Sri Shakthi Institute of Engineering and Technology. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
            <span>Official Academic Verification Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

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

const CURRENT_YEAR = new Date().getFullYear();

export default function AppFooter() {
  return (
    <footer
      role="contentinfo"
      className="bg-[#074828] text-white mt-auto border-t border-emerald-900"
    >
      {/* Main footer content */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">

          {/* Column 1: Institutional Identity */}
          <div>
            <p className="text-xs font-bold tracking-wider text-[#FACC15] uppercase mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
              OFFICIAL INSTITUTIONAL SERVICE
            </p>
            <h2 className="text-base font-semibold text-white mb-2 leading-snug">
              Sri Shakthi Institute of<br />Engineering and Technology
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed max-w-sm">
              Academic Background Verification Portal is an official institutional service
              for verifying candidate academic credentials issued by SIET.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-[#FACC15] uppercase mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
              QUICK LINKS
            </h3>
            <ul className="space-y-1" role="list">
              <li>
                <a
                  href="https://www.siet.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-100/90 hover:text-[#FACC15] transition-colors py-1 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] rounded"
                >
                  SIET Official Website ↗
                </a>
              </li>
              <li>
                <Link
                  to={ROUTES.HELP}
                  className="text-sm text-emerald-100/90 hover:text-[#FACC15] transition-colors py-1 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] rounded"
                >
                  Help &amp; Support
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.STATUS}
                  className="text-sm text-emerald-100/90 hover:text-[#FACC15] transition-colors py-1 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] rounded"
                >
                  Track Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Important Notes */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-[#FACC15] uppercase mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
              IMPORTANT
            </h3>
            <ul className="text-xs text-emerald-100/80 leading-relaxed list-disc pl-4 space-y-2" role="list">
              <li>
                One payment authorises one candidate verification only.
              </li>
              <li>
                Verification results are delivered directly to the registered HR email.
              </li>
              <li>
                This is an authorised institutional service. Unauthorised misuse is
                strictly prohibited.
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#042816] text-xs text-emerald-200/70 border-t border-emerald-950 py-4 px-6">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-center sm:text-left">
            &copy; {CURRENT_YEAR} Sri Shakthi Institute of Engineering and Technology. All rights reserved.
          </p>
          <p className="font-medium text-center sm:text-right">
            Official Academic Verification Gateway
          </p>
        </div>
      </div>
    </footer>
  );
}

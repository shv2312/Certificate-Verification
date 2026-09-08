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

const CURRENT_YEAR = new Date().getFullYear();

export default function AppFooter() {
  return (
    <footer
      role="contentinfo"
      className="bg-siet-navy text-white mt-auto"
    >
      {/* Main footer content */}
      <div className="section-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Column 1: Institutional Identity */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-1">
                Official Institutional Service
              </p>
              <h2 className="text-base font-bold text-white leading-snug">
                Sri Shakthi Institute of<br />Engineering and Technology
              </h2>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              Academic Background Verification Portal — an official service
              for verifying candidate credentials issued by SIET.
            </p>
          </div>

          {/* Column 2: Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2" role="list">
              <li>
                <a
                  href="https://www.siet.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-200 hover:text-white transition-colors duration-150
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300
                             focus-visible:ring-offset-2 focus-visible:ring-offset-siet-navy rounded"
                >
                  SIET Official Website ↗
                </a>
              </li>
              <li>
                <span
                  className="text-sm text-blue-400 cursor-default select-none"
                  title="Help centre"
                >
                  Help &amp; Support
                </span>
              </li>
              <li>
                <span
                  className="text-sm text-blue-400 cursor-default select-none"
                  title="Track verification status"
                >
                  Track Verification
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Important Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Important
            </h3>
            <ul className="space-y-2 text-sm text-blue-200" role="list">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                One payment authorises one candidate verification only.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                Verification results are delivered to the registered HR email.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                This is an authorised institutional service. Misuse may be
                subject to legal action.
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-blue-800">
        <div className="section-container py-4 flex flex-col sm:flex-row
                        items-center justify-between gap-2">
          <p className="text-xs text-blue-400 text-center sm:text-left">
            &copy; {CURRENT_YEAR} Sri Shakthi Institute of Engineering and Technology.
            All rights reserved.
          </p>
          <p className="text-xs text-blue-500 text-center sm:text-right">
            Academic Background Verification Portal — Official Service
          </p>
        </div>
      </div>
    </footer>
  );
}

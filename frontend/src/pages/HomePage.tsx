import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';

export default function HomePage() {
  const [mockState, setMockState] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMockState((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col bg-slate-50 flex-1">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 text-slate-900 pt-20 pb-28 border-b border-slate-200/80">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/30 blur-3xl" />
        </div>

        <div className="section-container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left Column: Copy & CTA */}
            <div className="flex-1 text-center lg:text-left">
              {/* Gateway Badge / Top Pill */}
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium px-4 py-1.5 rounded-full text-xs sm:text-sm inline-flex items-center gap-2 mb-6 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Official SIET Academic Verification Gateway
              </div>

              {/* Main Heading */}
              <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-slate-900 mb-6">
                <span className="text-[#0B6A3E]">Academic Background</span><br />
                Verification Portal
              </h1>

              {/* Subheading Paragraph */}
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                Official credential verification service for HR professionals, background verification agencies, and institutions.
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to={ROUTES.REQUESTER}
                  className="bg-[#0B6A3E] hover:bg-[#074828] text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base w-full sm:w-auto"
                >
                  Start Verification
                  <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to={ROUTES.STATUS}
                  className="bg-white hover:bg-emerald-50 border-2 border-[#0B6A3E] text-[#0B6A3E] font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-base w-full sm:w-auto shadow-xs"
                >
                  Verify via QR / Status Code
                  <svg className="w-5 h-5 text-[#0B6A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </Link>
              </div>

              {/* Supporting Notes */}
              <p className="mt-6 text-xs text-slate-500 font-medium">
                <span className="font-bold text-amber-700">Important:</span>{' '}
                One payment authorises verification of one candidate only.
              </p>
              <div className="mt-3 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-[#0B6A3E] font-medium">
                <svg className="w-4 h-4 text-[#0B6A3E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Powered by SIET Examination Board
              </div>
            </div>

            {/* Right Column: Showcase Card */}
            <div className="flex-1 w-full max-w-lg relative perspective-1000 hidden md:block">
              <div className="relative transform-gpu transition-all duration-700 ease-in-out hover:scale-[1.02]">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 relative z-10 text-slate-800 p-6">
                  <div className="bg-slate-50 -mx-6 -mt-6 px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-2xs font-bold uppercase tracking-wider text-[#074828] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      SIET Institutional Node
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-emerald-50 text-[#0B6A3E] rounded-xl flex items-center justify-center font-bold text-2xl border border-emerald-200 shadow-xs">
                        A
                      </div>
                      <div>
                        <div className="h-5 w-36 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-4 relative min-h-[110px]">
                       <div className="absolute right-0 top-0">
                         {mockState === 0 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">Ingestion</span>}
                         {mockState === 1 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">Processing</span>}
                         {mockState === 2 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold">Institutional Record Matched</span>}
                       </div>
                       
                       {mockState === 0 && (
                         <div className="pt-8">
                           <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-3" />
                           <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                         </div>
                       )}
                       {mockState === 1 && (
                         <div className="pt-8">
                           <div className="text-sm text-[#0B6A3E] mb-3 font-semibold">Validating against institutional student archives...</div>
                           <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                             <div className="h-full bg-[#0B6A3E] w-full animate-pulse origin-left" />
                           </div>
                         </div>
                       )}
                       {mockState === 2 && (
                         <div className="pt-8 space-y-3">
                           <div>
                             <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Degree</div>
                             <div className="text-sm font-bold text-slate-900">B.E. Computer Science</div>
                           </div>
                           <div>
                             <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Graduation Year</div>
                             <div className="text-sm font-semibold text-slate-800">2023</div>
                           </div>
                           <div className="mt-2">
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                               <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                               Hash: 8f4e2...a1b9
                             </span>
                           </div>
                         </div>
                       )}
                    </div>
                    <div className={`mt-6 p-4 rounded-xl border transition-all duration-500 ${mockState === 2 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mockState === 2 ? 'bg-[#0B6A3E] text-white shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                           {mockState === 2 ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           ) : (
                             <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                           )}
                         </div>
                         <div>
                           <div className={`text-sm font-bold ${mockState === 2 ? 'text-[#074828]' : 'text-slate-700'}`}>
                             {mockState === 0 ? 'Candidate Registration Input' : mockState === 1 ? 'Processing Verification' : 'Official Report Generated'}
                           </div>
                           <div className={`text-xs ${mockState === 2 ? 'text-[#0B6A3E] font-medium' : 'text-slate-500'}`}>
                             {mockState === 0 ? 'Awaiting submission...' : mockState === 1 ? 'Consulting official archives' : 'PDF dispatched to HR'}
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-xl z-0" />
                <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-200/40 rounded-full blur-xl z-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (Restored 6-Step Canonical Workflow) ───────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-50 scroll-mt-20">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#074828] mb-4">
              How Verification Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A straightforward six-step process to verify a candidate&apos;s academic background.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">01</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Requester Details</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Provide your organization and contact information to initiate a verification request.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">02</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Email Verification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">A verification code is sent to your official email. Confirm your identity before proceeding.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">03</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Candidate Details</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Enter the candidate&apos;s name, register number, course, branch, and year of passing.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">04</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Payment</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Complete a one-time payment. Each payment authorises verification of one candidate only.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">05</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Institutional Verification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Details are verified against official SIET archives. Official reports are processed within standard working days.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col gap-4 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-[#0B6A3E] font-bold text-xl mb-4 border border-emerald-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">06</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Official Report</h3>
                <p className="text-sm text-slate-600 leading-relaxed">A detailed verification report is generated and delivered to your verified official email.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Trust & Security (Restored from Original) ────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#074828] mb-4">
              Security &amp; Trust
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              This portal is an official institutional service of SIET.
              Your data and verification results are handled responsibly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-5 p-8 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-[#0B6A3E] shadow-xs flex items-center justify-center border border-emerald-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Official Source</h3>
                <p className="text-sm text-slate-600 leading-relaxed">All verification results are sourced directly from the official SIET institutional database. No third-party data is used.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-[#0B6A3E] shadow-xs flex items-center justify-center border border-emerald-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Verified HR Email Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Verification reports are sent exclusively to the HR email that was verified at the beginning of the request. No exceptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-[#0B6A3E] shadow-xs flex items-center justify-center border border-emerald-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Data Privacy</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Candidate information submitted for verification is processed securely and is not stored beyond the verification transaction.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-[#0B6A3E] shadow-xs flex items-center justify-center border border-emerald-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Unique Request ID</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Every verification request receives a unique ID that can be used to track and reference the verification outcome.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

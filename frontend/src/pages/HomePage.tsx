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
      <section className="relative overflow-hidden bg-siet-navy text-white pt-24 pb-32">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-blue-900/30 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-blue-800/20 blur-3xl" />
        </div>

        <div className="section-container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left Column: Copy & CTA */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-200 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Official SIET Academic Verification Gateway
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
                Academic Background Verification Portal
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Official credential verification service for HR professionals, background verification agencies, and institutions.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to={ROUTES.COMPANY}
                  className="px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all hover:ring-4 hover:ring-blue-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Start Verification
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to={ROUTES.STATUS}
                  className="px-8 py-4 rounded-lg bg-transparent border border-blue-400/50 text-blue-100 hover:bg-blue-800/50 hover:border-blue-300 transition-all font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Verify via QR / Status Code
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </Link>
              </div>
              {/* Restored Disclosures */}
              <p className="mt-6 text-sm text-blue-400">
                <span className="font-medium text-blue-300">Important:</span>{' '}
                One payment authorises verification of one candidate only.
              </p>
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-3 text-blue-300/80 text-sm font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Powered by SIET Examination Board
              </div>
            </div>

            {/* Right Column: Interactive Mock Layer */}
            <div className="flex-1 w-full max-w-lg relative perspective-1000 hidden md:block">
              <div className="relative transform-gpu transition-all duration-700 ease-in-out hover:scale-105" style={{ transform: 'rotateY(-5deg) rotateX(2deg)' }}>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative z-10 text-slate-800">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl">A</div>
                      <div>
                        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-4 relative">
                       <div className="absolute right-0 top-0">
                         {mockState === 0 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Processing...</span>}
                         {mockState === 1 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Matching Records</span>}
                         {mockState === 2 && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Institutional Record Matched</span>}
                       </div>
                       <div>
                         <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Degree</div>
                         {mockState > 0 ? <div className="text-sm font-medium text-slate-800">B.E. Computer Science</div> : <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />}
                       </div>
                       <div>
                         <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Graduation Year</div>
                         {mockState > 0 ? <div className="text-sm font-medium text-slate-800">2023</div> : <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />}
                       </div>
                    </div>
                    <div className={`mt-8 p-4 rounded-xl border transition-all duration-500 ${mockState === 2 ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mockState === 2 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                           {mockState === 2 ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           ) : (
                             <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                           )}
                         </div>
                         <div>
                           <div className={`text-sm font-bold ${mockState === 2 ? 'text-green-800' : 'text-slate-600'}`}>
                             {mockState === 2 ? 'Official Report Generated' : 'Verification In Progress'}
                           </div>
                           <div className={`text-xs ${mockState === 2 ? 'text-green-600' : 'text-slate-400'}`}>
                             {mockState === 2 ? 'PDF dispatched to HR' : 'Consulting official archives'}
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl z-0" />
                <div className="absolute -left-6 -top-6 w-32 h-32 bg-sky-500/10 rounded-full blur-xl z-0" />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── How It Works (Restored 6-Step Canonical Workflow) ───────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-50 scroll-mt-20">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-siet-navy mb-4">
              How Verification Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A straightforward six-step process to verify a candidate&apos;s academic background.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">01</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">01</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Company Registration</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Provide your company name and official HR email address to initiate a verification request.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">02</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">02</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Email Verification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">A verification code is sent to your HR email. Confirm your identity before proceeding.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">03</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">03</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Secure Payment</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Complete a one-time payment. Each payment authorises verification of one candidate only.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">04</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">04</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Submit Candidate Details</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Enter the candidate&apos;s name, register number, course, branch, and year of passing.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">05</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">05</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Institutional Verification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Details are verified against official SIET archives. Official reports are processed within standard working days.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300 z-0">06</div>
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4 border border-blue-100">06</span>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Receive Official Report</h3>
                <p className="text-sm text-slate-600 leading-relaxed">A detailed verification report is generated and delivered to your verified HR email.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Trust & Security (Restored from Original) ────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-siet-navy mb-4">
              Security &amp; Trust
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              This portal is an official institutional service of SIET.
              Your data and verification results are handled responsibly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-5 p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Official Source</h3>
                <p className="text-sm text-slate-600 leading-relaxed">All verification results are sourced directly from the official SIET institutional database. No third-party data is used.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Verified HR Email Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Verification reports are sent exclusively to the HR email that was verified at the beginning of the request. No exceptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Data Privacy</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Candidate information submitted for verification is processed securely and is not stored beyond the verification transaction.</p>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-siet-navy mb-2">Unique Request ID</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Every verification request receives a unique ID that can be used to track and reference the verification outcome.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE TRUST STRIP */}
      <section className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="section-container text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Trusted By &amp; Compliant With</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
             <div className="flex items-center gap-2 font-bold text-xl text-slate-700">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
               ISO 9001:2015
             </div>
             <div className="flex items-center gap-2 font-bold text-xl text-slate-700">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
               Data Privacy Compliant
             </div>
             <div className="flex items-center gap-2 font-bold text-xl text-slate-700">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
               SIET Exam Board
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}

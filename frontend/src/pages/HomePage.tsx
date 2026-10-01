import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROUTES } from '../utils/routes';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  ArrowRight, 
  GraduationCap, 
  Check, 
  ChevronRight, 
  FileSearch, 
  Mail, 
  UserCheck, 
  FileText, 
  FilePlus, 
  Lock 
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [showQrDecoded, setShowQrDecoded] = useState(false);
  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#042414] via-[#083b20] to-[#0d522e] text-white pt-14 pb-20 lg:pt-20 lg:pb-28">

        {/* Campus Building Architectural Background Overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* SIET Building photo — right half, visible behind card */}
          <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full opacity-25 lg:opacity-30 mix-blend-luminosity">
            <img
              src="/image_46c159.jpg"
              alt="Sri Shakthi Institute of Engineering and Technology (SIET) Campus"
              className="w-full h-full object-cover object-right"
            />
          </div>
          {/* Gradient fades */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042414] via-[#083b20]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042414] via-transparent to-transparent" />
        </div>


        {/* ── Hero content: tight flex row — card sits directly beside headline ── */}
        <div className="relative z-10 w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center justify-start gap-10 xl:gap-14">

            {/* ── Left Column: Headline + CTAs ── */}
            <div className="w-full lg:max-w-[580px] xl:max-w-[640px] shrink-0 text-center lg:text-left">

              {/* Trust pill */}
              <div className="inline-flex items-center gap-2 bg-[#06331c]/90 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-md shadow-inner">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Secure</span>
                <span className="text-yellow-400 font-bold">•</span>
                <span>Reliable</span>
                <span className="text-yellow-400 font-bold">•</span>
                <span>Official</span>
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                Academic<br />
                Background<br />
                <span className="text-yellow-400">Verification Portal</span>
              </h1>

              {/* Subheading */}
              <p className="text-emerald-100/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                Check your credentials and verify academic records for a safer, more trusted tomorrow.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to={ROUTES.REQUESTER}
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base w-full sm:w-auto group active:scale-[0.98]"
                >
                  <Search className="w-5 h-5 text-slate-950" />
                  <span>Start Verification</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to={ROUTES.STATUS}
                  className="bg-transparent hover:bg-white/10 text-white font-semibold border-2 border-white/50 hover:border-white px-6 py-3.5 rounded-full transition-all flex items-center justify-center gap-2.5 text-base w-full sm:w-auto active:scale-[0.98] backdrop-blur-xs"
                >
                  <QrCode className="w-5 h-5 text-yellow-400" />
                  <span>Track Status / QR</span>
                </Link>
              </div>

              {/* Track link */}
              <div className="mt-4 text-center lg:text-left">
                <Link
                  to={ROUTES.STATUS}
                  className="inline-flex items-center gap-1.5 text-sm text-emerald-200/90 hover:text-yellow-400 font-medium transition-colors group"
                >
                  <span>Already submitted a request? Track Verification Status</span>
                  <ArrowRight className="w-3.5 h-3.5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust indicator */}
              <div className="mt-8 flex items-start gap-2.5 justify-center lg:justify-start text-xs text-emerald-200/90">
                <ShieldCheck className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-emerald-100">Trusted by educational institutions and employers</p>
                  <p className="text-emerald-300/80 mt-0.5">Secure&nbsp;•&nbsp;Fast&nbsp;•&nbsp;Accurate</p>
                </div>
              </div>
            </div>

            {/* ── Right Column: SIET Credential Card — sits right beside the headline ── */}
            <div className="w-full max-w-[420px] shrink-0 flex justify-center lg:justify-start">
              <div className="w-full bg-white rounded-2xl shadow-2xl border border-white/20 text-slate-800 overflow-hidden transition-all duration-300 hover:scale-[1.012] hover:shadow-[0_32px_64px_rgba(0,0,0,0.24)]">

                {/* ── Card Top Chrome ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Verification Portal</span>
                  </div>
                </div>

                {/* ── Institution Header ── */}
                <div className="px-5 pt-4 pb-3.5 bg-gradient-to-br from-[#042414] to-[#0a3d21] text-white">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-md select-none">
                      SI
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white leading-tight">Sri Shakthi Institute of Engineering and Technology</p>
                      <p className="text-[10px] text-emerald-300/80 mt-0.5">Autonomous • Affiliated to Anna University</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-500/40 px-3 py-1 rounded-full text-[10px] font-semibold text-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    Ledger Verified — Institutional Record Authenticated
                  </div>
                </div>

                {/* ── Candidate Particulars ── */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-extrabold text-sm shadow-xs flex-shrink-0 select-none mt-0.5">
                      AS
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-bold text-slate-900 text-sm leading-tight">Aarav Sharma</p>
                      <p className="text-[11px] text-slate-500 leading-tight">B.E. Computer Science and Engineering</p>
                      {/* Key-value rows — no collision */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">Reg. No.</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold tracking-wide">713520104088</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">Batch</span>
                        <span className="text-[10px] text-slate-600 font-semibold">2020 – 2024</span>
                      </div>
                    </div>
                    {/* Verified badge — top-right of row */}
                    <div className="inline-flex items-center gap-1 bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      Verified
                    </div>
                  </div>
                </div>

                {/* ── Docket & QR Block ── */}
                <div className="px-5 pt-3.5 pb-4 flex items-start gap-4">
                  {/* Left: Docket info + institution row */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Docket Reference</p>
                    <p className="font-mono text-sm font-bold text-slate-900 leading-tight">BGV-2026-SIET89</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">SHA-256 Validated • Office of COE</p>

                    <div className="mt-3 flex items-center gap-2 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg px-3 py-2 transition-colors group cursor-pointer">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">SIET — B.E. (CSE)</p>
                        <p className="text-[9px] text-slate-400">Official Institutional Record</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </div>

                  {/* QR Code — GPU-accelerated Laser Sweep + Click-to-Decode */}
                  <div
                    onClick={() => setShowQrDecoded(true)}
                    onKeyDown={(e) => e.key === 'Enter' && setShowQrDecoded(true)}
                    role="button"
                    tabIndex={0}
                    title="Click to inspect cryptographic signature"
                    aria-label="Open cryptographic verification ledger"
                    className="relative group p-2 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-emerald-500 hover:shadow-emerald-500/20 hover:shadow-md transition-all cursor-pointer overflow-hidden shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {/* Scoped keyframe — translateY on GPU compositor layer, no Tailwind config dependency */}
                    <style>{`
                      @keyframes qrLaserScanMove {
                        0%   { transform: translateY(0px);   opacity: 0.85; }
                        50%  { transform: translateY(54px);  opacity: 1;    }
                        100% { transform: translateY(0px);   opacity: 0.85; }
                      }
                      .qr-laser-scanner {
                        animation: qrLaserScanMove 2.2s ease-in-out infinite;
                        will-change: transform;
                      }
                    `}</style>

                    {/* Dense 25×25 SVG QR */}
                    <svg
                      className="w-14 h-14 text-slate-900 block"
                      viewBox="0 0 25 25"
                      shapeRendering="crispEdges"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M0 0h7v7H0z M1 1v5h5V1z M2 2h3v3H2z" />
                      <path d="M18 0h7v7h-7z M19 1v5h5V1z M20 2h3v3h-3z" />
                      <path d="M0 18h7v7H0z M1 19v5h5v-5z M2 20h3v3H2z" />
                      <path d="M8 6h1v1H8z M10 6h1v1H10z M12 6h1v1H12z M14 6h1v1H14z M16 6h1v1H16z" />
                      <path d="M6 8h1v1H6z M6 10h1v1H6z M6 12h1v1H6z M6 14h1v1H6z M6 16h1v1H6z" />
                      <path d="M16 16h5v5h-5z M17 17v3h3v-3z M18 18h1v1h-1z" />
                      <path d="M8 1h1v2H8z M10 0h2v1h-2z M13 1h1v1h-1z M15 0h2v2h-2z M10 2h1v2h-1z M12 3h3v1h-3z M16 3h1v2h-1z M8 4h2v2H8z M11 5h1v1h-1z M14 4h2v2h-2z" />
                      <path d="M8 8h2v1H8z M11 7h1v2h-1z M13 8h2v1h-2z M16 7h1v2h-1z M8 10h1v3H8z M10 11h2v1h-2z M13 10h2v2h-2z M16 10h1v1h-1z M9 13h3v1H9z M13 13h1v2h-1z M15 12h2v2h-2z M8 15h2v1H8z M11 15h1v2h-1z M14 15h2v1h-2z" />
                      <path d="M8 17h1v2H8z M10 18h2v1h-2z M8 20h2v1H8z M11 21h1v3h-1z M8 22h1v2H8z M10 23h1v2h-1z M13 23h2v1h-2z M13 20h1v2h-1z M15 22h1v1h-1z" />
                      <path d="M22 8h2v2h-2z M18 9h3v1h-3z M21 11h3v1h-3z M18 12h2v2h-2z M21 13h1v2h-1z M23 14h2v1h-2z M22 17h3v1h-3z M23 19h2v2h-2z M22 22h2v1h-2z M23 24h2v1h-2z M17 22h1v2h-1z M19 23h2v2h-2z" />
                    </svg>

                    {/* Focused laser line + soft optical glow trail — GPU-animated */}
                    <div className="absolute top-2 inset-x-2 pointer-events-none z-10 qr-laser-scanner">
                      <div className="h-[2px] w-full bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981,0_0_4px_#34d399]" />
                      <div className="h-2 w-full bg-gradient-to-b from-emerald-500/25 to-transparent" style={{ filter: 'blur(0.5px)' }} />
                    </div>

                    <span className="block text-[8px] text-center font-mono font-bold text-slate-500 mt-1 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
                      Scan QR
                    </span>
                  </div>


                </div>

                {/* ── Card Footer ── */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Official Institutional Record</span>
                  </div>
                  <button
                    type="button"
                    className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold transition-colors group"
                    tabIndex={-1}
                  >
                    Cryptographic Hash{' '}
                    <ArrowRight className="inline w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            </div>
            {/* Right margin intentionally left open — campus photo shows through gradient */}

          </div>
        </div>
      </section>



      {/* ── 2. HOW VERIFICATION WORKS SECTION ───────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-white scroll-mt-16">
        <div className="section-container">
          
          {/* Section Header with Horizontal Accent Lines */}
          <div className="text-center mb-14 sm:mb-16">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
              <span className="w-8 sm:w-12 h-1 bg-yellow-400 rounded-full" aria-hidden="true" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How Verification Works
              </h2>
              <span className="w-8 sm:w-12 h-1 bg-yellow-400 rounded-full" aria-hidden="true" />
            </div>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              A straightforward, secure process to verify a student&apos;s academic background.
            </p>
          </div>

          {/* 3-Column by 2-Row Grid for the 6 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Step 01: Request Details */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    01
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <FileSearch className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Request Details
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Provide the necessary academic information, such as institution and student details.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 02: Email Verification */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    02
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Email Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A verification code is sent to your official email address for secure access.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 03: Candidate Details */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    03
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Candidate Details
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter the candidate&apos;s name, register number, course, year, and other relevant details.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 04: Fee Payment */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    04
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Fee Payment
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Complete the secure payment process to initiate the verification request.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 05: Interfacing Verification */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    05
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Interfacing Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Details are verified with the issuing institution and recorded in our system after successful validation.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 06: Official Report */}
            <div 
              onClick={() => navigate(ROUTES.REQUESTER)}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-emerald-600/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(ROUTES.REQUESTER); }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 group-hover:bg-[#0B6A3E] text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs transition-colors">
                    06
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <FilePlus className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 mb-2 transition-colors">
                  Official Report
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get the official verification report with authentic details and verification status.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Start Step</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ── 3. SECURITY & TRUST SECTION ─────────────────────────────────────── */}
      <section className="py-20 bg-[#edf7f0] border-t border-emerald-100/80">
        <div className="section-container">
          
          {/* Section Header with Large Circular Shield Icon */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-12 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-emerald-900 text-white flex items-center justify-center shadow-md border-4 border-emerald-200 flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Security &amp; Trust
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                This portal is an official and secure service. Your data and verification records are handled responsibly.
              </p>
            </div>
          </div>

          {/* 4-Column Grid for Security & Trust Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Official Source */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-emerald-100/60 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center mb-5 shadow-xs">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Official Source
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All verifications are done directly with the issuing institution and trusted academic databases.
              </p>
            </div>

            {/* Card 2: Verified via Email Delivery */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-emerald-100/60 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center mb-5 shadow-xs">
                <Mail className="w-5 h-5 text-slate-950" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Verified via Email Delivery
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Reports and updates are sent only to official email addresses to ensure security and authenticity.
              </p>
            </div>

            {/* Card 3: Data Privacy */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-emerald-100/60 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center mb-5 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Data Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your personal information is protected with industry-standard security measures and never shared without consent.
              </p>
            </div>

            {/* Card 4: Unbiased, Transparent */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-emerald-100/60 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center mb-5 shadow-xs">
                <FileText className="w-5 h-5 text-slate-950" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Unbiased, Transparent
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our verification process follows strict standards to ensure fairness, accuracy and complete transparency.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── VERIFICATION DECODED OVERLAY ─────────────────────────────────────── */}
      {showQrDecoded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowQrDecoded(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#042414] to-[#0a3d21] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-white uppercase tracking-widest leading-tight">Verification Decoded</p>
                  <p className="text-[9px] text-emerald-300/80 mt-0.5">Cryptographic Ledger Block — SIET COE</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrDecoded(false)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Hash Block */}
            <div className="px-5 pt-4 pb-3 bg-slate-950 font-mono">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">SHA-256 Digest</p>
              <p className="text-[10px] text-emerald-400 break-all leading-relaxed">
                3a9f4c2e81b7d056a3e2f1c4b8d9e7f0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e
              </p>
              <div className="mt-2 flex items-center gap-3 text-[9px]">
                <span className="text-slate-500">Block ID</span>
                <span className="text-yellow-400 font-bold">AU-LDG-2026-00841</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">Anna University Ledger</span>
              </div>
            </div>

            {/* Candidate Particulars */}
            <div className="px-5 pt-3.5 pb-3 border-b border-slate-100 space-y-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Candidate Particulars</p>
              {[
                ['Name',       'Aarav Sharma'],
                ['Reg. No.',   '713520104088'],
                ['Programme',  'B.E. Computer Science and Engineering'],
                ['Institution','Sri Shakthi Institute of Engineering and Technology'],
                ['Batch',      '2020 – 2024'],
                ['Status',     'VERIFIED'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 text-[10px]">
                  <span className="text-slate-400 font-medium shrink-0 w-20">{label}</span>
                  <span className={`font-semibold text-right leading-tight ${label === 'Status' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer stamp */}
            <div className="px-5 py-3 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                On-Chain Verified · Office of COE, SIET
              </div>
              <button
                type="button"
                onClick={() => setShowQrDecoded(false)}
                className="text-[10px] text-slate-400 hover:text-emerald-800 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
}


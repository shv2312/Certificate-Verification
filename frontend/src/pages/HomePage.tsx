import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  ArrowRight, 
  GraduationCap, 
  User, 
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
  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#042414] via-[#083b20] to-[#0d522e] text-white pt-14 pb-20 lg:pt-20 lg:pb-28">
        
        {/* Campus Building Architectural Background Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden" 
          aria-hidden="true"
        >
          {/* SIET Building photo positioned on the right half with smooth gradient blend */}
          <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full opacity-25 lg:opacity-30 mix-blend-luminosity">
            <img 
              src="/image_46c159.jpg" 
              alt="Sri Shakthi Institute of Engineering and Technology (SIET) Campus" 
              className="w-full h-full object-cover object-right"
            />
          </div>

          {/* Deep green gradient fades to ensure seamless integration */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042414] via-[#083b20]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042414] via-transparent to-transparent" />
        </div>

        {/* Refined Yellow Diagonal Accents */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden z-[1]" 
          aria-hidden="true"
        >
          {/* Subtle angled highlight framing the building */}
          <div className="absolute -top-[50%] right-[10%] lg:right-[20%] w-64 lg:w-96 h-[200%] bg-gradient-to-r from-yellow-400/10 via-yellow-400/5 to-transparent rotate-[30deg] transform-gpu mix-blend-overlay blur-md" />
          
          {/* Sharp, thin accent line */}
          <div className="absolute -top-[50%] right-[25%] lg:right-[28%] w-1 sm:w-[3px] h-[200%] bg-yellow-400/40 rotate-[30deg] transform-gpu shadow-[0_0_15px_rgba(250,204,21,0.2)]" />

          {/* Bottom-right corner geometric yellow cutoff */}
          <div className="absolute -bottom-24 -right-16 w-64 sm:w-80 h-40 bg-yellow-400 rotate-[-15deg] transform-gpu shadow-2xl" />
        </div>

        {/* Hero Content Container */}
        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading, Subheading & CTAs (7 cols on lg) */}
            <div className="lg:col-span-7 text-center lg:text-left">
              
              {/* Top Security Pill Badge */}
              <div className="inline-flex items-center gap-2 bg-[#06331c]/90 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-md shadow-inner">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Secure</span>
                <span className="text-yellow-400 font-bold">•</span>
                <span>Reliable</span>
                <span className="text-yellow-400 font-bold">•</span>
                <span>Official</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                Academic<br />
                Background<br />
                <span className="text-yellow-400">Verification Portal</span>
              </h1>

              {/* Subheading */}
              <p className="text-emerald-100/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                Check your credentials and verify academic records for a safer, more trusted tomorrow.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                {/* Primary CTA: Solid Yellow button */}
                <Link
                  to={ROUTES.REQUESTER}
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base w-full sm:w-auto group active:scale-[0.98]"
                >
                  <Search className="w-5 h-5 text-slate-950" />
                  <span>Start Verification</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary CTA: Transparent / Outlined button */}
                <Link
                  to={ROUTES.STATUS}
                  className="bg-transparent hover:bg-white/10 text-white font-semibold border-2 border-white/50 hover:border-white px-6 py-3.5 rounded-full transition-all flex items-center justify-center gap-2.5 text-base w-full sm:w-auto active:scale-[0.98] backdrop-blur-xs"
                >
                  <QrCode className="w-5 h-5 text-yellow-400" />
                  <span>Verify via QR / Share Code</span>
                </Link>
              </div>

              {/* Bottom Hero Trust Indicator */}
              <div className="mt-8 flex items-start gap-2.5 justify-center lg:justify-start text-xs text-emerald-200/90">
                <ShieldCheck className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-emerald-100">
                    Trusted by educational institutions and employers
                  </p>
                  <p className="text-emerald-300/80 mt-0.5">
                    Secure &nbsp;•&nbsp; Fast &nbsp;•&nbsp; Accurate
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Floating UI Mockup Card (5 cols on lg) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/20 text-slate-800 transition-all duration-300 hover:scale-[1.01]">
                
                {/* Mockup Header: 3 colored dots & Verification Portal pill */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>VERIFICATION PORTAL</span>
                  </div>
                </div>

                {/* Candidate Avatar & Skeleton Bars & Verified Pill */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="h-3.5 w-28 sm:w-36 bg-slate-200 rounded animate-pulse mb-2" />
                      <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Yellow Verified Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-950 px-3 py-1 rounded-full text-xs font-bold shadow-xs flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Verified</span>
                  </div>
                </div>

                {/* Skeleton dividing placeholder lines */}
                <div className="space-y-2 mb-6">
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                  <div className="h-2 w-4/5 bg-slate-100 rounded-full" />
                </div>

                {/* Verified Institution Record Card */}
                <div className="bg-slate-50/90 hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-300 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        Sri Shakthi Institute of Engineering and Technology - B.E. (CSE)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Academic Records &nbsp;•&nbsp; 2020 – 2024
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

              </div>
            </div>

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
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    01
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                    <FileSearch className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Request Details
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Provide the necessary academic information, such as institution and student details.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 02: Email Verification */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    02
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Email Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A verification code is sent to your official email address for secure access.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 03: Candidate Details */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    03
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Candidate Details
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter the candidate&apos;s name, register number, course, year, and other relevant details.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 04: Fee Payment */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    04
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Fee Payment
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Complete the secure payment process to initiate the verification request.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 05: Interfacing Verification */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    05
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Interfacing Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Details are verified with the issuing institution and recorded in our system after successful validation.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Step 06: Official Report */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
                    06
                  </div>
                  <div className="w-11 h-11 rounded-full bg-yellow-50 text-amber-800 border border-yellow-100 flex items-center justify-center">
                    <FilePlus className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Official Report
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get the official verification report with authentic details and verification status.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
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

    </div>
  );
}


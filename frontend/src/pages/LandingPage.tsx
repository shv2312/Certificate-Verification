/**
 * LandingPage — Public home page for the SIET Academic Verification Portal.
 *
 * Information hierarchy (as per Sprint 1 spec):
 *  1. Institutional identity / hero
 *  2. Clear explanation of the service
 *  3. Start Verification CTA
 *  4. How the verification process works
 *  5. Security and trust information
 *
 * Design notes:
 *  - Uses the SIET institutional navy as the hero background.
 *  - No fake statistics, testimonials, or government/blockchain claims.
 *  - All claims are factually accurate based on the approved workflow.
 *  - Animations are subtle and purposeful.
 */

import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import { ROUTES } from '../utils/routes';

// ── How It Works steps data ───────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Company Registration',
    description:
      'Provide your company name and official HR email address to initiate a verification request.',
  },
  {
    step: '02',
    title: 'Email Verification',
    description:
      'A verification link is sent to your HR email. Confirm your identity before proceeding.',
  },
  {
    step: '03',
    title: 'Secure Payment',
    description:
      'Complete a one-time payment. Each payment authorises verification of one candidate only.',
  },
  {
    step: '04',
    title: 'Submit Candidate Details',
    description:
      'Enter the candidate\'s name, register number, course, branch, and year of passing.',
  },
  {
    step: '05',
    title: 'Instant Verification',
    description:
      'Details are matched against the official SIET institutional database in real time.',
  },
  {
    step: '06',
    title: 'Receive Official Report',
    description:
      'A detailed verification report is generated and delivered to your verified HR email.',
  },
];

// ── Trust indicators ──────────────────────────────────────────────────────────

const TRUST_POINTS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Official Source',
    description:
      'All verification results are sourced directly from the official SIET institutional database. No third-party data is used.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Verified HR Email Delivery',
    description:
      'Verification reports are sent exclusively to the HR email that was verified at the beginning of the request. No exceptions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Data Privacy',
    description:
      'Candidate information submitted for verification is processed securely and is not stored beyond the verification transaction.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Unique Request ID',
    description:
      'Every verification request receives a unique ID that can be used to track and reference the verification outcome.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="bg-siet-navy text-white"
      >
        <div className="section-container py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            {/* Institutional badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span
                className="inline-block w-1 h-5 bg-siet-sky rounded-full"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                Sri Shakthi Institute of Engineering and Technology
              </span>
            </div>

            {/* Main heading */}
            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5"
            >
              Academic Background{' '}
              <span className="text-blue-300">Verification</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-blue-200 leading-relaxed mb-8 max-w-2xl">
              Securely verify academic credentials issued by Sri Shakthi
              Institute of Engineering and Technology. An official service
              for HR professionals and companies.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={ROUTES.COMPANY}
                id="cta-start-verification"
                className="btn-primary text-base px-8 py-3.5"
              >
                Start Verification
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2
                           bg-transparent text-white font-semibold
                           px-6 py-3.5 rounded
                           border border-blue-600
                           transition-all duration-200
                           hover:bg-blue-900 hover:border-blue-400
                           focus-visible:ring-2 focus-visible:ring-blue-300
                           focus-visible:ring-offset-2 focus-visible:ring-offset-siet-navy
                           text-base"
              >
                How It Works
              </a>
            </div>

            {/* Important note */}
            <p className="mt-6 text-sm text-blue-400">
              <span className="font-medium text-blue-300">Important:</span>{' '}
              One payment authorises verification of one candidate only.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Page Content ─────────────────────────────────────────── */}
      <PageContainer>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="scroll-mt-20">
          <div className="mb-8">
            <h2
              id="how-it-works-heading"
              className="text-2xl sm:text-3xl font-bold text-siet-navy mb-2"
            >
              How Verification Works
            </h2>
            <p className="text-siet-slate">
              A straightforward six-step process to verify a candidate&apos;s
              academic background.
            </p>
          </div>

          <ol
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-label="Verification process steps"
          >
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="surface-card p-5 flex flex-col gap-3 hover:shadow-card-md
                           transition-shadow duration-200"
              >
                <span
                  className="text-2xl font-bold text-siet-border"
                  aria-hidden="true"
                >
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-siet-navy mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-siet-slate leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="section-divider" />

        {/* ── Trust & Security ─────────────────────────────────────────── */}
        <section aria-labelledby="trust-heading">
          <div className="mb-8">
            <h2
              id="trust-heading"
              className="text-2xl sm:text-3xl font-bold text-siet-navy mb-2"
            >
              Security &amp; Trust
            </h2>
            <p className="text-siet-slate">
              This portal is an official institutional service of SIET.
              Your data and verification results are handled responsibly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRUST_POINTS.map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-4 p-5 surface-card
                           hover:shadow-card-md transition-shadow duration-200"
              >
                <span className="text-siet-sky mt-0.5 flex-shrink-0">
                  {point.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-siet-navy mb-1">
                    {point.title}
                  </h3>
                  <p className="text-sm text-siet-slate leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="bottom-cta-heading"
          className="text-center py-4"
        >
          <h2
            id="bottom-cta-heading"
            className="text-xl sm:text-2xl font-bold text-siet-navy mb-3"
          >
            Ready to Verify a Candidate?
          </h2>
          <p className="text-siet-slate mb-6 max-w-lg mx-auto">
            Provide your company details and proceed through the verification
            workflow. The entire process is straightforward and takes only
            a few minutes.
          </p>
          <Link
            to={ROUTES.COMPANY}
            id="cta-start-verification-bottom"
            className="btn-primary text-base px-8 py-3.5"
          >
            Start Verification
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </section>

      </PageContainer>
    </>
  );
}

/**
 * HelpPage — FAQ and Support information for the SIET Verification Portal.
 */

import PageContainer from '../components/PageContainer';
import { ROUTES } from '../utils/routes';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'How do I start a verification request?',
    answer: 'Navigate to the "Verify" page and provide your company name and official HR email address. You will receive a 6-digit OTP code to verify your email address.',
  },
  {
    question: 'How does the email OTP work?',
    answer: 'To ensure only authorized HR personnel can request verifications, an OTP (One-Time Password) is sent to your official email. Enter this 6-digit code on the verification screen to authenticate your session.',
  },
  {
    question: 'How does payment work?',
    answer: 'A one-time payment is required per verification. Important: One payment authorises the verification of ONE candidate only. Bulk verifications require separate requests.',
  },
  {
    question: 'How do I submit candidate details?',
    answer: 'After successful payment authorization, you will be prompted to enter the candidate\'s name, register number, course, branch, and year of passing. Ensure these match the candidate\'s documents exactly.',
  },
  {
    question: 'How can I track my verification status?',
    answer: 'Every request generates a unique Request ID. You can use the "Track Verification" page to check the current status (e.g., PENDING, IN_PROGRESS, VERIFIED, NOT_VERIFIED).',
  },
  {
    question: 'What happens if a candidate\'s record is not found or mismatches?',
    answer: 'If the submitted details do not match the official SIET database, the status will show as "NOT_VERIFIED" or "ERROR". In such cases, official reports will not include student data to protect privacy. Please double-check the provided details and ensure they are accurate.',
  },
];

export default function HelpPage() {
  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-siet-navy mb-4">Help & Support</h1>
          <p className="text-siet-slate text-lg">
            Find answers to common questions about the SIET Academic Background Verification process.
          </p>
        </div>

        <div className="space-y-6">
          {FAQS.map((faq, index) => (
            <div key={index} className="surface-card p-6">
              <h3 className="text-lg font-semibold text-siet-navy mb-3">{faq.question}</h3>
              <p className="text-siet-slate leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 surface-card p-8 text-center bg-blue-50 border border-blue-100">
          <h2 className="text-xl font-bold text-siet-navy mb-3">Still need assistance?</h2>
          <p className="text-siet-slate mb-6">
            If you encounter technical issues or have questions not covered above, please contact the SIET administration.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={ROUTES.STATUS} className="btn-primary">
              Track a Request
            </Link>
            <Link to={ROUTES.COMPANY} className="btn-secondary">
              Start New Verification
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

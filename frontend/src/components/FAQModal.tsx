/**
 * FAQModal — Interactive Command-Menu Decision Tree for FAQs & Support.
 * Strictly click-driven (no search input, forms, or text inputs).
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  HelpCircle,
  Mail,
  FileCheck,
  CreditCard,
  Search,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '../utils/routes';

export interface FAQCategory {
  id: string;
  title: string;
  description: string;
  iconName: 'mail' | 'file-check' | 'credit-card' | 'search';
  questions: {
    id: string;
    question: string;
    answer: string;
    actionRoute?: string;
    actionLabel?: string;
  }[];
}

const FAQ_TREE: FAQCategory[] = [
  {
    id: 'email-auth',
    title: 'Email & Authentication',
    description: 'OTP codes, domain verification, and session login',
    iconName: 'mail',
    questions: [
      {
        id: 'otp-how-it-works',
        question: 'How does the email OTP verification work?',
        answer:
          'A 6-digit One-Time Password (OTP) is dispatched directly to the official HR email address you provide. Entering this code verifies your email ownership and creates a secure session for your verification request.',
        actionRoute: ROUTES.REQUESTER,
        actionLabel: 'Start Verification',
      },
      {
        id: 'otp-not-received',
        question: 'What if I do not receive the 6-digit OTP email?',
        answer:
          'First, check your email spam or junk folder. If you still do not see it after 60 seconds, click the "Resend OTP" button on the verification screen to request a fresh code.',
      },
      {
        id: 'domain-requirement',
        question: 'Do I need an official company email address?',
        answer:
          'Yes. To prevent fraudulent background verification requests, only official corporate/HR domain emails are accepted for verification challenges.',
      },
    ],
  },
  {
    id: 'verification-process',
    title: 'Verification Process',
    description: 'Submitting candidate data, certificates, and criteria',
    iconName: 'file-check',
    questions: [
      {
        id: 'start-request',
        question: 'How do I submit candidate details for verification?',
        answer:
          'Navigate to the "Verify" page, complete email authentication, proceed through payment, and fill out the candidate details form (Name, Register Number, Branch, and Year of Passing).',
        actionRoute: ROUTES.REQUESTER,
        actionLabel: 'Go to Verification Form',
      },
      {
        id: 'mismatch-behavior',
        question: 'What happens if candidate records do not match?',
        answer:
          'If submitted candidate details do not match authoritative SIET database records, the status is set to "NOT_VERIFIED". To protect student privacy, unverified reports contain neutral status indications only without exposing database records.',
      },
      {
        id: 'document-upload',
        question: 'Is uploading a physical certificate mandatory?',
        answer:
          'No, uploading a scanned certificate copy is optional. Primary verification is conducted strictly against SIET\'s authoritative digital database records.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Licensing',
    description: 'Fee per candidate, gateway support, and receipts',
    iconName: 'credit-card',
    questions: [
      {
        id: 'payment-per-candidate',
        question: 'How does verification payment pricing work?',
        answer:
          'Each payment authorization unlocks the verification of ONE candidate record. A unique payment transaction ID is cryptographically attached to every issued verification report.',
      },
      {
        id: 'bulk-verification',
        question: 'Can I submit multiple candidates in a single payment?',
        answer:
          'No. Each candidate requires a distinct payment transaction and session to guarantee individual cryptographic report verification and auditability.',
      },
      {
        id: 'payment-modes',
        question: 'What payment methods are supported?',
        answer:
          'Our gateway supports major Credit/Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and Corporate Cards via Razorpay.',
      },
    ],
  },
  {
    id: 'tracking-reports',
    title: 'Tracking & Reports',
    description: 'Request IDs, status checking, and QR validation',
    iconName: 'search',
    questions: [
      {
        id: 'track-status',
        question: 'How can I track the status of my verification?',
        answer:
          'Each submission generates a unique 12-character Request ID. Visit the "Track Status" page and enter your Request ID or verification code to check real-time progress.',
        actionRoute: ROUTES.STATUS,
        actionLabel: 'Track Verification Status',
      },
      {
        id: 'qr-verification',
        question: 'How do employers verify official report PDF validity?',
        answer:
          'Official SIET verification reports feature a secure QR code. Scanning the QR code directs directly to SIET\'s public verification engine to validate report authenticity.',
      },
    ],
  },
];

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close when clicking outside the floating drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Slight delay so the opening click itself doesn't immediately trigger close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset decision tree on modal close
  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedQuestionId(null);
    onClose();
  };

  if (!isOpen) return null;

  const renderIcon = (name: FAQCategory['iconName']) => {
    switch (name) {
      case 'mail':
        return <Mail className="w-4 h-4 text-emerald-700" />;
      case 'file-check':
        return <FileCheck className="w-4 h-4 text-emerald-700" />;
      case 'credit-card':
        return <CreditCard className="w-4 h-4 text-emerald-700" />;
      case 'search':
        return <Search className="w-4 h-4 text-emerald-700" />;
    }
  };

  const selectedQuestion = selectedCategory?.questions.find(
    (q) => q.id === selectedQuestionId
  );

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-22 sm:bottom-24 right-4 sm:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[580px] rounded-2xl shadow-2xl border border-slate-200/90 bg-white flex flex-col overflow-hidden animate-slide-up"
      role="dialog"
      aria-modal="false"
      aria-labelledby="faq-modal-title"
    >
      {/* Widget Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-yellow-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 id="faq-modal-title" className="text-sm font-bold text-white leading-tight">
              Help &amp; Decision Tree
            </h2>
            <p className="text-[11px] text-slate-400 truncate max-w-[210px]">
              {selectedCategory
                ? `Topic: ${selectedCategory.title}`
                : 'Interactive FAQ & Guidance'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close help widget"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

        {/* Navigation Breadcrumb / Top Control */}
        {selectedCategory && (
          <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                if (selectedQuestionId) {
                  setSelectedQuestionId(null);
                } else {
                  setSelectedCategory(null);
                }
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{selectedQuestionId ? 'Back to Questions' : 'Back to All Topics'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedQuestionId(null);
              }}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset View</span>
            </button>
          </div>
        )}

        {/* Widget Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {/* VIEW 1: Categories List */}
          {!selectedCategory && (
            <div className="grid grid-cols-1 gap-2.5">
              {FAQ_TREE.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/50 hover:shadow-xs text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100/80 group-hover:bg-emerald-200/80 transition-colors">
                        {renderIcon(category.iconName)}
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {category.questions.length} Questions
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-900 transition-colors mb-0.5">
                      {category.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center text-xs font-semibold text-emerald-800 group-hover:translate-x-1 transition-transform">
                    <span>Explore questions</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* VIEW 2: Questions List in Selected Category */}
          {selectedCategory && !selectedQuestionId && (
            <div className="space-y-2">
              <div className="mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select a Question:
                </span>
              </div>
              {selectedCategory.questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuestionId(q.id)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between group shadow-2xs"
                >
                  <span className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-950 transition-colors pr-3 leading-snug">
                    {q.question}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* VIEW 3: Answer Display */}
          {selectedCategory && selectedQuestion && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <h3 className="font-bold text-sm text-emerald-950 mb-1.5 leading-snug">
                  {selectedQuestion.question}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedQuestion.answer}
                </p>
              </div>

              {/* Action Suggestion inside Answer */}
              {selectedQuestion.actionRoute && (
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Ready to proceed with this step?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigate(selectedQuestion.actionRoute!);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#0B6A3E] hover:bg-[#074828] text-white font-semibold px-3 py-2 rounded-lg transition-colors text-xs"
                  >
                    <span>{selectedQuestion.actionLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Widget Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>SIET Portal FAQ Assistant</span>
          <button
            type="button"
            onClick={handleClose}
            className="font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
    </div>
  );
}

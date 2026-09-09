import WorkflowLayout from '../components/WorkflowLayout';

export default function PaymentPage() {
  return (
    <WorkflowLayout
      stepIndex={2}
      title="Payment"
      description="One payment authorises one candidate verification."
      narrowContent={true}
    >
      {/* Payment details block */}
      <div className="surface-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
            <span className="text-sm font-medium text-siet-slate">Payment Status:</span>
            <span className="text-sm font-semibold text-siet-amber sm:col-span-2">Payment gateway configuration pending SIET approval.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
            <span className="text-sm font-medium text-siet-slate">Provider:</span>
            <span className="text-sm font-medium text-siet-navy sm:col-span-2">Provider to be confirmed by SIET.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-4">
            <span className="text-sm font-medium text-siet-slate">Amount:</span>
            <span className="text-sm font-medium text-siet-navy sm:col-span-2">To be confirmed by SIET.</span>
          </div>
        </div>

        {/* Demo QR Box */}
        <div className="bg-siet-silver rounded p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-48 h-48 bg-white border-2 border-dashed border-siet-muted rounded flex items-center justify-center relative overflow-hidden p-2 text-center">
             {/* Fake QR pattern using generic SVG shapes to imply QR code without real data */}
             <svg className="absolute inset-0 w-full h-full text-siet-muted opacity-20 pointer-events-none" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
               <path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z M40,10 h20 v10 h-20 z M40,25 h10 v15 h-10 z M55,25 h15 v10 h-15 z M70,40 h20 v15 h-20 z M10,40 h20 v10 h-20 z M10,55 h10 v10 h-10 z M25,55 h10 v10 h-10 z M40,45 h20 v20 h-20 z M45,50 h10 v10 h-10 z M70,70 h10 v10 h-10 z M85,70 h5 v20 h-5 z M70,85 h10 v5 h-10 z M40,70 h20 v20 h-20 z" />
             </svg>
             <span className="relative text-xs font-bold text-siet-slate z-10 leading-snug">SIET Academic Verification Demo Payment - Not for real payment</span>
          </div>
          <p className="text-sm font-medium text-siet-navy text-center">
            Demo QR - Payment gateway pending SIET approval.
          </p>
        </div>

        {/* Safety Note & Action */}
        <div className="space-y-4 pt-2">
          <p className="text-xs text-siet-muted text-center">
            Candidate verification will unlock only after backend-confirmed payment.
          </p>
          <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
            Payment Gateway Pending
          </button>
        </div>
      </div>
    </WorkflowLayout>
  );
}

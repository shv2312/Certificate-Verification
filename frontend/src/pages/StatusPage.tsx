/**
 * StatusPage — Allows HR users to track the status of a verification request.
 *
 * Requirements:
 * - Enter Request ID to fetch status.
 * - Calls `GET /api/v1/verification/{request_id}/status`.
 * - Handles loading, empty history, unknown request, expired session, access denied.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import PageContainer from '../components/PageContainer';
import FormField from '../components/FormField';
import StatusMessage from '../components/StatusMessage';
import { apiClient } from '../api/client';

interface StatusData {
  status: string;
  verification_status?: string;
  backlog_status?: string | null;
  [key: string]: any;
}

interface StatusResponse {
  success: boolean;
  message: string;
  data: StatusData;
}

export default function StatusPage() {
  const [requestId, setRequestId] = useState('');
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!requestId.trim()) {
      setError('Please enter a valid Request ID.');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setStatusData(null);

    try {
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true' && requestId.startsWith('demo-')) {
        // --- EXPLICIT DEVELOPMENT FIXTURES ONLY ---
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        if (requestId === 'demo-error') {
          throw new Error('[MOCK] Verification request not found or access denied.');
        }

        if (requestId === 'demo-success') {
          setStatusData({
            success: true,
            message: '[MOCK] Status retrieved successfully.',
            data: {
              status: 'VERIFIED',
              verification_status: 'VERIFIED',
              backlog_status: 'No Backlog',
            },
          });
        } else if (requestId === 'demo-pending') {
          setStatusData({
            success: true,
            message: '[MOCK] Status retrieved successfully.',
            data: {
              status: 'PENDING',
              verification_status: 'PENDING',
              backlog_status: null,
            },
          });
        } else {
          throw new Error(`[MOCK] Unknown demo fixture ID: ${requestId}`);
        }
      } else {
        // --- PRODUCTION API PATH (Default even in DEV) ---
        const response = await apiClient<StatusResponse>(`/api/v1/verification/${encodeURIComponent(requestId.trim())}/status`, {
          method: 'GET',
        });
        setStatusData(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected network error occurred.');
      setStatusData(null); // Ensure stale data is cleared on failure
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-siet-navy mb-2">Track Verification Status</h1>
        <p className="text-siet-slate text-sm">
          Enter your unique Request ID to track the current progress and outcome of your verification request.
        </p>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <form onSubmit={handleSearch} noValidate className="space-y-5">
          <FormField id="request-id" label="Verification Request ID" required error={error}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="request-id"
                type="text"
                className="form-input flex-1"
                placeholder="e.g. req_abc123"
                value={requestId}
                onChange={(e) => {
                  setRequestId(e.target.value);
                  setError(undefined);
                }}
                disabled={isLoading}
                aria-required="true"
              />
              <button
                type="submit"
                className="btn-primary sm:w-auto w-full whitespace-nowrap"
                disabled={isLoading || !requestId.trim()}
              >
                {isLoading ? 'Searching...' : 'Track Status'}
              </button>
            </div>
          </FormField>
        </form>

        {/* Results Section */}
        {statusData && (
          <div className="mt-8 pt-6 border-t border-siet-border animate-fade-in">
            <h3 className="text-lg font-semibold text-siet-navy mb-4">Verification Result</h3>
            
            <div className="bg-siet-silver rounded p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-3">
                <span className="text-sm font-medium text-siet-slate">Current Status:</span>
                <span className={`text-sm font-bold sm:col-span-2 ${
                  statusData.data.status === 'VERIFIED' ? 'text-siet-success' :
                  statusData.data.status === 'ERROR' || statusData.data.status === 'NOT_VERIFIED' ? 'text-siet-error' :
                  'text-siet-amber'
                }`}>
                  {statusData.data.status}
                </span>
              </div>

              {statusData.data.verification_status && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-siet-border pb-3">
                  <span className="text-sm font-medium text-siet-slate">Verification Outcome:</span>
                  <span className="text-sm font-medium text-siet-navy sm:col-span-2">
                    {statusData.data.verification_status}
                  </span>
                </div>
              )}

              {statusData.data.backlog_status && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4">
                  <span className="text-sm font-medium text-siet-slate">Backlog Status:</span>
                  <span className="text-sm font-medium text-siet-navy sm:col-span-2">
                    {statusData.data.backlog_status}
                  </span>
                </div>
              )}
            </div>

            {statusData.data.status === 'VERIFIED' && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="btn-secondary opacity-50 cursor-not-allowed"
                  disabled
                  title="Report download is currently unavailable."
                  aria-label="Report download is currently unavailable."
                >
                  Download Report
                  <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true' && (
        <StatusMessage
          type="warning"
          title="Development Mode"
          message="Using real backend API. Explicit demo fixtures available: 'demo-success', 'demo-pending', 'demo-error'."
          className="mt-6"
        />
      )}
    </PageContainer>
  );
}

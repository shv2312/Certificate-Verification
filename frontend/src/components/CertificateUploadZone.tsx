/**
 * CertificateUploadZone — Multi-File Roster UX for Academic Certificates.
 *
 * Implements:
 * 1. <input type="file" multiple> for multi-document selection (e.g. Degree, Marksheets, Provisional).
 * 2. Renders all selected files as individual preview cards with formatted size and individual remove (x) button.
 * 3. Shows cumulative quota indicator (up to 15 MB).
 * 4. Displays a visible "+ Add More Files" drop button beneath the list until quota (15 MB) is reached.
 * 5. Handles drag-and-drop and input file change events.
 */

import React, { useRef, useId, useState } from 'react';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const DEFAULT_MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15 MB

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface CertificateUploadZoneProps {
  selectedFiles: File[];
  onFileChange: (newFiles: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  fileError?: string | null;
  error?: string;
  maxTotalSize?: number;
  totalUploadedSize?: number;
  existingUrl?: string | null;
}

export default function CertificateUploadZone({
  selectedFiles,
  onFileChange,
  onRemoveFile,
  fileError,
  error,
  maxTotalSize = DEFAULT_MAX_TOTAL_SIZE,
  totalUploadedSize,
  existingUrl,
}: CertificateUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSize = totalUploadedSize ?? selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const canAddMore = totalSize < maxTotalSize;
  const percentUsed = Math.min(100, Math.round((totalSize / maxTotalSize) * 100));

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const allValid = Array.from(e.dataTransfer.files).every(
        (f) => ACCEPTED_TYPES.includes(f.type) || /\.(pdf|png|jpe?g)$/i.test(f.name)
      );
      if (allValid) {
        onFileChange(e.dataTransfer.files);
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files);
    }
    // Reset input value so the same file can be re-selected if removed
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input with 'multiple' attribute */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
      />

      {/* ── 1. Empty State: Primary Drop Zone ── */}
      {selectedFiles.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Certificate upload drop zone. Drag and drop certificate files or press Enter to browse."
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-9 cursor-pointer transition-all duration-200 select-none
            ${
              isDragging
                ? 'border-brand-green bg-brand-light scale-[1.01]'
                : error || fileError
                ? 'border-red-400 bg-red-50/60'
                : 'border-slate-300 bg-slate-50/70 hover:border-brand-green hover:bg-emerald-50/40'
            }
          `}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-emerald-200 text-brand-green' : 'bg-brand-light text-brand-green'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-brand-forest">
              {isDragging ? 'Drop certificate documents here' : 'Drag & drop certificate documents'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Degree, Provisional Certificate, or Consolidated Marksheet &bull;{' '}
              <span className="text-brand-green font-semibold underline underline-offset-2">browse files</span>
            </p>
            {existingUrl && (
              <p className="text-2xs text-emerald-600 font-medium mt-1">
                (A document is already attached on file. You can select more files to add or replace it.)
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-2xs text-slate-400">
            <span>PDF, PNG, JPG</span>
            <span>&bull;</span>
            <span>Multi-file supported</span>
            <span>&bull;</span>
            <span>Combined max 15 MB</span>
          </div>
        </div>
      )}

      {/* ── 2. Multi-File Roster: List of Cards ── */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-semibold text-brand-forest">
              Attached Documents ({selectedFiles.length})
            </span>
            <span className="font-mono text-2xs text-slate-500">
              {formatBytes(totalSize)} of {formatBytes(maxTotalSize)} ({percentUsed}%)
            </span>
          </div>

          {/* Quota Progress Bar */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentUsed > 90 ? 'bg-red-500' : 'bg-brand-green'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Document cards list */}
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => {
              const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={`${file.name}-${file.size}-${idx}`}
                  className="surface-card flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-100 bg-white shadow-xs hover:border-emerald-300 transition-all duration-150 animate-fade-in"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* File Type Icon */}
                    <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-brand-light text-brand-forest border border-emerald-100">
                      {isPdf ? (
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16zm0-6h4v1.5H8V10z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    {/* File details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <span className="shrink-0 text-3xs font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          Doc #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatBytes(file.size)} &bull; {file.type || 'Document'}
                      </p>
                    </div>
                  </div>

                  {/* Individual File Removal Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title={`Remove ${file.name}`}
                    aria-label={`Remove file ${file.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── 3. Visible "+ Add More Files" Drop Button beneath the list ── */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full py-2.5 px-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150
                ${
                  isDragging
                    ? 'border-brand-green bg-emerald-100 text-brand-green scale-[1.01]'
                    : 'border-emerald-300 bg-brand-light/60 text-brand-forest hover:bg-emerald-100/60 hover:border-brand-green'
                }
              `}
            >
              <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add More Files (e.g. Marksheet, Provisional Certificate)</span>
            </button>
          )}
        </div>
      )}

      {/* ── 4. Error Banners ── */}
      {fileError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium animate-fade-in" role="alert">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{fileError}</span>
        </div>
      )}

      {error && !fileError && (
        <p className="text-xs text-siet-error flex items-center gap-1 font-medium" role="alert">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

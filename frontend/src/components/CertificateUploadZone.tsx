/**
 * CertificateUploadZone — Drag-and-drop certificate uploader.
 *
 * - Accepts PDF, PNG, JPG files up to 5 MB.
 * - Shows thumbnail preview (image) or PDF icon with file name + size.
 * - Uploads to POST /api/v1/verification/upload-certificate.
 * - Exposes `certificate_url` to parent via onUpload callback.
 * - Includes remove/replace functionality.
 */

import { useState, useRef, useCallback, useId } from 'react';
import { uploadCertificate } from '../api/verification';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface CertificateFileMeta {
  name: string;
  size?: number;
  type?: string;
}

interface CertificateUploadZoneProps {
  /** Called with the remote URL and metadata after a successful upload */
  onUpload: (url: string, meta?: CertificateFileMeta) => void;
  /** Called when the file is removed */
  onRemove: () => void;
  /** Current uploaded URL (controlled externally) */
  certificateUrl?: string;
  /** Preserved metadata for uploaded certificate (survives reloads) */
  certificateMeta?: CertificateFileMeta | null;
  error?: string;
}

interface FileState {
  file: File;
  previewUrl?: string; // Only set for images
}

export default function CertificateUploadZone({
  onUpload,
  onRemove,
  certificateUrl,
  certificateMeta,
  error,
}: CertificateUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileState, setFileState] = useState<FileState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError('Only PDF, PNG, and JPG files are accepted.');
        return;
      }
      // Validate size
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`File too large. Maximum allowed size is 5 MB (this file is ${formatBytes(file.size)}).`);
        return;
      }

      setUploadError('');

      // Create image preview if applicable
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      setFileState({ file, previewUrl });
      setIsUploading(true);
      setUploadProgress(10);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 85));
      }, 150);

      try {
        const url = await uploadCertificate(file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        onUpload(url, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } catch (err) {
        clearInterval(progressInterval);
        setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        setFileState(null);
        setUploadProgress(0);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload],
  );

  // ── Drag handlers ─────────────────────────────────────────────────
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
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }
  function handleRemove() {
    if (fileState?.previewUrl) {
      URL.revokeObjectURL(fileState.previewUrl);
    }
    setFileState(null);
    setUploadProgress(0);
    setUploadError('');
    if (inputRef.current) inputRef.current.value = '';
    onRemove();
  }

  const hasUploadedUrl = Boolean(certificateUrl);
  const hasFile = Boolean(fileState || hasUploadedUrl);

  const displayName = fileState?.file.name || certificateMeta?.name || (hasUploadedUrl ? 'Degree_Certificate_Document' : '');
  const displaySize = fileState?.file.size ?? certificateMeta?.size;
  const displayType = fileState?.file.type || certificateMeta?.type || '';
  const isImage = displayType.startsWith('image/') || (certificateUrl ? /\.(png|jpe?g|webp)$/i.test(certificateUrl) : false);
  const displayPreviewUrl = fileState?.previewUrl || (isImage && certificateUrl ? certificateUrl : undefined);

  return (
    <div className="space-y-2">
      <p className="form-label">
        Degree / Provisional Certificate
        <span className="required-star" aria-hidden="true"> *</span>
      </p>

      {/* ── Drop Zone (shown when no file selected) ── */}
      {!hasFile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Certificate upload area. Drag and drop a file or press Enter to browse."
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200 select-none
            ${
              isDragging
                ? 'border-brand-green bg-brand-light scale-[1.01]'
                : error || uploadError
                ? 'border-red-500 bg-red-50'
                : 'border-slate-300 bg-slate-50/60 hover:border-brand-green hover:bg-brand-light/30'
            }
          `}
        >
          {/* Upload icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-emerald-100 text-brand-green' : 'bg-brand-light text-brand-green'
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
              {isDragging ? 'Drop your file here' : 'Drag & drop your certificate'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or{' '}
              <span className="text-brand-green font-semibold underline underline-offset-2">browse files</span>
            </p>
          </div>

          <p className="text-2xs text-slate-400">PDF, PNG, JPG — max 5 MB</p>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={handleInputChange}
            aria-hidden="true"
          />
        </div>
      )}

      {/* ── File Preview Card (shown after file is selected) ── */}
      {hasFile && (
        <div className="surface-card overflow-hidden animate-fade-in border border-emerald-200">
          <div className="flex items-start gap-4 p-4">
            {/* Thumbnail / PDF icon */}
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-brand-light flex items-center justify-center">
              {displayPreviewUrl ? (
                <img
                  src={displayPreviewUrl}
                  alt="Certificate preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16zm0-6h4v1.5H8V10z" />
                </svg>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-forest truncate">{displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {displaySize ? formatBytes(displaySize) : (displayType || 'Uploaded Document')}
              </p>

              {/* Upload progress */}
              {isUploading && (
                <div className="mt-2">
                  <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">Uploading… {uploadProgress}%</p>
                </div>
              )}

              {/* Upload success */}
              {!isUploading && hasUploadedUrl && (
                <span className="badge-success mt-2">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Uploaded successfully
                </span>
              )}
            </div>

            {/* Remove / replace button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="shrink-0 p-1.5 rounded text-siet-muted hover:text-siet-error hover:bg-red-50 transition-colors disabled:opacity-40"
              title="Remove file"
              aria-label="Remove certificate file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Error messages ── */}
      {(error || uploadError) && (
        <p className="text-xs text-siet-error flex items-center gap-1" role="alert">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

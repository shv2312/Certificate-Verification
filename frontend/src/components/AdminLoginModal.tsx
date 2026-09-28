/**
 * AdminLoginModal — Overlay modal for admin authentication.
 *
 * Triggered from the navbar "Admin" button.
 * Calls POST /api/v1/admin/login and, on success, sets the admin role
 * in AuthContext and redirects to /admin.
 *
 * Design: glass-morphism card centered over a dark backdrop,
 * smooth slide-in animation, inline error display.
 */

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminLoginAPIResponse {
  success: boolean;
  message: string;
  data: {
    session_token: string;
    role: string;
  };
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | undefined>();
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const navigate    = useNavigate();

  // Auto-focus username field when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(undefined);
      setUsername('');
      setPassword('');
      setShowPass(false);
      setTimeout(() => usernameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, loading, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const resp = await apiClient<AdminLoginAPIResponse>('/api/v1/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (resp.success && resp.data?.session_token) {
        localStorage.setItem('siet_admin_token', resp.data.session_token);
        window.dispatchEvent(new Event('siet:admin-login-success'));
        onClose();
        navigate('/admin');
      } else {
        setError(resp.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // Strip nested JSON detail if present
      if (msg.includes('Invalid credentials')) {
        setError('Invalid username or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      id="admin-login-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Admin Login"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 22, 55, 0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
        style={{ border: '1px solid rgba(0,71,171,0.12)' }}
      >
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-siet-navy to-siet-sky px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Admin Portal</h2>
              <p className="text-xs text-blue-200 mt-0.5">SIET Verification System</p>
            </div>
            {/* Lock icon */}
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-4">
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-lg text-sm"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="block text-sm font-medium text-siet-navy">
              Username
            </label>
            <input
              ref={usernameRef}
              id="admin-username"
              type="text"
              autoComplete="username"
              className="form-input w-full"
              placeholder="admin"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(undefined); }}
              disabled={loading}
              aria-required="true"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-sm font-medium text-siet-navy">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input w-full pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(undefined); }}
                disabled={loading}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-siet-muted hover:text-siet-slate transition-colors"
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-siet-slate border border-siet-border hover:bg-siet-silver transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="flex-1 btn-primary py-2.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing In…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Close button */}
        <button
          type="button"
          onClick={() => { if (!loading) onClose(); }}
          disabled={loading}
          aria-label="Close admin login modal"
          className="absolute top-3 right-3 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

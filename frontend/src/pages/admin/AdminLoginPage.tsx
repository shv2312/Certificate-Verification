import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ROUTES } from '../../utils/routes';

interface AdminLoginAPIResponse {
  success: boolean;
  message: string;
  data: {
    session_token: string;
    role: string;
  };
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to admin dashboard
    if (localStorage.getItem('siet_admin_token')) {
      navigate('/admin');
    } else {
      usernameRef.current?.focus();
    }
  }, [navigate]);

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
        navigate('/admin');
      } else {
        setError(resp.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (msg.includes('Invalid credentials')) {
        setError('Invalid username or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-[#042414] via-[#083b20] to-[#0d522e] text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center shadow-md">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Institutional Staff Login</h1>
                <p className="text-xs text-emerald-200 mt-0.5">SIET Verification Ledger Authority</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="text-xs text-emerald-200/80 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="px-8 py-8 space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Staff Username
            </label>
            <input
              ref={usernameRef}
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(undefined);
              }}
              disabled={loading}
              className="form-input w-full py-2.5 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(undefined);
                }}
                disabled={loading}
                className="form-input w-full pr-12 py-2.5 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating…
              </span>
            ) : (
              'Sign In to Admin Portal'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

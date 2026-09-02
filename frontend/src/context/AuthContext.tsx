/**
 * AuthContext — Manages the user's authentication and role state.
 *
 * This context is responsible for holding the verified session data.
 * CRITICAL RULE: The `role` ('hr' | 'admin') is determined strictly
 * by the backend response during email verification. The frontend NEVER
 * inspects the email string to guess the role.
 *
 * State is stored in `sessionStorage` so it persists across page reloads
 * within a single tab, but is cleared when the tab is closed. No sensitive
 * session data should be in `localStorage`.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'hr' | 'admin' | null;

interface AuthState {
  role: UserRole;
  requestId: string | null;
  hrEmail: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  setPartialAuth: (requestId: string, hrEmail: string) => void;
  setRole: (role: 'hr' | 'admin') => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'siet_auth_state';

const initialState: AuthState = {
  role: null,
  requestId: null,
  hrEmail: null,
  isAuthenticated: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Rehydrate from sessionStorage on initial load
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [state]);

  /**
   * Used after Step 1 (Company Details) when we have a requestId but are not yet authenticated.
   */
  const setPartialAuth = (requestId: string, hrEmail: string) => {
    setState({
      role: null, // Still null until email is verified
      requestId,
      hrEmail,
      isAuthenticated: false,
    });
    // For mock testing purposes only - see auth.ts
    sessionStorage.setItem('mock_hrEmail', hrEmail);
  };

  /**
   * Used after Step 2 (Email Verification) when the backend confirms the role.
   */
  const setRole = (role: 'hr' | 'admin') => {
    setState((prev) => ({
      ...prev,
      role,
      isAuthenticated: true,
    }));
  };

  /**
   * Clear all auth state (Logout / Reset)
   */
  const clearAuth = () => {
    setState(initialState);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('mock_hrEmail');
  };

  return (
    <AuthContext.Provider value={{ ...state, setPartialAuth, setRole, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

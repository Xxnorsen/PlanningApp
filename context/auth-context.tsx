import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@/types/user';
import { authApi } from '@/services/api/auth';
import { storage, STORAGE_KEYS } from '@/services/storage/local-storage';
import { registerUnauthorizedHandler } from '@/services/api/errors';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Stable-per-session sticker index (0–3). Rotates on login/register and on `rotateSticker()`. */
  sessionSticker: number;
  /** Advance the sticker to a different one (used on pull-to-refresh). */
  rotateSticker: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STICKER_COUNT = 4;

/** Sequential rotation: 0 → 1 → 2 → 3 → 0 … */
function pickNextSticker(prev: number | null): number {
  if (prev == null) return 0;
  return (prev + 1) % STICKER_COUNT;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionSticker, setSessionSticker] = useState(0);

  // Restore session from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        const storedUser = await storage.get<User>(STORAGE_KEYS.USER);
        const storedSticker = await storage.get<number>(STORAGE_KEYS.SESSION_STICKER);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
        if (storedSticker != null) setSessionSticker(storedSticker);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const rotateSticker = useCallback(async () => {
    const prev = await storage.get<number>(STORAGE_KEYS.SESSION_STICKER);
    const next = pickNextSticker(prev);
    await storage.set(STORAGE_KEYS.SESSION_STICKER, next);
    setSessionSticker(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: u, token: t } = await authApi.login({ email, password });
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, t);
      await storage.set(STORAGE_KEYS.USER, u);
      setToken(t);
      setUser(u);
      await rotateSticker();
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [rotateSticker]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: u, token: t } = await authApi.register({ name, email, password });
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, t);
      await storage.set(STORAGE_KEYS.USER, u);
      setToken(t);
      setUser(u);
      await rotateSticker();
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [rotateSticker]);

  const logout = useCallback(async () => {
    await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  }, []);

  // Register once: any 401 from the API → clear session.
  // AuthGate in app/_layout.tsx then redirects to /(auth)/login.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logoutRef.current();
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        sessionSticker,
        rotateSticker,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

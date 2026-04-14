import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/user';
import { authApi } from '@/services/api/auth';
import { storage, STORAGE_KEYS } from '@/services/storage/local-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        const storedUser = await storage.get<User>(STORAGE_KEYS.USER);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setIsLoading(false);
      }
    })();
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
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: u, token: t } = await authApi.register({ name, email, password, username });
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, t);
      await storage.set(STORAGE_KEYS.USER, u);
      setToken(t);
      setUser(u);
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, isLoading, error, login, register, logout, clearError }}
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

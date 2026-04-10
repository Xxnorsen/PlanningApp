import { useState, useCallback } from 'react';
import type { User } from '@/types/user';

// SCRUM-3: Auth state management — replace with Zustand/Context in implementation
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

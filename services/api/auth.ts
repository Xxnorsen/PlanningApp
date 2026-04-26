import { apiClient } from './client';
import type { User, AuthCredentials, RegisterPayload } from '@/types/user';

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: RawUser;
}

interface RawUser {
  id: number | string;
  email: string;
  username?: string;
  full_name?: string;
  name?: string;
  created_at?: string;
}

function normalizeUser(raw: RawUser): User {
  return {
    id: String(raw.id),
    email: raw.email,
    name: raw.full_name ?? raw.name ?? raw.username ?? raw.email.split('@')[0],
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/login — JSON body { email, password } */
  login: async (credentials: AuthCredentials): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    const token = data.access_token;

    // Use user from login response if available, otherwise fetch from /auth/me
    if (data.user) {
      return { user: normalizeUser(data.user), token };
    }

    const { data: rawUser } = await apiClient.get<RawUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { user: normalizeUser(rawUser), token };
  },

  /** POST /auth/register — JSON body { name, email, password } */
  register: async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
    await apiClient.post('/auth/register', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });

    // After register, log in to get a token
    return authApi.login({ email: payload.email, password: payload.password });
  },

  /** GET /auth/me */
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<RawUser>('/auth/me');
    return normalizeUser(data);
  },

  /**
   * Update the current user's profile. The backend route varies between
   * deployments — try a few common shapes so the call works regardless.
   * Throws only if every attempt fails.
   */
  updateProfile: async (updates: { name?: string }): Promise<User> => {
    const body = { name: updates.name, full_name: updates.name };
    const attempts: { method: 'put' | 'patch'; url: string }[] = [
      { method: 'put',   url: '/auth/me' },
      { method: 'patch', url: '/auth/me' },
      { method: 'put',   url: '/users/me' },
      { method: 'patch', url: '/users/me' },
      { method: 'put',   url: '/auth/profile' },
    ];
    let lastErr: unknown;
    for (const a of attempts) {
      try {
        const { data } = await apiClient.request<RawUser>({
          method: a.method,
          url: a.url,
          data: body,
        });
        return normalizeUser(data);
      } catch (e: any) {
        lastErr = e;
        // Only fall through on 404/405 (route mismatch). Re-throw on auth/network errors.
        const status = e?.status ?? e?.response?.status;
        if (status !== 404 && status !== 405) throw e;
      }
    }
    throw lastErr;
  },

  logout: async (): Promise<void> => {
    // Stateless JWT — nothing to call on server
  },
};

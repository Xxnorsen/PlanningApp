import { apiClient } from './client';
import type { User, AuthCredentials, RegisterPayload } from '@/types/user';

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface LoginResponse {
  access_token: string;
  token_type: string;
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
  /** POST /auth/login — returns { user, token } */
  login: async (credentials: AuthCredentials): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    const token = data.access_token;

    // Fetch user profile with the new token
    const { data: rawUser } = await apiClient.get<RawUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { user: normalizeUser(rawUser), token };
  },

  /** POST /auth/register — returns { user, token } */
  register: async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
    await apiClient.post('/auth/register', {
      email: payload.email,
      password: payload.password,
      username: payload.username,
      full_name: payload.name,
    });

    // After register, log in to get a token
    return authApi.login({ email: payload.email, password: payload.password });
  },

  /** GET /auth/me */
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<RawUser>('/auth/me');
    return normalizeUser(data);
  },

  logout: async (): Promise<void> => {
    // Stateless JWT — nothing to call on server
  },
};

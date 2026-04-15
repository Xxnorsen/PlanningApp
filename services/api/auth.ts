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

  logout: async (): Promise<void> => {
    // Stateless JWT — nothing to call on server
  },
};

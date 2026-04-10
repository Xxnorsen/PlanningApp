import type { User, AuthCredentials, RegisterPayload } from '@/types/user';

// SCRUM-3: Auth API integration to be implemented
export const authApi = {
  login: async (credentials: AuthCredentials): Promise<{ user: User; token: string }> => {
    throw new Error('Not implemented');
  },

  register: async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
    throw new Error('Not implemented');
  },

  logout: async (): Promise<void> => {
    throw new Error('Not implemented');
  },

  me: async (): Promise<User> => {
    throw new Error('Not implemented');
  },
};

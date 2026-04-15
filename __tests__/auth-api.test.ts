/**
 * Unit tests for the auth API service.
 * Axios is mocked — no real network calls are made.
 */

jest.mock('../services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import { apiClient } from '../services/api/client';
import { authApi } from '../services/api/auth';

const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('authApi.login', () => {
  it('returns user and token on success', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'test-token-123',
        token_type: 'bearer',
        user: { id: 1, name: 'Alex', email: 'alex@example.com' },
      },
    });

    const result = await authApi.login({ email: 'alex@example.com', password: 'Pass@123' });

    expect(result.token).toBe('test-token-123');
    expect(result.user.email).toBe('alex@example.com');
    expect(result.user.name).toBe('Alex');
  });

  it('sends email and password as JSON', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'token',
        token_type: 'bearer',
        user: { id: 2, name: 'Bob', email: 'bob@example.com' },
      },
    });

    await authApi.login({ email: 'bob@example.com', password: 'Pass@456' });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'bob@example.com',
      password: 'Pass@456',
    });
  });

  it('falls back to /auth/me when user not in login response', async () => {
    mockPost.mockResolvedValueOnce({
      data: { access_token: 'token', token_type: 'bearer' },
    });
    mockGet.mockResolvedValueOnce({
      data: { id: 3, name: 'Carol', email: 'carol@example.com' },
    });

    const result = await authApi.login({ email: 'carol@example.com', password: 'Pass@789' });

    expect(mockGet).toHaveBeenCalledWith('/auth/me', expect.any(Object));
    expect(result.user.name).toBe('Carol');
  });

  it('throws on API error', async () => {
    mockPost.mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(
      authApi.login({ email: 'bad@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });
});

// ── register ──────────────────────────────────────────────────────────────────

describe('authApi.register', () => {
  it('sends name, email, password — no username', async () => {
    mockPost
      .mockResolvedValueOnce({ data: {} }) // register call
      .mockResolvedValueOnce({             // login call
        data: {
          access_token: 'new-token',
          token_type: 'bearer',
          user: { id: 4, name: 'Dana', email: 'dana@example.com' },
        },
      });

    await authApi.register({ name: 'Dana', email: 'dana@example.com', password: 'Pass@000' });

    expect(mockPost).toHaveBeenNthCalledWith(1, '/auth/register', {
      name: 'Dana',
      email: 'dana@example.com',
      password: 'Pass@000',
    });
  });

  it('logs in automatically after registering', async () => {
    mockPost
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: {
          access_token: 'token-xyz',
          token_type: 'bearer',
          user: { id: 5, name: 'Eve', email: 'eve@example.com' },
        },
      });

    const result = await authApi.register({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'Pass@111',
    });

    expect(result.token).toBe('token-xyz');
    expect(result.user.email).toBe('eve@example.com');
  });

  it('throws when registration fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Email already registered'));

    await expect(
      authApi.register({ name: 'Frank', email: 'taken@example.com', password: 'Pass@222' })
    ).rejects.toThrow('Email already registered');
  });
});

// ── normalizeUser edge cases ──────────────────────────────────────────────────

describe('authApi.login — user name normalization', () => {
  it('falls back to email prefix when name fields are absent', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        access_token: 'token',
        token_type: 'bearer',
        user: { id: 6, email: 'ghost@example.com' },
      },
    });

    const result = await authApi.login({ email: 'ghost@example.com', password: 'Pass@333' });

    expect(result.user.name).toBe('ghost');
  });
});

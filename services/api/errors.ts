/**
 * Centralised API error classification + UI alert helpers.
 *
 * The Axios response interceptor (see ./client.ts) wraps every failure in an
 * `ApiError` with one of the codes below so screens can react uniformly.
 */
import { Alert } from 'react-native';
import type { AxiosError } from 'axios';

export type ApiErrorCode =
  | 'NETWORK'       // no internet / server unreachable
  | 'TIMEOUT'       // request timed out
  | 'UNAUTHORIZED'  // HTTP 401
  | 'FORBIDDEN'     // HTTP 403
  | 'NOT_FOUND'     // HTTP 404
  | 'SERVER_ERROR'  // HTTP 5xx
  | 'CLIENT_ERROR'  // other 4xx
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly original?: unknown;

  constructor(message: string, code: ApiErrorCode, status?: number, original?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.original = original;
  }
}

// ── 401 handler registration ────────────────────────────────────────────────

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** AuthContext calls this once on mount to wire up auto-logout on 401. */
export function registerUnauthorizedHandler(fn: UnauthorizedHandler) {
  unauthorizedHandler = fn;
}

export function triggerUnauthorized() {
  if (unauthorizedHandler) unauthorizedHandler();
}

// ── Classification ──────────────────────────────────────────────────────────

export function classifyAxiosError(error: AxiosError): ApiError {
  // No response → network error or timeout
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message ?? '')) {
      return new ApiError('Request timed out. Please try again.', 'TIMEOUT', undefined, error);
    }
    return new ApiError(
      'No internet connection. Please try again.',
      'NETWORK',
      undefined,
      error
    );
  }

  const status = error.response.status;
  const data: any = error.response.data;

  // Extract server-provided message if present
  let serverMsg: string | undefined;
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    serverMsg = detail.map((d: any) => d?.msg ?? String(d)).join(', ');
  } else if (typeof detail === 'string') {
    serverMsg = detail;
  } else if (typeof data?.message === 'string') {
    serverMsg = data.message;
  }

  if (status === 401) {
    return new ApiError(
      serverMsg ?? 'Your session has expired. Please sign in again.',
      'UNAUTHORIZED',
      status,
      error
    );
  }
  if (status === 403) {
    return new ApiError(serverMsg ?? 'You do not have permission for this action.', 'FORBIDDEN', status, error);
  }
  if (status === 404) {
    return new ApiError(serverMsg ?? 'Not found.', 'NOT_FOUND', status, error);
  }
  if (status >= 500) {
    return new ApiError(
      'Something went wrong. Please try again later.',
      'SERVER_ERROR',
      status,
      error
    );
  }
  if (status >= 400) {
    return new ApiError(serverMsg ?? 'Request failed.', 'CLIENT_ERROR', status, error);
  }

  return new ApiError(serverMsg ?? 'Unexpected error.', 'UNKNOWN', status, error);
}

// ── UI helper ───────────────────────────────────────────────────────────────

/**
 * Show the appropriate user-facing alert for an error.
 * Returns true if an alert was shown (so callers can decide whether to also set
 * an inline banner). 401 is handled silently — the auth layer redirects to login.
 */
export function showApiErrorAlert(error: unknown): boolean {
  const err = toApiError(error);

  switch (err.code) {
    case 'NETWORK':
      Alert.alert('No Connection', 'No internet connection. Please try again.');
      return true;
    case 'TIMEOUT':
      Alert.alert('Timed Out', 'The request took too long. Please try again.');
      return true;
    case 'SERVER_ERROR':
      Alert.alert('Server Error', 'Something went wrong. Please try again later.');
      return true;
    case 'UNAUTHORIZED':
      // Silent: auth layer handles redirect
      return false;
    case 'FORBIDDEN':
      Alert.alert('Not Allowed', err.message);
      return true;
    case 'NOT_FOUND':
      Alert.alert('Not Found', err.message);
      return true;
    case 'CLIENT_ERROR':
    case 'UNKNOWN':
    default:
      Alert.alert('Error', err.message);
      return true;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message || 'Unexpected error', 'UNKNOWN', undefined, error);
  }
  return new ApiError('Unexpected error', 'UNKNOWN');
}

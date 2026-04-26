/**
 * Axios client — single instance for all API calls.
 * Automatically attaches the Bearer token from AsyncStorage on every request.
 * Errors are classified and rethrown as `ApiError` (see ./errors.ts).
 */
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/config';
import { STORAGE_KEYS } from '@/services/local-storage';
import { classifyAxiosError, triggerUnauthorized } from './errors';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject auth token ────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    const raw = JSON.parse(token) as string;
    config.headers.Authorization = `Bearer ${raw}`;
  }
  return config;
});

// ── Response interceptor: classify errors ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = classifyAxiosError(error);

    // 401 → fire the auth-registered logout handler (redirect to Login)
    if (apiError.code === 'UNAUTHORIZED') {
      triggerUnauthorized();
    }

    return Promise.reject(apiError);
  }
);
/**
 * Axios client — single instance for all API calls.
 * Automatically attaches the Bearer token from AsyncStorage on every request.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/config';
import { STORAGE_KEYS } from '@/services/storage/local-storage';

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

// ── Response interceptor: normalise errors ───────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    let message: string;

    if (Array.isArray(detail)) {
      // FastAPI validation errors: [{loc, msg, type}, ...]
      message = detail.map((d: any) => d?.msg ?? String(d)).join(', ');
    } else if (typeof detail === 'string') {
      message = detail;
    } else {
      message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong';
    }

    return Promise.reject(new Error(message));
  }
);

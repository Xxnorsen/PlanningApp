import { Platform } from 'react-native';

const BACKEND_URL = 'https://web-production-2f6b.up.railway.app';

export const Config = {
  // On web, use the local Metro proxy (/api/*) to avoid CORS.
  // On native, hit the backend directly.
  API_BASE_URL: Platform.OS === 'web' ? '/api' : BACKEND_URL,
  API_TIMEOUT: 10000,
} as const;

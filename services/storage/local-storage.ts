import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  remove: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
} as const;

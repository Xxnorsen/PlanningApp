import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '@/constants/colors';

export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = '@planningapp/theme';

type ColorMap = { readonly [K in keyof typeof COLORS]: string };

// Dark palette — keeps brand accents (LIME, BACKGROUND purple) but
// swaps the card/surface/text colors so content is readable on dark.
const DARK_COLORS: ColorMap = {
  BACKGROUND: '#10101E',
  ACCENT: '#4A4AE8',
  CIRCLE_LIGHT: '#2A2A6E',
  CIRCLE_LIGHTER: '#7070CC',
  LIME: '#87bd00',
  MINT: '#7FDCCC',
  PINK: '#FF9BCC',
  CARD: '#1C1C2E',
  INPUT_BG: '#2A2A3E',
  INPUT_BORDER: '#3A3A52',
  DARK_TEXT: '#F4F4F8',
  WHITE_TEXT: '#FFFFFF',
  MUTED_ON_DARK: 'rgba(255,255,255,0.60)',
  MUTED_ON_CARD: '#9999BB',
  ICON_COLOR: '#9999EE',
  STRENGTH_EMPTY: '#2A2A3E',
};

interface ThemeContextValue {
  theme: ThemeName;
  colors: ColorMap;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeName) => void;
}



const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark') setThemeState(saved);
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const colors: ColorMap = theme === 'dark' ? DARK_COLORS : COLORS;

  return (
    <ThemeContext.Provider
      value={{ theme, colors, isDark: theme === 'dark', toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

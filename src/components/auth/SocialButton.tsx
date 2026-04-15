import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import { FontFamily } from '../../constants/fonts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const isGoogle = provider === 'google';

  return (
    <TouchableOpacity
      style={[styles.button, isGoogle ? styles.googleButton : styles.appleButton]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isGoogle ? (
        <AntDesign name="google" size={20} color="#4285F4" />
      ) : (
        <Ionicons name="logo-apple" size={20} color={COLORS.DARK_TEXT} />
      )}
      <Text style={styles.label}>{isGoogle ? 'Google' : 'Apple'}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.INPUT_BORDER,
    backgroundColor: COLORS.CARD,
  },

  googleButton: {},

  appleButton: {
    backgroundColor: COLORS.INPUT_BG,
  },

  googleLogo: {
    width: 20,
    height: 20,
  },

  label: {
    fontFamily: FontFamily.BOLD,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
  },
});

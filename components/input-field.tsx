import React, { useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useTheme } from '@/context/theme-context';

// Inject a web-only style tag once so Chrome's autofill yellow/white background
// doesn't override the themed input background. Re-injected when the theme changes
// so the inset shadow color matches the active palette.
function useWebAutofillStyle(bg: string, text: string) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = 'planningapp-autofill-style';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px ${bg} inset !important;
        box-shadow: 0 0 0 1000px ${bg} inset !important;
        -webkit-text-fill-color: ${text} !important;
        caret-color: ${text} !important;
        transition: background-color 5000s ease-in-out 0s;
      }
    `;
  }, [bg, text]);
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  iconName: string;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  rightIcon?: string;
  rightIconColor?: string;
  onRightIconPress?: () => void;
  secureText?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
}

export function InputField({
  label,
  placeholder,
  iconName,
  iconFamily = 'Ionicons',
  rightIcon,
  rightIconColor,
  onRightIconPress,
  secureText = false,
  value,
  onChangeText,
  onBlur,
  keyboardType,
  error,
  hint,
}: InputFieldProps) {
  const hasError = !!error;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resolvedRightIconColor = rightIconColor ?? colors.ICON_COLOR;
  useWebAutofillStyle(colors.INPUT_BG, colors.DARK_TEXT);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, hasError && styles.inputError]}>
        <View style={styles.leftIcon}>
          {iconFamily === 'Ionicons' ? (
            <Ionicons
              name={iconName as any}
              size={18}
              color={hasError ? '#FF4757' : colors.ICON_COLOR}
            />
          ) : (
            <MaterialCommunityIcons
              name={iconName as any}
              size={18}
              color={hasError ? '#FF4757' : colors.ICON_COLOR}
            />
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.MUTED_ON_CARD}
          secureTextEntry={secureText}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType={keyboardType}
        />

        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon as any} size={18} color={resolvedRightIconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={13} color="#FF4757" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <View style={styles.messageRow}>
          <Ionicons name="information-circle-outline" size={13} color={colors.ICON_COLOR} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  wrapper: { marginBottom: 16 },

  label: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: colors.ICON_COLOR,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.INPUT_BORDER,
    height: 56,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#FF4757',
    backgroundColor: '#FFF5F5',
  },

  leftIcon: { marginRight: 12 },

  input: {
    flex: 1,
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: colors.DARK_TEXT,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: '#FF4757',
    flex: 1,
  },
  hintText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: colors.ICON_COLOR,
    flex: 1,
  },
});

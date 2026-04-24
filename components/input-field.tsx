import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';

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
  rightIconColor = COLORS.ICON_COLOR,
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

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, hasError && styles.inputError]}>
        <View style={styles.leftIcon}>
          {iconFamily === 'Ionicons' ? (
            <Ionicons
              name={iconName as any}
              size={18}
              color={hasError ? '#FF4757' : COLORS.ICON_COLOR}
            />
          ) : (
            <MaterialCommunityIcons
              name={iconName as any}
              size={18}
              color={hasError ? '#FF4757' : COLORS.ICON_COLOR}
            />
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.MUTED_ON_CARD}
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
            <Ionicons name={rightIcon as any} size={18} color={rightIconColor} />
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
          <Ionicons name="information-circle-outline" size={13} color={COLORS.ICON_COLOR} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },

  label: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: COLORS.ICON_COLOR,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
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
    color: COLORS.DARK_TEXT,
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
    color: COLORS.ICON_COLOR,
    flex: 1,
  },
});

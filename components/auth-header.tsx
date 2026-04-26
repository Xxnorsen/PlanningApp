import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { HeaderLottie } from '@/components/ui/header-lottie';
import { useTheme } from '@/context/theme-context';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  height: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const { width } = Dimensions.get('window');

export function AuthHeader({
  title,
  subtitle,
  height,
  showBackButton = false,
  onBackPress,
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  const backButtonTop = insets.top + 12;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, { height: height + insets.top }]}>
      <View style={styles.circleLarge} />
      <View style={styles.circleMedium} />
      <View style={styles.circleDotLime} />
      <View style={styles.circlePink} />

      <View style={styles.lottieWrapper}>
        <HeaderLottie />
      </View>

      {showBackButton && (
        <TouchableOpacity
          style={[styles.backButton, { top: backButtonTop }]}
          onPress={onBackPress}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color={colors.LIME} />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.BACKGROUND,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  circleLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.CIRCLE_LIGHT,
    top: -20,
    left: -30,
    opacity: 0.8,
  },
  circleMedium: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.CIRCLE_LIGHTER,
    top: 40,
    right: -10,
    opacity: 0.7,
  },
  circleDotLime: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.LIME,
    top: 60,
    left: width * 0.42,
  },
  circlePink: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PINK,
    bottom: 20,
    right: 30,
    opacity: 0.55,
  },
  lottieWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    zIndex: 1,
  },

  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    zIndex: 1,
  },
  subtitle: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: colors.MUTED_ON_DARK,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FontFamily.BOLD,
    fontSize: 40,
    color: colors.LIME,
    lineHeight: 46,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useTheme } from '@/context/theme-context';

interface Props {
  progress: number;
}

export function CircularProgress({ progress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const size = 80;
  const strokeWidth = 7;
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      />
      {pct > 0 && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.LIME,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      )}
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  pct: {
    fontFamily: FontFamily.BOLD,
    color: colors.WHITE_TEXT,
    fontSize: 18,
  },
});

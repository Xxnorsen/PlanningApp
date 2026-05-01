import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const SettingRow = ({
    icon,
    label,
    onPress,
    danger,
    right,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    danger?: boolean;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#FF4757' : colors.ACCENT} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {right ?? (onPress && !danger
        ? <Ionicons name="chevron-forward" size={16} color={colors.MUTED_ON_CARD} />
        : null)}
    </TouchableOpacity>
  );

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Purple hero ── */}
      <View style={styles.hero}>
        <View style={[styles.circleLarge, NO_POINTER]} />
        <View style={[styles.circleMedium, NO_POINTER]} />
        <View style={[styles.circleDot, NO_POINTER]} />
        <View style={[styles.circlePink, NO_POINTER]} />

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{user?.name ?? '—'}</Text>
        <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>
      </View>

      {/* ── Settings list ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <SectionHeader title="Preferences" />
        <View style={[styles.card, { backgroundColor: colors.CARD }]}>
          <SettingRow
            icon={isDark ? 'moon' : 'moon-outline'}
            label="Dark Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: COLORS.INPUT_BORDER, true: COLORS.LIME }}
                thumbColor={COLORS.DARK_TEXT}
              />
            }
          />
        </View>

        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/(auth)/terms')} />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/(auth)/privacy')} />
          <View style={styles.divider} />
          <SettingRow icon="information-circle-outline" label="Version 1.0.0" />
        </View>

        <SectionHeader title="" />
        <View style={styles.card}>
          <SettingRow icon="log-out-outline" label="Sign Out" danger onPress={handleLogout} />
        </View>

        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const NO_POINTER = { pointerEvents: 'none' as const };

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.BACKGROUND },

  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 36, position: 'relative', overflow: 'hidden' },
  circleLarge: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.CIRCLE_LIGHT,
    top: -30, left: -40, opacity: 0.6,
  },
  circleMedium: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.CIRCLE_LIGHTER,
    top: 20, right: -20, opacity: 0.6,
  },
  circleDot: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.LIME,
    top: 16, right: 60,
  },
  circlePink: {
    position: 'absolute',
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.PINK,
    bottom: 8, left: 24, opacity: 0.55,
  },
  avatarWrap: { position: 'relative', marginBottom: 12, zIndex: 1 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.LIME, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.BOLD, fontSize: 28, color: COLORS.DARK_TEXT },
  heroName: { fontFamily: FontFamily.BOLD, fontSize: 20, color: colors.WHITE_TEXT, marginBottom: 4, zIndex: 1 },
  heroEmail: { fontFamily: FontFamily.REGULAR, fontSize: 13, color: colors.MUTED_ON_DARK, zIndex: 1 },

  scroll: { flex: 1, backgroundColor: colors.INPUT_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  content: { paddingTop: 8, paddingHorizontal: 16 },

  sectionHeader: {
    fontFamily: FontFamily.BOLD, fontSize: 12, color: colors.MUTED_ON_CARD,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  card: { backgroundColor: colors.CARD, borderRadius: 16, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.INPUT_BORDER, marginLeft: 52 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.INPUT_BG, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: '#FFF0F1' },
  rowLabel: { flex: 1, fontFamily: FontFamily.REGULAR, fontSize: 15, color: colors.DARK_TEXT },
  rowLabelDanger: { color: '#FF4757', fontFamily: FontFamily.BOLD },
});

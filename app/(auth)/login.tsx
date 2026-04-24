// Route: /(auth)/login — Sign-in screen for returning users.
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AuthHeader } from '@/components/auth-header';
import { InputField } from '@/components/input-field';
import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { LoadingCat } from '@/components/ui/loading-cat';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
  return '';
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.';
  if (v.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  const handleLogin = async () => {
    setApiError('');
    setTouched({ email: true, password: true });

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    if (eErr || pErr) return;

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      const err = toApiError(e);
      console.error('[Login error]', err.message);
      setApiError(err.message);
      if (err.code === 'NETWORK' || err.code === 'SERVER_ERROR' || err.code === 'TIMEOUT') {
        showApiErrorAlert(err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerWrapper}>
            <AuthHeader title={'WELCOME\nBACK!'} subtitle="Sign in to continue." height={260} />

            <View style={styles.catContainer}>
              {Platform.OS === 'web' ? (
                <Video
                  source={require('@/assets/animations/Le Petit Chat _Cat_ Noir.webm')}
                  style={[styles.catVideo, { mixBlendMode: 'multiply' } as any]}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay
                  isMuted
                />
              ) : (
                <Image
                  source={require('@/assets/animations/Le Petit Chat _Cat_ Noir.gif')}
                  style={styles.catVideo}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.handle} />

            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Enter your details below</Text>

            {apiError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}

            <InputField
              label="Email address"
              placeholder="hello@example.com"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              keyboardType="email-address"
              error={emailError}
              hint={!emailError && !email ? "We'll never share your email." : ''}
            />

            <InputField
              label="Password"
              placeholder="Min. 6 characters"
              iconName="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((v) => !v)}
              secureText={!showPassword}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              error={passwordError}
              hint={!passwordError && !password ? "Use a strong password you'll remember." : ''}
            />

            <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingCat size={40} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Get started</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.DARK_TEXT} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomMuted}>Don&apos;t have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.bottomLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { flexGrow: 1 },

  headerWrapper: { position: 'relative' },
  catContainer: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  catVideo: { width: 160, height: 160 },

  card: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 560,
    zIndex: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.INPUT_BORDER,
    alignSelf: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 28,
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 20,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF4757',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { fontFamily: FontFamily.REGULAR, fontSize: 13, color: '#fff', flex: 1 },

  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: 28 },
  forgotText: { fontFamily: FontFamily.BOLD, fontSize: 13, color: COLORS.BACKGROUND },

  primaryButton: {
    height: 56,
    borderRadius: 30,
    backgroundColor: COLORS.LIME,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 36,
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 17,
    color: COLORS.DARK_TEXT,
    letterSpacing: 0.5,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomMuted: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD },
  bottomLink: { fontFamily: FontFamily.BOLD, fontSize: 14, color: COLORS.BACKGROUND },
});

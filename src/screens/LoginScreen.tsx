/**
 * LoginScreen — New user Sign Up (connected to /auth/register API)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AuthHeader } from '../components/auth/AuthHeader';
import { InputField } from '../components/auth/InputField';
import { COLORS } from '../constants/colors';
import { FontFamily } from '../constants/fonts';
import { useAuth } from '@/context/auth-context';
import { LoadingCat } from '@/components/ui/loading-cat';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateName(v: string) {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}
function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
  return '';
}
function validatePassword(v: string) {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(v)) return 'Add at least one number.';
  if (!/[^a-zA-Z0-9]/.test(v)) return 'Add at least one symbol (!@#$…).';
  return '';
}

// ─── Password rule row ────────────────────────────────────────────────────────

function RuleRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={ruleStyles.row}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={met ? '#4CAF50' : COLORS.MUTED_ON_CARD}
      />
      <Text style={[ruleStyles.text, met && ruleStyles.metText]}>{label}</Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  text: { fontFamily: 'Fredoka_400Regular', fontSize: 12, color: COLORS.MUTED_ON_CARD },
  metText: { color: '#4CAF50' },
});

// ─── Component ───────────────────────────────────────────────────────────────

export function LoginScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [apiError, setApiError] = useState('');

  const [touched, setTouched] = useState({
    name: false, email: false, password: false,
  });

  // Live rule checks for password panel
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  // Strength: 0-4
  const strength = Object.values(rules).filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#FF4757', '#FFA502', '#2ED573', '#4CAF50'];

  // Inline errors (only after touch)
  const nameError = touched.name ? validateName(name) : '';
  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  const touch = (field: keyof typeof touched) =>
    setTouched((p) => ({ ...p, [field]: true }));

  const handleRegister = async () => {
    setApiError('');
    setTouched({ name: true, email: true, password: true });

    if (validateName(name) || validateEmail(email) || validatePassword(password)) return;
    if (!agreed) {
      setApiError('Please agree to the Terms of Service to continue.');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      const err = toApiError(e);
      console.error('[Register error]', err.message);
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
          <AuthHeader
            title={'CREATE\nACCOUNT!'}
            subtitle="Join Dailo today."
            height={220}
            showBackButton
            onBackPress={() => router.back()}
          />

          <View style={styles.card}>
            <View style={styles.handle} />


            <Text style={styles.cardTitle}>Personal info</Text>
            <Text style={styles.cardSubtitle}>Tell us a little about yourself</Text>

            {/* API-level error banner */}
            {apiError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}

            <InputField
              label="Full name"
              placeholder="Alex Rivera"
              iconName="person-outline"
              value={name}
              onChangeText={setName}
              onBlur={() => touch('name')}
              error={nameError}
              hint={!nameError && !name ? 'Enter your first and last name.' : ''}
            />

            <InputField
              label="Email address"
              placeholder="hello@example.com"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              keyboardType="email-address"
              error={emailError}
              hint={!emailError && !email ? "We'll never share your email." : ''}
            />

            <InputField
              label="Create password"
              placeholder="Min. 8 characters"
              iconName="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((v) => !v)}
              secureText={!showPassword}
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch('password')}
              error={passwordError}
            />

            {/* Password rules panel */}
            {password.length > 0 && (
              <View style={styles.rulesPanel}>
                {/* Strength bar */}
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBar}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.seg,
                          { backgroundColor: i < strength ? strengthColors[strength] : COLORS.STRENGTH_EMPTY },
                        ]}
                      />
                    ))}
                  </View>
                  {strength > 0 && (
                    <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>
                      {strengthLabels[strength]}
                    </Text>
                  )}
                </View>

                {/* Rules */}
                <RuleRow met={rules.length} label="At least 8 characters" />
                <RuleRow met={rules.upper} label="One uppercase letter (A–Z)" />
                <RuleRow met={rules.number} label="One number (0–9)" />
                <RuleRow met={rules.special} label="One special character (!@#…)" />
              </View>
            )}

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed((v) => !v)} activeOpacity={0.8}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={12} color={COLORS.DARK_TEXT} />}
              </View>
              <Text style={styles.termsText}>
                {'I agree to the '}
                <Text style={styles.termsLink} onPress={() => router.push('/(auth)/terms')}>Terms of Service</Text>
                {' and '}
                <Text style={styles.termsLink} onPress={() => router.push('/(auth)/privacy')}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Continue button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingCat size={40} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.DARK_TEXT} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomMuted}>Already have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
                <Text style={styles.bottomLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { flexGrow: 1 },

  card: {
    flex: 1, backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -28, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40,
    minHeight: 580,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.INPUT_BORDER, alignSelf: 'center', marginBottom: 24,
  },


  cardTitle: { fontFamily: FontFamily.BOLD, fontSize: 24, color: COLORS.DARK_TEXT, marginBottom: 4 },
  cardSubtitle: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD, marginBottom: 20 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FF4757', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorBannerText: { fontFamily: FontFamily.REGULAR, fontSize: 13, color: '#fff', flex: 1 },

  rulesPanel: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 14,
    padding: 14,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  strengthBar: { flex: 1, flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 5, borderRadius: 3 },
  strengthLabel: { fontFamily: FontFamily.BOLD, fontSize: 11, minWidth: 36 },

  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.INPUT_BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.LIME, borderColor: COLORS.LIME },
  termsText: { flex: 1, fontFamily: FontFamily.REGULAR, fontSize: 13, color: COLORS.MUTED_ON_CARD, lineHeight: 20 },
  termsLink: { fontFamily: FontFamily.BOLD, color: COLORS.BACKGROUND },

  primaryButton: {
    height: 56, borderRadius: 30, backgroundColor: COLORS.LIME,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 28,
    shadowColor: COLORS.BACKGROUND, shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontFamily: FontFamily.BOLD, fontSize: 17, color: COLORS.DARK_TEXT, letterSpacing: 0.5 },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.10)', alignItems: 'center', justifyContent: 'center',
  },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomMuted: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD },
  bottomLink: { fontFamily: FontFamily.BOLD, fontSize: 14, color: COLORS.BACKGROUND },
});

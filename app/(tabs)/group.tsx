import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { apiClient } from '@/services/api/client';

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Helpers declared inside so they close over themed `styles` + `colors`
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

  const [notifications, setNotifications] = useState(true);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Change password modal
  const [pwVisible, setPwVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [currentPwError, setCurrentPwError] = useState('');
  const [newPwError, setNewPwError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');

  // Real-time hints
  const newPwHint = newPw.length > 0 && newPw === currentPw
    ? 'New password must be different from current.' : '';
  const confirmHint = confirmPw.length > 0 && newPw !== confirmPw
    ? 'Passwords do not match.' : '';

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // ── Avatar picker ────────────────────────────────────────────────────────────

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateUser({ avatarUri: result.assets[0].uri });
    }
  };

  const handleAvatarPress = () => {
    if (user?.avatarUri) {
      Alert.alert('Profile Photo', 'What would you like to do?', [
        { text: 'Change Photo', onPress: pickAvatar },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => updateUser({ avatarUri: undefined }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      pickAvatar();
    }
  };

  // ── Save name ────────────────────────────────────────────────────────────────

  const saveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSavingName(true);
    try {
      await updateUser({ name: trimmed });
      setEditVisible(false);
    } finally {
      setSavingName(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────────

  const savePassword = async () => {
    setCurrentPwError(''); setNewPwError(''); setConfirmPwError('');
    let valid = true;
    if (!currentPw) { setCurrentPwError('Enter your current password.'); valid = false; }
    if (newPw.length < 6) { setNewPwError('Must be at least 6 characters.'); valid = false; }
    else if (newPw === currentPw) { setNewPwError('New password must be different from current.'); valid = false; }
    if (newPw !== confirmPw) { setConfirmPwError('Passwords do not match.'); valid = false; }
    if (!valid) return;

    setSavingPw(true);
    try {
      await apiClient.put('/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      setCurrentPwError('Wrong password. Please try again.');
    } finally {
      setSavingPw(false);
    }
  };

  const closePwModal = () => {
    setPwVisible(false);
    setPwSuccess(false);
    setCurrentPwError(''); setNewPwError(''); setConfirmPwError('');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  // ── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };
    // Alert.alert is a no-op on react-native-web — fall back to window.confirm
    // so the user can actually confirm and the sign-out runs.
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
      <StatusBar barStyle="light-content" backgroundColor={colors.BACKGROUND} />
      {/* ── Purple hero ── */}
      <View style={styles.hero}>
        <View style={[styles.circleLarge, NO_POINTER]} />
        <View style={[styles.circleMedium, NO_POINTER]} />
        <View style={[styles.circleDot, NO_POINTER]} />
        <View style={[styles.circlePink, NO_POINTER]} />

        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={styles.avatarWrap}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={14} color={COLORS.DARK_TEXT} />
          </View>
        </TouchableOpacity>
        <Text style={styles.heroName}>{user?.name ?? '—'}</Text>
        <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>
      </View>

      {/* ── Settings list ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => { setEditName(user?.name ?? ''); setEditVisible(true); }} />
          <View style={styles.divider} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => setPwVisible(true)} />
        </View>

        <SectionHeader title="Preferences" />
        <View style={[styles.card, { backgroundColor: colors.CARD }]}>
          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: COLORS.INPUT_BORDER, true: COLORS.LIME }}
                thumbColor={COLORS.DARK_TEXT}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.INPUT_BORDER }]} />
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

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Profile</Text>

            {/* Avatar inside modal */}
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={styles.modalAvatarWrap}>
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.modalAvatarImg} contentFit="cover" />
              ) : (
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color={COLORS.DARK_TEXT} />
              </View>
            </TouchableOpacity>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={pickAvatar} activeOpacity={0.7}>
                <Ionicons name="image-outline" size={16} color={COLORS.BACKGROUND} />
                <Text style={styles.photoActionText}>Change Photo</Text>
              </TouchableOpacity>
              {user?.avatarUri ? (
                <TouchableOpacity
                  style={[styles.photoActionBtn, styles.photoRemoveBtn]}
                  onPress={() => updateUser({ avatarUri: undefined })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4757" />
                  <Text style={[styles.photoActionText, { color: '#FF4757' }]}>Remove Photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={COLORS.MUTED_ON_CARD}
              autoFocus
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={saveName} disabled={savingName} activeOpacity={0.85}>
              {savingName
                ? <ActivityIndicator color={COLORS.DARK_TEXT} />
                : <Text style={styles.primaryBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwVisible} animationType="slide" transparent onRequestClose={closePwModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Password</Text>

            {pwSuccess ? (
              <>
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.bannerText}>Password updated successfully!</Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={closePwModal} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Current Password */}
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, !!currentPwError && styles.inputError]}
                    value={currentPw}
                    onChangeText={(v) => { setCurrentPw(v); setCurrentPwError(''); }}
                    placeholder="Enter current password"
                    placeholderTextColor={COLORS.MUTED_ON_CARD}
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.MUTED_ON_CARD} />
                  </TouchableOpacity>
                </View>
                {currentPwError ? (
                  <View style={styles.fieldHint}>
                    <Ionicons name="alert-circle" size={14} color="#FF4757" />
                    <Text style={styles.fieldHintText}>{currentPwError}</Text>
                  </View>
                ) : null}

                {/* New Password */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, (!!newPwError || !!newPwHint) && styles.inputError]}
                    value={newPw}
                    onChangeText={(v) => { setNewPw(v); setNewPwError(''); }}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.MUTED_ON_CARD}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.MUTED_ON_CARD} />
                  </TouchableOpacity>
                </View>
                {(newPwError || newPwHint) ? (
                  <View style={styles.fieldHint}>
                    <Ionicons name="alert-circle" size={14} color="#FF4757" />
                    <Text style={styles.fieldHintText}>{newPwError || newPwHint}</Text>
                  </View>
                ) : null}

                {/* Confirm Password */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, (!!confirmPwError || !!confirmHint) && styles.inputError]}
                    value={confirmPw}
                    onChangeText={(v) => { setConfirmPw(v); setConfirmPwError(''); }}
                    placeholder="Repeat new password"
                    placeholderTextColor={COLORS.MUTED_ON_CARD}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.MUTED_ON_CARD} />
                  </TouchableOpacity>
                </View>
                {(confirmPwError || confirmHint) ? (
                  <View style={styles.fieldHint}>
                    <Ionicons name="alert-circle" size={14} color="#FF4757" />
                    <Text style={styles.fieldHintText}>{confirmPwError || confirmHint}</Text>
                  </View>
                ) : confirmPw.length > 0 && newPw === confirmPw ? (
                  <View style={styles.fieldHint}>
                    <Ionicons name="checkmark-circle" size={14} color="#2ED573" />
                    <Text style={[styles.fieldHintText, { color: '#2ED573' }]}>Passwords match</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 20 }]}
                  onPress={savePassword}
                  disabled={savingPw}
                  activeOpacity={0.85}
                >
                  {savingPw
                    ? <ActivityIndicator color={COLORS.DARK_TEXT} />
                    : <Text style={styles.primaryBtnText}>Update Password</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={closePwModal} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const NO_POINTER = { pointerEvents: 'none' as const };

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.BACKGROUND },

  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 36, position: 'relative' },
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
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontFamily: FontFamily.BOLD, fontSize: 28, color: COLORS.DARK_TEXT },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.LIME, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.ACCENT,
  },
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

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    backgroundColor: colors.CARD,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.INPUT_BORDER, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontFamily: FontFamily.BOLD, fontSize: 20, color: colors.DARK_TEXT, marginBottom: 20 },

  modalAvatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 8 },
  modalAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.LIME, alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarImg: { width: 72, height: 72, borderRadius: 36 },
  modalAvatarText: { fontFamily: FontFamily.BOLD, fontSize: 24, color: COLORS.DARK_TEXT },
  photoActions: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 },
  photoActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.INPUT_BG, borderWidth: 1, borderColor: colors.INPUT_BORDER,
  },
  photoRemoveBtn: { borderColor: '#FFCDD2', backgroundColor: '#FFF5F5' },
  photoActionText: { fontFamily: FontFamily.BOLD, fontSize: 13, color: colors.ACCENT },

  inputLabel: { fontFamily: FontFamily.BOLD, fontSize: 13, color: colors.ACCENT, marginBottom: 6 },
  input: {
    backgroundColor: colors.INPUT_BG,
    borderRadius: 12, borderWidth: 1, borderColor: colors.INPUT_BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: FontFamily.REGULAR, fontSize: 15, color: colors.DARK_TEXT,
    marginBottom: 16,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn: { position: 'absolute', right: 14, top: 12 },

  primaryBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.LIME,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  primaryBtnText: { fontFamily: FontFamily.BOLD, fontSize: 16, color: COLORS.DARK_TEXT },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontFamily: FontFamily.REGULAR, fontSize: 15, color: colors.MUTED_ON_CARD },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF4757', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.ACCENT, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  bannerText: {
    fontFamily: FontFamily.BOLD, fontSize: 13, color: '#fff', flex: 1,
  },
  inputError: {
    borderColor: '#FF4757', borderWidth: 1.5,
  },
  fieldHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: -10, marginBottom: 4, paddingHorizontal: 4,
  },
  fieldHintText: {
    fontFamily: FontFamily.REGULAR, fontSize: 12, color: '#FF4757', flex: 1,
  },
});

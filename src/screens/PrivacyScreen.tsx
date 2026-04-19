import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { FontFamily } from '../constants/fonts';

const SECTIONS = [
  {
    title: 'What We Collect',
    body: 'We collect your name, email, and the tasks and notes you create. That\'s it.',
  },
  {
    title: 'How We Use It',
    body: 'Your data is used only to run your account and make the app work. We never sell it.',
  },
  {
    title: 'Storage & Security',
    body: 'Your data is stored securely with encryption. We take reasonable steps to keep it safe.',
  },
  {
    title: 'Sharing',
    body: 'We don\'t share your data with third parties except the hosting services needed to run the app.',
  },
  {
    title: 'Your Rights',
    body: 'You can delete your account and all your data at any time from settings, or by emailing us.',
  },
  {
    title: 'Changes',
    body: 'If we update this policy we\'ll notify you in-app or by email before the changes take effect.',
  },
  {
    title: 'Contact',
    body: 'Privacy questions? Email us at privacy@dailo.app.',
  },
];

export function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.WHITE_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: April 2025</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: { fontFamily: FontFamily.BOLD, fontSize: 18, color: COLORS.WHITE_TEXT },
  scroll: { flex: 1, backgroundColor: COLORS.CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  content: { padding: 24, paddingBottom: 48 },
  updated: { fontFamily: FontFamily.REGULAR, fontSize: 12, color: COLORS.MUTED_ON_CARD, marginBottom: 20 },
  section: { marginBottom: 22 },
  sectionTitle: { fontFamily: FontFamily.BOLD, fontSize: 15, color: COLORS.DARK_TEXT, marginBottom: 6 },
  sectionBody: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: COLORS.MUTED_ON_CARD, lineHeight: 22 },
});

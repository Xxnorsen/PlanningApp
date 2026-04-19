import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { FontFamily } from '../constants/fonts';

const SECTIONS = [
  {
    title: 'Using Dailo',
    body: 'By creating an account you agree to use the app responsibly and only for personal planning purposes.',
  },
  {
    title: 'Your Account',
    body: 'Keep your password safe. You are responsible for any activity that happens under your account.',
  },
  {
    title: 'Your Content',
    body: 'Tasks and notes you create belong to you. We only store them to make the app work for you.',
  },
  {
    title: 'Our Content',
    body: 'The app design, name, and code are ours. Please don\'t copy or redistribute them.',
  },
  {
    title: 'No Warranties',
    body: 'Dailo is provided as-is. We do our best, but we can\'t guarantee the app will always be error-free.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms occasionally. We\'ll let you know if anything important changes.',
  },
  {
    title: 'Contact',
    body: 'Questions? Reach us at support@dailo.app.',
  },
];

export function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.WHITE_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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

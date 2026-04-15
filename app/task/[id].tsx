import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { COLORS } from '../../src/constants/colors';
import { FontFamily } from '../../src/constants/fonts';

// SCRUM-5: Task detail / edit UI to be implemented
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.circleLarge} />
        <View style={styles.circleMedium} />
        <View style={styles.circleDot} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={COLORS.DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerBtnSpacer} />
        </View>

        <Text style={styles.heroSubtitle}>Viewing</Text>
        <Text style={styles.heroTitle}>TASK #{id}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.placeholder}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.INPUT_BORDER} />
            <Text style={styles.placeholderText}>Task detail view coming soon.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  hero: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
    paddingBottom: 44,
    position: 'relative',
  },
  circleLarge: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: COLORS.CIRCLE_LIGHT,
    top: -30, left: -40, opacity: 0.6,
  },
  circleMedium: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.CIRCLE_LIGHTER,
    top: 20, right: -20, opacity: 0.6,
  },
  circleDot: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.LIME,
    top: 40, right: '35%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    zIndex: 1,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.LIME,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnSpacer: { width: 38, height: 38 },
  headerTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.WHITE_TEXT,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_DARK,
    marginTop: 12,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 28,
    color: COLORS.LIME,
    letterSpacing: 1,
    marginTop: 2,
    zIndex: 1,
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.INPUT_BORDER,
    alignSelf: 'center', marginBottom: 16,
  },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  placeholder: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  placeholderText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: COLORS.MUTED_ON_CARD,
  },
});

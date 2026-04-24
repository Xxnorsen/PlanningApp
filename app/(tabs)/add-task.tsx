import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LoadingCat } from '@/components/ui/loading-cat';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import { PriorityPicker } from '@/components/priority-picker';
import { CategoryPicker } from '@/components/category-picker';
import type { TaskPriority } from '@/types/task';

export default function AddTaskScreen() {
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const { createTask, isLoading } = useTasks();
  const { fetchAll: fetchCategories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | null>(
    dateParam ? new Date(dateParam + 'T00:00:00') : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const onDaySelect = (day: { dateString: string }) => {
    setDueDate(new Date(day.dateString + 'T00:00:00'));
    setShowPicker(false);
  };

  const toYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        categoryId,
        dueDate: toYmd(dueDate),
      });
      router.back();
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      showApiErrorAlert(err);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ── Purple hero ── */}
        <View style={styles.hero}>
          <View style={styles.circleLarge} />
          <View style={styles.circleMedium} />
          <View style={styles.circleDot} />

          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={COLORS.DARK_TEXT} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Event</Text>
            <View style={styles.headerBtnSpacer} />
          </View>

          <Text style={styles.heroSubtitle}>Let&apos;s add</Text>
          <Text style={styles.heroTitle}>A NEW EVENT</Text>
        </View>

        {/* ── White card ── */}
        <View style={styles.card2}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={styles.fieldCard}>
              <Text style={styles.labelSolo}>Title</Text>
              <TextInput
                style={styles.inputSolo}
                value={title}
                onChangeText={setTitle}
                placeholder="What needs doing?"
                placeholderTextColor={COLORS.MUTED_ON_CARD}
              />
            </View>

            {/* Description */}
            <View style={[styles.fieldCard, styles.descriptionCard]}>
              <Text style={styles.labelSolo}>Description</Text>
              <TextInput
                style={[styles.inputSolo, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes (optional)"
                placeholderTextColor={COLORS.MUTED_ON_CARD}
                multiline
                scrollEnabled={false}
              />
            </View>

            <CategoryPicker
              value={categoryId}
              onChange={setCategoryId}
              open={showCategories}
              onToggle={() => setShowCategories(v => !v)}
            />

            {/* Due Date */}
            <TouchableOpacity
              style={styles.fieldCard}
              activeOpacity={0.7}
              onPress={() => setShowPicker(true)}
            >
              <View style={styles.fieldRow}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.INPUT_BG }]}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.BACKGROUND} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Due Date</Text>
                  <Text style={styles.valueText}>
                    {dueDate ? formatDate(dueDate) : 'No date'}
                  </Text>
                </View>
                {dueDate && (
                  <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={COLORS.MUTED_ON_CARD} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
              <TouchableOpacity style={styles.calOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                  <View style={styles.calSheet}>
                    <Text style={styles.calTitle}>Pick a date</Text>
                    <Calendar
                      onDayPress={onDaySelect}
                      markedDates={dueDate ? {
                        [dueDate.toISOString().split('T')[0]]: { selected: true, selectedColor: COLORS.BACKGROUND },
                      } : {}}
                      theme={{
                        backgroundColor: COLORS.CARD,
                        calendarBackground: COLORS.CARD,
                        selectedDayBackgroundColor: COLORS.BACKGROUND,
                        selectedDayTextColor: COLORS.WHITE_TEXT,
                        todayTextColor: COLORS.BACKGROUND,
                        dayTextColor: COLORS.DARK_TEXT,
                        textDisabledColor: COLORS.MUTED_ON_CARD,
                        arrowColor: COLORS.BACKGROUND,
                        monthTextColor: COLORS.DARK_TEXT,
                        textDayFontFamily: FontFamily.REGULAR,
                        textMonthFontFamily: FontFamily.BOLD,
                        textDayHeaderFontFamily: FontFamily.BOLD,
                      }}
                    />
                    <TouchableOpacity style={styles.calClearBtn} onPress={() => { setDueDate(null); setShowPicker(false); }}>
                      <Text style={styles.calClearText}>Clear date</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            <PriorityPicker value={priority} onChange={setPriority} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingCat size={40} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Add Event</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.DARK_TEXT} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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

  card2: {
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

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF4757',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },

  fieldCard: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  label: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 2,
  },
  labelSolo: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 4,
  },
  inputSolo: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
    paddingVertical: 0,
  },
  valueText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
  },
  multilineInput: {
    lineHeight: 22,
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
    minHeight: 70,
  },
  descriptionCard: { backgroundColor: '#FFFCF5' },

  dropdownMenu: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    marginBottom: 12,
    marginTop: -8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUT_BORDER,
  },
  optionText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
  },
  selectedOptionText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.BACKGROUND,
  },
  emptyDropdown: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
    paddingVertical: 14,
    textAlign: 'center',
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  newCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  newCatInput: {
    flex: 1,
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newCatBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.INPUT_BG,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.INPUT_BORDER,
  },
  newCatBtnPrimary: {
    backgroundColor: COLORS.LIME,
    borderColor: COLORS.LIME,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  priorityChipText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.CARD,
  },
  primaryButton: {
    height: 56,
    borderRadius: 30,
    backgroundColor: COLORS.LIME,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginBottom:65
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 17,
    color: COLORS.DARK_TEXT,
    letterSpacing: 0.5,
  },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  calOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  calSheet: {
    backgroundColor: COLORS.CARD, borderRadius: 24,
    padding: 20, width: 340,
  },
  calTitle: {
    fontFamily: FontFamily.BOLD, fontSize: 17,
    color: COLORS.DARK_TEXT, marginBottom: 12, textAlign: 'center',
  },
  calClearBtn: {
    marginTop: 12, alignItems: 'center', paddingVertical: 10,
  },
  calClearText: {
    fontFamily: FontFamily.REGULAR, fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
  },
});
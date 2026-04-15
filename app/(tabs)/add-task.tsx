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
  UIManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { COLORS } from '../../src/constants/colors';
import { FontFamily } from '../../src/constants/fonts';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import type { TaskPriority } from '@/types/task';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; icon: IoniconName }[] = [
  { value: 'low',    label: 'Low',    color: '#2ED573', icon: 'chevron-down-circle-outline' },
  { value: 'medium', label: 'Medium', color: '#FFA502', icon: 'remove-circle-outline' },
  { value: 'high',   label: 'High',   color: '#FF4757', icon: 'chevron-up-circle-outline' },
];

const CATEGORY_COLORS = ['#4A4AE8', '#FF9BCC', '#C8FF3E', '#FFA502', '#2ED573', '#FF4757', '#7070CC'];

export default function AddTaskScreen() {
  const router = useRouter();
  const { createTask, isLoading } = useTasks();
  const { categories, fetchAll: fetchCategories, createCategory } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [error, setError] = useState('');

  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
      const cat = await createCategory({ name, color });
      setCategoryId(cat.id);
      setNewCatName('');
      setShowNewCatInput(false);
      setShowCategories(false);
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      showApiErrorAlert(err);
    } finally {
      setCreatingCat(false);
    }
  };

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDueDate(selected);
  };

  const toZeroTimeIso = (d: Date) =>
    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        categoryId,
        dueDate: dueDate ? toZeroTimeIso(dueDate) : undefined,
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
            <Text style={styles.headerTitle}>New Task</Text>
            <View style={styles.headerBtnSpacer} />
          </View>

          <Text style={styles.heroSubtitle}>Let's add</Text>
          <Text style={styles.heroTitle}>A NEW TASK</Text>
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

            {/* Category */}
            <TouchableOpacity
              style={styles.fieldCard}
              activeOpacity={0.8}
              onPress={() => setShowCategories(v => !v)}
            >
              <View style={styles.fieldRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#FDECF1' }]}>
                  <Ionicons name="grid-outline" size={18} color="#E91E63" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Category</Text>
                  <Text style={styles.valueText}>
                    {selectedCategory?.name ?? 'None'}
                  </Text>
                </View>
                <Ionicons
                  name={showCategories ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.MUTED_ON_CARD}
                />
              </View>
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[styles.optionItem, styles.optionBorder]}
                  onPress={() => {
                    setCategoryId(undefined);
                    setShowCategories(false);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.MUTED_ON_CARD} />
                  <Text style={[styles.optionText, !categoryId && styles.selectedOptionText]}>
                    None
                  </Text>
                </TouchableOpacity>

                {categories.map((cat, i) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.optionItem, styles.optionBorder]}
                    onPress={() => {
                      setCategoryId(cat.id);
                      setShowCategories(false);
                    }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <Text
                      style={[
                        styles.optionText,
                        categoryId === cat.id && styles.selectedOptionText,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                {categories.length === 0 && (
                  <Text style={styles.emptyDropdown}>
                    No categories yet. Create your first one below.
                  </Text>
                )}

                {showNewCatInput ? (
                  <View style={styles.newCatRow}>
                    <TextInput
                      style={styles.newCatInput}
                      value={newCatName}
                      onChangeText={setNewCatName}
                      placeholder="Category name"
                      placeholderTextColor={COLORS.MUTED_ON_CARD}
                      autoFocus
                      onSubmitEditing={handleCreateCategory}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[styles.newCatBtn, styles.newCatBtnPrimary]}
                      onPress={handleCreateCategory}
                      disabled={creatingCat || !newCatName.trim()}
                      activeOpacity={0.85}
                    >
                      {creatingCat ? (
                        <ActivityIndicator size="small" color={COLORS.DARK_TEXT} />
                      ) : (
                        <Ionicons name="checkmark" size={18} color={COLORS.DARK_TEXT} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.newCatBtn}
                      onPress={() => {
                        setNewCatName('');
                        setShowNewCatInput(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close" size={18} color={COLORS.MUTED_ON_CARD} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setShowNewCatInput(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={18} color={COLORS.BACKGROUND} />
                    <Text style={[styles.optionText, { color: COLORS.BACKGROUND, fontFamily: FontFamily.BOLD }]}>
                      New Category
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

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

            {showPicker && (
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                themeVariant="light"
                textColor={COLORS.DARK_TEXT}
                accentColor={COLORS.BACKGROUND}
                style={Platform.OS === 'ios' ? styles.iosPicker : null}
              />
            )}

            {/* Priority */}
            <Text style={[styles.labelSolo, { marginTop: 4, marginBottom: 8, marginLeft: 4 }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {PRIORITY_OPTIONS.map(opt => {
                const active = priority === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.priorityChip,
                      active && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                    onPress={() => setPriority(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={active ? COLORS.WHITE_TEXT : opt.color}
                    />
                    <Text
                      style={[
                        styles.priorityChipText,
                        { color: active ? COLORS.WHITE_TEXT : opt.color },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
                <ActivityIndicator color={COLORS.DARK_TEXT} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Add Task</Text>
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
  iosPicker: { backgroundColor: COLORS.CARD, borderRadius: 16, marginBottom: 12 },

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
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingCat } from '@/components/ui/loading-cat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { useTheme } from '@/context/theme-context';
import { tasksApi } from '@/services/api/tasks';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import { PriorityPicker } from '@/components/priority-picker';
import { CategoryPicker } from '@/components/category-picker';
import { StatusPicker } from '@/components/status-picker';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { updateTask, deleteTask, toggleComplete, setInProgress, isLoading } = useTasks();
  const { fetchAll: fetchCategories } = useCategories();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<TaskStatus>('pending');

  const [showPicker, setShowPicker] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Load task + categories
  useEffect(() => {
    fetchCategories().catch(() => {});

    if (!id) {
      setError('Missing task id.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const t = await tasksApi.getById(id);
        setTask(t);
        setTitle(t.title);
        setDescription(t.description ?? '');
        setPriority(t.priority);
        setCategoryId(t.categoryId);
        setDueDate(t.dueDate ? new Date(t.dueDate.slice(0, 10) + 'T00:00:00') : null);
        setStatus(t.status);
      } catch (e) {
        const err = toApiError(e);
        setError(err.message);
        showApiErrorAlert(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, fetchCategories]);

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

  const toggleCategoriesMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotationAnim, {
      toValue: showCategories ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setShowCategories(v => !v);
  };

  const arrowRotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSave = async () => {
    if (!task) return;
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
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        categoryId,
        dueDate: toYmd(dueDate),
        status,
      });
      router.back();
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      showApiErrorAlert(err);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      setConfirmDelete(false);
      router.back();
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      showApiErrorAlert(err);
      setConfirmDelete(false);
    }
  };

  

  const handleSetStatus = async (next: 'pending' | 'in_progress' | 'completed') => {
  if (!task || task.status === next) return;
  try {
    if (next === 'completed') {
      await toggleComplete(task);
      setTask(prev => prev ? { ...prev, status: 'completed' } : prev);
      return;
    }

    let base = task;
    if (task.status === 'completed') {
      // Direct API call so we skip applyOverlay in the context's toggleComplete
      const uncompleted = await tasksApi.setCompleted(task, false);
      base = uncompleted; // guaranteed 'pending', overlay was skipped
    }

    const updated = await tasksApi.setInProgress(base, next === 'in_progress');
    setTask(updated);
    setStatus(updated.status);

  } catch (e) {
    showApiErrorAlert(e);
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrap}>
          <LoadingCat size={120} />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrap}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.LIME} />
          <Text style={styles.errorCenter}>{error || 'Task not found.'}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const heroLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Active';

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
          <View style={styles.circlePink} />

          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={18} color={colors.DARK_TEXT} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Event</Text>
            <View style={{ width: 38 }} />
          </View>

          <Text style={styles.heroSubtitle}>{heroLabel}</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {title.toUpperCase()}
          </Text>
        </View>

        {/* ── White card ── */}
        <View style={styles.card2}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                placeholder="Task title"
                placeholderTextColor={colors.MUTED_ON_CARD}
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
                placeholderTextColor={colors.MUTED_ON_CARD}
                multiline
                scrollEnabled={false}
              />
            </View>

            <CategoryPicker
              value={categoryId}
              onChange={setCategoryId}
              open={showCategories}
              onToggle={toggleCategoriesMenu}
              arrowRotation={arrowRotation}
              activeFieldStyle
            />

            {/* Due Date */}
            <TouchableOpacity
              style={styles.fieldCard}
              activeOpacity={0.7}
              onPress={() => setShowPicker(true)}
            >
              <View style={styles.fieldRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.INPUT_BG }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.ACCENT} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Due Date</Text>
                  <Text style={styles.valueText}>
                    {dueDate ? formatDate(dueDate) : 'No date'}
                  </Text>
                </View>
                {dueDate ? (
                  <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.MUTED_ON_CARD} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-down" size={18} color={colors.MUTED_ON_CARD} />
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
                textColor={colors.DARK_TEXT}
                accentColor={colors.ACCENT}
                style={Platform.OS === 'ios' ? styles.iosPicker : null}
              />
            )}

            
            <PriorityPicker value={priority} onChange={setPriority} />

            {/* Status picker */}
            <View style={styles.statusGroup}>
              <Text style={styles.statusGroupLabel}>Status</Text>
              <View style={styles.statusRow}>
                {(['pending', 'in_progress', 'completed'] as const).map((s) => {
                  const active = task.status === s;
                  const label = s === 'pending' ? 'To-do' : s === 'in_progress' ? 'In Progress' : 'Done';
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusBtn, active && styles.statusBtnActive]}
                      onPress={() => handleSetStatus(s)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingCat size={40} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => setConfirmDelete(true)}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Delete confirmation */}
      <Modal
        transparent
        visible={confirmDelete}
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="trash-outline" size={26} color="#FF4757" />
            </View>
            <Text style={styles.modalTitle}>Delete Task?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete &quot;{task.title}&quot;?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setConfirmDelete(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDeleteBtn]}
                onPress={handleDelete}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDeleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.BACKGROUND },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  errorCenter: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: colors.WHITE_TEXT,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Hero
  hero: {
    backgroundColor: colors.BACKGROUND,
    paddingHorizontal: 20,
    paddingBottom: 44,
    position: 'relative',
  },
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
    top: 40, right: '35%',
  },
  circlePink: {
    position: 'absolute',
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.PINK,
    bottom: 8, left: 24, opacity: 0.55,
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
    backgroundColor: colors.LIME,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: colors.WHITE_TEXT,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: colors.MUTED_ON_DARK,
    marginTop: 12,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 24,
    color: colors.LIME,
    letterSpacing: 0.8,
    marginTop: 2,
    zIndex: 1,
  },

  card2: {
    flex: 1,
    backgroundColor: colors.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.INPUT_BORDER,
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
    backgroundColor: colors.INPUT_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.INPUT_BORDER,
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
    color: colors.MUTED_ON_CARD,
    marginBottom: 2,
  },
  labelSolo: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: colors.MUTED_ON_CARD,
    marginBottom: 4,
  },
  inputSolo: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: colors.DARK_TEXT,
    paddingVertical: 0,
  },
  valueText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: colors.DARK_TEXT,
  },
  multilineInput: {
    lineHeight: 22,
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: colors.DARK_TEXT,
    minHeight: 70,
  },
  descriptionCard: { backgroundColor: colors.CARD },
  iosPicker: { backgroundColor: colors.CARD, borderRadius: 16, marginBottom: 12 },

  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.CARD,
    borderTopWidth: 1,
    borderTopColor: colors.INPUT_BORDER,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.LIME,
    shadowColor: colors.BACKGROUND,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveButtonText: {
    fontFamily: FontFamily.BOLD,
    color: colors.DARK_TEXT,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  deleteButton: {
    backgroundColor: colors.INPUT_BG,
    borderWidth: 1.5,
    borderColor: colors.INPUT_BORDER,
  },
  deleteButtonText: {
    fontFamily: FontFamily.BOLD,
    color: '#FF4757',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButton: {
    height: 52,
    borderRadius: 28,
    paddingHorizontal: 28,
    backgroundColor: colors.LIME,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: FontFamily.BOLD,
    color: colors.DARK_TEXT,
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: colors.CARD,
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFECEE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: colors.DARK_TEXT,
    marginBottom: 6,
  },
  modalMessage: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: colors.MUTED_ON_CARD,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: colors.INPUT_BG,
    borderWidth: 1.5,
    borderColor: colors.INPUT_BORDER,
  },
  modalDeleteBtn: { backgroundColor: '#FF4757' },
  modalCancelBtnText: {
    fontFamily: FontFamily.BOLD,
    color: colors.MUTED_ON_CARD,
    fontSize: 14,
  },
  modalDeleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: colors.WHITE_TEXT,
    fontSize: 14,
  },

  statusGroup: {
    marginTop: 4,
    marginBottom: 16,
  },
  statusGroupLabel: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: colors.MUTED_ON_CARD,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.INPUT_BG,
    borderWidth: 1.5,
    borderColor: colors.INPUT_BORDER,
    alignItems: 'center',
  },
  statusBtnActive: {
    backgroundColor: colors.LIME,
    borderColor: colors.LIME,
  },
  statusBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: colors.MUTED_ON_CARD,
  },
  statusBtnTextActive: {
    color: colors.DARK_TEXT,
  },
});

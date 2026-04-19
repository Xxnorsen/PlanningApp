import React, { useCallback, useEffect, useMemo, useState,useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../src/constants/colors';
import { FontFamily } from '../../src/constants/fonts';
import { plannerApi } from '@/services/api/planner';
import { tasksApi } from '@/services/api/tasks';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import type { Task, TaskPriority } from '@/types/task';
import { useCategories } from '@/context/category-context';

type Filter = 'All' | 'To do' | 'In Progress' | 'Completed';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS: Filter[] = ['All', 'To do', 'In Progress', 'Completed'];

// ── Date helpers ────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfDay = (d: Date) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toIsoDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** 7 days: 2 before today, today, 4 after */
const buildDayStrip = (anchor: Date) => {
  const anchorStart = startOfDay(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - 2;
    const d = new Date(anchorStart.getTime() + offset * MS_PER_DAY);
    return d;
  });
};

// ── Priority / status helpers ──────────────────────────────────────────────

const priorityIcon: Record<TaskPriority, { icon: IoniconName; bg: string; color: string }> = {
  high:   { icon: 'flame',           bg: '#FFECEE', color: '#FF4757' },
  medium: { icon: 'remove-circle',   bg: '#FFF4E5', color: '#FFA502' },
  low:    { icon: 'leaf',            bg: '#E8F9EE', color: '#2ED573' },
};

const statusStyle = {
  Done:         { bg: '#E8F9EE', text: '#2ED573' },
  'In Progress':{ bg: '#FFF4E5', text: '#FFA502' },
  'To-do':      { bg: COLORS.INPUT_BG, text: COLORS.BACKGROUND },
};

function taskStatusLabel(t: Task): keyof typeof statusStyle {
  if (t.status === 'completed') return 'Done';
  // Remove the dueDate check — a pending task is just "To-do"
  return 'To-do';
}

function formatTime(iso?: string): string {
  if (!iso) return 'No time';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Delete modal ────────────────────────────────────────────────────────────

const CAT_SIZE = 140;
const CAT_OVERLAP = 70;

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

const DeleteModal = ({ visible, onClose, onConfirm, taskTitle }: DeleteModalProps) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalWrapper}>
        <View style={styles.catFloatContainer} pointerEvents="none">
          <Image
            source={require('@/assets/animations/Blinking Kitty.gif')}
            style={styles.catVideo}
            contentFit="contain"
          />
        </View>
        <View style={styles.modalCard}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Task?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete &quot;{taskTitle}&quot;?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDeleteBtn]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDeleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

// ── Task Card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  categoryName?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (task: Task) => void;
}

const TaskCard = ({ task, categoryName, onEdit, onDelete, onToggle }: TaskCardProps) => {
  const status = taskStatusLabel(task);
  const s = statusStyle[status];
  const p = priorityIcon[task.priority];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.projectName}>{categoryName ?? 'General'}</Text>
        <View style={[styles.iconCircle, { backgroundColor: p.bg }]}>
          <Ionicons name={p.icon} size={16} color={p.color} />
        </View>
      </View>
      <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
      {task.description ? (
        <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
      ) : null}
      <View style={styles.cardMeta}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.MUTED_ON_CARD} />
          <Text style={styles.timeText}>{formatTime(task.dueDate)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => onToggle(task)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={task.status === 'completed' ? 'refresh-outline' : 'checkmark'}
            size={16}
            color={COLORS.DARK_TEXT}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(task.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(task.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const router = useRouter();
  const { categories, fetchAll: fetchCategories } = useCategories();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [anchorDate, setAnchorDate] = useState<Date>(today);
  const days = useMemo(() => buildDayStrip(anchorDate), [anchorDate]);

  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  
  const loadDay = useCallback(async (date: Date, isRefresh = false) => {
  if (isRefresh) setRefreshing(true); else setLoading(true);
  setError('');
  try {
    const plan = await plannerApi.getDaily(toIsoDate(date));

    setTasks(prev => {
      // Keep any tasks that are completed locally — backend filters them out
      const localCompleted = prev.filter(t => t.status === 'completed');
      
      // Merge API tasks with local status
      const currentStatusMap: Record<string, Task['status']> = {};
      prev.forEach(t => { currentStatusMap[t.id] = t.status; });

      const apiTasks = plan.tasks.map(t => ({
        ...t,
        status: currentStatusMap[t.id] ?? t.status,
      }));

      // Add back completed tasks that API didn't return
      const apiIds = new Set(apiTasks.map(t => t.id));
      const missingCompleted = localCompleted.filter(t => !apiIds.has(t.id));

      return [...apiTasks, ...missingCompleted];
    });
  } catch (e) {
    const err = toApiError(e);
    setError(err.message);
    if (err.code === 'NETWORK' || err.code === 'SERVER_ERROR' || err.code === 'TIMEOUT') {
      showApiErrorAlert(err);
    }
    setTasks([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  // Reload when screen gains focus (e.g. after edit/create) and on date change
  useFocusEffect(
  useCallback(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay])
);

  const handleEdit = (id: string) => {
    router.push(`/EditProject?id=${id}`);
  };

  const handleDelete = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (t) {
      setTaskToDelete(t);
      setDeleteModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.delete(taskToDelete.id);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    } catch (e) {
      showApiErrorAlert(e);
    } finally {
      setTaskToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
    setDeleteModalVisible(false);
  };

  const handleToggle = async (task: Task) => {
  const optimisticStatus = task.status === 'completed' ? 'pending' : 'completed';
  console.log('=== handleToggle ===', task.id, task.status, '->', optimisticStatus);
  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: optimisticStatus } : t));
  
  try {
    const updated = await tasksApi.toggleComplete(task);
    console.log('API response after toggle:', { id: updated.id, status: updated.status });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  } catch (e) {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    showApiErrorAlert(e);
  }
};

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const filteredTasks = tasks.filter(task => {
    const label = taskStatusLabel(task);
    if (activeFilter === 'All') return true;
    if (activeFilter === 'To do') return label === 'To-do';
    if (activeFilter === 'In Progress') return label === 'In Progress';
    if (activeFilter === 'Completed') return label === 'Done';
    return true;
  });

  const headerLabel = isSameDay(selectedDate, today)
    ? "Today's Tasks"
    : `${WEEKDAYS[selectedDate.getDay()]}'s Tasks`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />

      {/* ── Purple hero ── */}
      <View style={styles.hero}>
        <View style={styles.circleLarge} />
        <View style={styles.circleMedium} />
        <View style={styles.circleDot} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              setAnchorDate(today);
              setSelectedDate(today);
            }}
          >
            <Ionicons name="today-outline" size={18} color={COLORS.DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerLabel}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => loadDay(selectedDate, true)}>
            <Ionicons name="refresh-outline" size={18} color={COLORS.DARK_TEXT} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroDate}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>

        {/* Calendar strip */}
        <View style={styles.calendarStrip}>
          {days.map(d => {
            const isSelected = isSameDay(d, selectedDate);
            const isTodayCell = isSameDay(d, today);
            return (
              <TouchableOpacity
                key={d.toISOString()}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dayItem,
                  isSelected && styles.dayItemSelected,
                  !isSelected && isTodayCell && styles.dayItemToday,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayMonth, isSelected && styles.dayTextSelected]}>
                  {MONTHS[d.getMonth()]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                  {WEEKDAYS[d.getDay()].slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── White card ── */}
      <View style={styles.card2}>
        <View style={styles.handle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterText, activeFilter === f && styles.filterTextActive]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={COLORS.BACKGROUND} size="large" />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={40} color={COLORS.INPUT_BORDER} />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadDay(selectedDate)}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.taskList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadDay(selectedDate, true)}
                tintColor={COLORS.BACKGROUND}
              />
            }
          >
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={48}
                  color={COLORS.INPUT_BORDER}
                />
                <Text style={styles.emptyText}>No tasks for this day.</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => router.push('/(tabs)/add-task')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  categoryName={task.categoryId ? categoryMap[task.categoryId] : undefined}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      <DeleteModal
        visible={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title ?? ''}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  hero: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    top: 10, right: -20, opacity: 0.6,
  },
  circleDot: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.LIME,
    top: 30, right: '40%',
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
  headerTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.WHITE_TEXT,
    letterSpacing: 0.3,
  },
  heroDate: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_DARK,
    marginTop: 8,
    marginLeft: 2,
    zIndex: 1,
  },

  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    zIndex: 1,
  },
  dayItem: {
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dayItemToday: {
    borderColor: COLORS.LIME,
    borderWidth: 1.5,
  },
  dayItemSelected: {
    backgroundColor: COLORS.LIME,
    borderColor: COLORS.LIME,
  },
  dayMonth: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 10,
    color: COLORS.MUTED_ON_DARK,
  },
  dayNumber: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.WHITE_TEXT,
    marginVertical: 2,
  },
  dayName: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 10,
    color: COLORS.MUTED_ON_DARK,
  },
  dayTextSelected: { color: COLORS.DARK_TEXT },

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

  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
    marginRight: 8,
    height: 38,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.BACKGROUND,
    borderColor: COLORS.BACKGROUND,
  },
  filterText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
  },
  filterTextActive: { color: COLORS.WHITE_TEXT },

  taskList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 14,
  },

  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    flex: 1,
  },
  iconCircle: {
    width: 34, height: 34, borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
  },
  taskDesc: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
  },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: FontFamily.BOLD, fontSize: 11 },

  cardActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  completeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.LIME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  editBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  deleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: '#FF4757',
    fontSize: 14,
  },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 20 },
  emptyText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 15,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: COLORS.LIME,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  catFloatContainer: {
    width: CAT_SIZE,
    height: CAT_SIZE,
    backgroundColor: 'transparent',
    marginBottom: -CAT_OVERLAP,
    left: 100,
    zIndex: 10,
  },
  catVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  modalCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    width: '100%',
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'visible',
    zIndex: 12,
  },
  modalContent: {
    alignItems: 'center',
    paddingTop: CAT_OVERLAP + 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 20,
    color: COLORS.DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  modalDeleteBtn: { backgroundColor: '#FF4757' },
  modalCancelBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.MUTED_ON_CARD,
    fontSize: 15,
  },
  modalDeleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 15,
  },
});

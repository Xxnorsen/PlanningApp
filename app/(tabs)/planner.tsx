import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LoadingCat } from '@/components/ui/loading-cat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { plannerApi } from '@/services/api/planner';
import { tasksApi } from '@/services/api/tasks';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import type { Task } from '@/types/task';
import { useCategories } from '@/context/category-context';
import { TaskCard, taskStatusLabel } from '@/components/task-card';
import { DeleteTaskModal } from '@/components/delete-task-modal';

type Filter = 'All' | 'To do' | 'In Progress' | 'Completed';

const FILTERS: Filter[] = ['All', 'To do', 'In Progress', 'Completed'];

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

// 7 days: 2 before anchor, anchor, 4 after
const buildDayStrip = (anchor: Date) => {
  const anchorStart = startOfDay(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - 2;
    return new Date(anchorStart.getTime() + offset * MS_PER_DAY);
  });
};



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
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calPickedDate, setCalPickedDate] = useState<string | null>(null);
  
  
  // Day view uses /planner/daily. The "Completed" filter is day-agnostic
  // (backend has no completed_at timestamp to group by), so it pulls from
  // /tasks/completed/ directly.
  const load = useCallback(async (date: Date, filter: Filter, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      if (filter === 'Completed') {
        setTasks(await tasksApi.getCompleted());
      } else {
        const plan = await plannerApi.getDaily(toIsoDate(date));
        setTasks(plan.tasks);
      }
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

  useFocusEffect(
    useCallback(() => {
      load(selectedDate, activeFilter);
    }, [selectedDate, activeFilter, load]),
  );

  const handleEdit = (id: string) => {
    router.push(`/edit-task?id=${id}`);
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
    const nextCompleted = task.status !== 'completed';
    const optimistic: Task = { ...task, status: nextCompleted ? 'completed' : 'pending' };
    setTasks(prev => prev.map(t => (t.id === task.id ? optimistic : t)));
    try {
      const updated = await tasksApi.setCompleted(task, nextCompleted);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    } catch (e) {
      setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
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
    ? "Today's Events"
    : `${WEEKDAYS[selectedDate.getDay()]}'s Events`;

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
            onPress={() => { setCalPickedDate(null); setCalendarVisible(true); }}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerLabel}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => load(selectedDate, activeFilter, true)}>
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
          <View style={styles.centerLoader}>
            <LoadingCat size={100} />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={40} color={COLORS.INPUT_BORDER} />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => load(selectedDate, activeFilter)}
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
                onRefresh={() => load(selectedDate, activeFilter, true)}
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
                <Text style={styles.emptyText}>No events for this day.</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => router.push('/(tabs)/add-task')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryText}>Add Event</Text>
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

      <DeleteTaskModal
        visible={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title ?? ''}
      />

      {/* ── Full Calendar Modal ── */}
      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.calOverlay}>
          <View style={styles.calSheet}>
            <View style={styles.calHandle} />

            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>Pick a Date</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.calClose}>
                <Ionicons name="close" size={20} color={COLORS.DARK_TEXT} />
              </TouchableOpacity>
            </View>

            <Calendar
              current={calPickedDate ?? toIsoDate(selectedDate)}
              onDayPress={(day: { dateString: string }) => setCalPickedDate(day.dateString)}
              markedDates={{
                ...(calPickedDate
                  ? { [calPickedDate]: { selected: true, selectedColor: COLORS.BACKGROUND } }
                  : { [toIsoDate(selectedDate)]: { selected: true, selectedColor: COLORS.BACKGROUND } }),
                [toIsoDate(today)]: (calPickedDate === toIsoDate(today) || (!calPickedDate && isSameDay(selectedDate, today)))
                  ? { selected: true, selectedColor: COLORS.BACKGROUND }
                  : { marked: true, dotColor: COLORS.LIME },
              }}
              theme={{
                backgroundColor: COLORS.CARD,
                calendarBackground: COLORS.CARD,
                todayTextColor: COLORS.BACKGROUND,
                selectedDayBackgroundColor: COLORS.BACKGROUND,
                selectedDayTextColor: '#fff',
                dayTextColor: COLORS.DARK_TEXT,
                textDisabledColor: COLORS.INPUT_BORDER,
                monthTextColor: COLORS.DARK_TEXT,
                arrowColor: COLORS.BACKGROUND,
                textDayFontFamily: FontFamily.REGULAR,
                textMonthFontFamily: FontFamily.BOLD,
                textDayHeaderFontFamily: FontFamily.BOLD,
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 12,
                dotColor: COLORS.LIME,
                ['stylesheet.calendar.header' as never]: {
                  week: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-around' },
                },
              }}
            />

            {/* Action buttons */}
            <View style={styles.calActions}>
              <TouchableOpacity
                style={styles.calSecondaryBtn}
                onPress={() => {
                  setSelectedDate(today);
                  setAnchorDate(today);
                  setCalPickedDate(null);
                  setCalendarVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="today-outline" size={16} color={COLORS.BACKGROUND} />
                <Text style={styles.calSecondaryBtnText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calViewBtn}
                onPress={() => {
                  const target = calPickedDate ? new Date(calPickedDate + 'T00:00:00') : selectedDate;
                  setSelectedDate(target);
                  setAnchorDate(target);
                  setCalPickedDate(null);
                  setCalendarVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="list-outline" size={16} color={COLORS.DARK_TEXT} />
                <Text style={styles.calViewBtnText}>View Day</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calAddBtn}
                onPress={() => {
                  const target = calPickedDate ?? toIsoDate(selectedDate);
                  const targetDate = new Date(target + 'T00:00:00');
                  setSelectedDate(targetDate);
                  setAnchorDate(targetDate);
                  setCalPickedDate(null);
                  setCalendarVisible(false);
                  router.push({ pathname: '/add-task', params: { date: target } });
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color={COLORS.DARK_TEXT} />
                <Text style={styles.calAddBtnText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  calOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  calSheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingBottom: 36, overflow: 'hidden',
  },
  calHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.INPUT_BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  calTitle: { fontFamily: FontFamily.BOLD, fontSize: 18, color: COLORS.DARK_TEXT },
  calClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.INPUT_BG, alignItems: 'center', justifyContent: 'center',
  },
  calActions: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 16 },

  calSecondaryBtn: {
    flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5,
    borderColor: COLORS.BACKGROUND, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  calSecondaryBtnText: { fontFamily: FontFamily.BOLD, fontSize: 13, color: COLORS.BACKGROUND },

  calViewBtn: {
    flex: 1.2, height: 48, borderRadius: 24,
    backgroundColor: COLORS.INPUT_BG, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  calViewBtnText: { fontFamily: FontFamily.BOLD, fontSize: 13, color: COLORS.DARK_TEXT },

  calAddBtn: {
    flex: 1.5, height: 48, borderRadius: 24,
    backgroundColor: COLORS.LIME, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  calAddBtnText: { fontFamily: FontFamily.BOLD, fontSize: 13, color: COLORS.DARK_TEXT },
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
});

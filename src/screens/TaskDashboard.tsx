import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '../constants/colors';
import { FontFamily } from '../constants/fonts';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { progressApi, type ProgressData } from '@/services/api/progress';
import { showApiErrorAlert } from '@/services/api/errors';
import type { Task, TaskPriority } from '@/types/task';

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const priorityBadge: Record<TaskPriority, { bg: string; color: string; icon: IoniconName }> = {
  high:   { bg: '#FFECEE', color: '#FF4757', icon: 'flame' },
  medium: { bg: '#FFF4E5', color: '#FFA502', icon: 'remove-circle' },
  low:    { bg: '#E8F9EE', color: '#2ED573', icon: 'leaf' },
};

// ── Circular progress ──────────────────────────────────────────────────────

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const size = 80;
  const strokeWidth = 7;
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      />
      {pct > 0 && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.LIME,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      )}
      <Text style={styles.progressPct}>{pct}%</Text>
    </View>
  );
};

// ── In Progress Card ───────────────────────────────────────────────────────

interface InProgressCardProps {
  task: Task;
  categoryName?: string;
  onPress: () => void;
  onToggleDone: () => void;
}

const InProgressCard: React.FC<InProgressCardProps> = ({
  task,
  categoryName,
  onPress,
  onToggleDone,
}) => {
  const p = priorityBadge[task.priority];
  return (
    <View style={[styles.inProgressCard, { backgroundColor: COLORS.INPUT_BG }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ gap: 10 }}>
        <View style={styles.inProgressCardHeader}>
          <Text style={styles.inProgressCategory} numberOfLines={1}>
            {categoryName ?? 'General'}
          </Text>
          <View style={[styles.categoryIconBadge, { backgroundColor: p.bg }]}>
            <Ionicons name={p.icon} size={14} color={p.color} />
          </View>
        </View>
        <Text style={styles.inProgressTitle} numberOfLines={2}>
          {task.title}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doneBtn}
        onPress={onToggleDone}
        activeOpacity={0.85}
        hitSlop={6}
      >
        <Ionicons name="checkmark" size={16} color={COLORS.DARK_TEXT} />
        <Text style={styles.doneBtnText}>Mark done</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Category Row ────────────────────────────────────────────────────────────

interface CategoryRowProps {
  name: string;
  color: string;
  taskCount: number;
  delay: number;
  onPress: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ name, color, taskCount, delay, onPress }) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <TouchableOpacity activeOpacity={0.8} style={styles.taskGroupRow} onPress={onPress}>
        <View style={[styles.taskGroupIcon, { backgroundColor: color + '22' }]}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.taskGroupInfo}>
          <Text style={styles.taskGroupName}>{name}</Text>
          <Text style={styles.taskGroupCount}>
            {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.MUTED_ON_CARD} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────

const TaskDashboard: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { tasks, fetchAll, toggleComplete } = useTasks();
  const { categories, fetchAll: fetchCategories } = useCategories();

  const handleToggleDone = async (task: Task) => {
    try {
      await toggleComplete(task);
    } catch (e) {
      showApiErrorAlert(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('[Logout error]', e);
    }
    router.replace('/(auth)/login');
  };

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [, , p] = await Promise.all([
        fetchAll().catch(() => {}),
        fetchCategories().catch(() => {}),
        progressApi.get().catch(() => null),
      ]);
      setProgress(p);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [fetchAll, fetchCategories]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerScale]);

  const inProgressTasks = useMemo(
    () => tasks.filter(t => t.status !== 'completed').slice(0, 6),
    [tasks]
  );

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const taskCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  const completionRate = progress?.completionRate ?? 0;
  const almostDone = completionRate >= 70;

  const userName = (user?.name ?? 'USER').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'U').toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={COLORS.LIME} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAll(true)}
            tintColor={COLORS.LIME}
          />
        }
      >
        {/* ── Purple hero ── */}
        <View style={styles.hero}>
          <View style={styles.circleLarge} />
          <View style={styles.circleMedium} />
          <View style={styles.circleDot} />

          <View style={styles.topHeader}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </View>
              <View>
                <Text style={styles.helloText}>Hello!</Text>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/categories')}
              >
                <Ionicons name="grid-outline" size={18} color={COLORS.DARK_TEXT} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.85}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color={COLORS.DARK_TEXT} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[
              styles.todayBanner,
              { transform: [{ scale: headerScale }], opacity: headerOpacity },
            ]}
          >
            <View style={styles.todayLeft}>
              <Text style={styles.todaySubtitle}>Your Today is</Text>
              <Text style={styles.todayTitle}>
                {progress
                  ? almostDone
                    ? 'Almost Done!'
                    : `${progress.pending} To Do`
                  : 'Getting Started!'}
              </Text>
              <TouchableOpacity
                style={styles.viewTasksBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Text style={styles.viewTasksText}>View Tasks</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.DARK_TEXT} />
                </View>
              </TouchableOpacity>
            </View>
            <CircularProgress progress={completionRate} />
          </Animated.View>
        </View>

        {/* ── White card ── */}
        <View style={styles.card}>
          <View style={styles.handle} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{inProgressTasks.length}</Text>
            </View>
          </View>

          {inProgressTasks.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={32}
                color={COLORS.INPUT_BORDER}
              />
              <Text style={styles.emptyInlineText}>Nothing in progress.</Text>
              <TouchableOpacity
                style={styles.emptyInlineBtn}
                onPress={() => router.push('/(tabs)/add-task')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={COLORS.DARK_TEXT} />
                <Text style={styles.emptyInlineBtnText}>Add task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inProgressScroll}
            >
              {inProgressTasks.map(task => (
                <InProgressCard
                  key={task.id}
                  task={task}
                  categoryName={task.categoryId ? categoryMap[task.categoryId] : undefined}
                  onPress={() => router.push(`/EditProject?id=${task.id}`)}
                  onToggleDone={() => handleToggleDone(task)}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Groups</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{categories.length}</Text>
            </View>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons name="grid-outline" size={32} color={COLORS.INPUT_BORDER} />
              <Text style={styles.emptyInlineText}>No categories yet.</Text>
            </View>
          ) : (
            <View style={styles.taskGroupsList}>
              {categories.map((cat, i) => (
                <CategoryRow
                  key={cat.id}
                  name={cat.name}
                  color={cat.color}
                  taskCount={cat.taskCount ?? taskCountsByCategory[cat.id] ?? 0}
                  delay={i * 80}
                  onPress={() => router.push('/(tabs)/planner')}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 52,
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
    top: 40, right: width * 0.3,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    zIndex: 1,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)',
  },
  avatarText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 18,
  },
  helloText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_DARK,
  },
  userName: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.WHITE_TEXT,
    letterSpacing: 1,
    maxWidth: 180,
  },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.LIME,
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  todayBanner: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 1,
  },
  todayLeft: { flex: 1 },
  todaySubtitle: {
    fontFamily: FontFamily.REGULAR,
    color: COLORS.MUTED_ON_DARK,
    fontSize: 13,
  },
  todayTitle: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 22,
    marginTop: 2,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  viewTasksBtn: {
    backgroundColor: COLORS.LIME,
    borderRadius: 30,
    paddingLeft: 18, paddingRight: 6, paddingVertical: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  viewTasksText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.DARK_TEXT,
    fontSize: 13,
  },
  arrowCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 18,
  },

  card: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    minHeight: 400,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.INPUT_BORDER,
    alignSelf: 'center', marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.DARK_TEXT,
  },
  sectionBadge: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.BACKGROUND,
    fontSize: 12,
  },

  inProgressScroll: { paddingRight: 20, gap: 12, marginBottom: 22 },
  inProgressCard: {
    width: width * 0.5,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  inProgressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inProgressCategory: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 11,
    color: COLORS.MUTED_ON_CARD,
    flex: 1,
    marginRight: 6,
  },
  categoryIconBadge: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  inProgressTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
    lineHeight: 20,
  },
  doneBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.LIME,
    borderRadius: 12,
    paddingVertical: 8,
  },
  doneBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: COLORS.DARK_TEXT,
  },

  taskGroupsList: { gap: 10 },
  taskGroupRow: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  taskGroupIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  taskGroupInfo: { flex: 1 },
  taskGroupName: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: COLORS.DARK_TEXT,
  },
  taskGroupCount: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    marginTop: 2,
  },

  emptyInline: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    marginBottom: 16,
  },
  emptyInlineText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
  },
  emptyInlineBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.LIME,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyInlineBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: COLORS.DARK_TEXT,
  },
});

export default TaskDashboard;

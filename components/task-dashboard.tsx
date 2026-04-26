import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LoadingCat } from '@/components/ui/loading-cat';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { useTheme } from '@/context/theme-context';
import { progressApi, type ProgressData } from '@/services/api/progress';
import { plannerApi } from '@/services/api/planner';
import { showApiErrorAlert } from '@/services/api/errors';
import type { Task, TaskPriority } from '@/types/task';

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const priorityBadge: Record<TaskPriority, { bg: string; color: string; icon: IoniconName }> = {
  high: { bg: '#FFECEE', color: '#FF4757', icon: 'flame' },
  medium: { bg: '#FFF4E5', color: '#FFA502', icon: 'remove-circle' },
  low: { bg: '#E8F9EE', color: '#2ED573', icon: 'leaf' },
};

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const size = 80;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, progress));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.25)" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colors.LIME} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.progressPct}>{pct}%</Text>
    </View>
  );
};

const CONFETTI_COLORS = ['#C8FF3E', '#FF4757', '#FFA502', '#2ED573', '#FF9BCC', '#1E90FF', '#6C5CE7'];

const CelebrationOverlay: React.FC<{ visible: boolean; onDone: () => void }> = ({ visible, onDone }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      dist: 60 + Math.random() * 80,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(0);
    particles.forEach(p => { p.x.setValue(0); p.y.setValue(0); p.op.setValue(1); });

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ...particles.map(p =>
        Animated.parallel([
          Animated.timing(p.x, { toValue: Math.cos(p.angle) * p.dist, duration: 700, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: Math.sin(p.angle) * p.dist - 40, duration: 700, useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
        ])
      ),
    ]).start();

    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [visible, onDone, opacity, scale, particles]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.celebOverlay, { opacity }]}>
        <View style={styles.celebCenter}>
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: p.color,
                transform: [{ translateX: p.x }, { translateY: p.y }],
                opacity: p.op,
              }}
            />
          ))}
          <Animated.View style={[styles.celebCard, { transform: [{ scale }] }]}>
            <View style={styles.celebCheck}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.celebTitle}>Well Done!</Text>
            <Text style={styles.celebSub}>Event marked as complete</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};


interface InProgressCardProps {
  task: Task;
  categoryName?: string;
  onPress: () => void;
  onAction: () => void;
  actionLabel?: string;
  actionIcon?: IoniconName;
}

const InProgressCard: React.FC<InProgressCardProps> = ({
  task,
  categoryName,
  onPress,
  onAction,
  actionLabel = 'Mark done',
  actionIcon = 'checkmark',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const p = priorityBadge[task.priority];
  return (
    <View style={[styles.inProgressCard, { backgroundColor: colors.INPUT_BG }]}>
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
        onPress={onAction}
        activeOpacity={0.85}
        hitSlop={6}
      >
        <Ionicons name={actionIcon} size={16} color={colors.DARK_TEXT} />
        <Text style={styles.doneBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface CategoryRowProps {
  name: string;
  color: string;
  icon?: string;
  taskCount: number;
  delay: number;
  onPress: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ name, color, icon, taskCount, delay, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
          <Ionicons name={(icon ?? 'grid-outline') as any} size={22} color={color} />
        </View>
        <View style={styles.taskGroupInfo}>
          <Text style={styles.taskGroupName}>{name}</Text>
          <Text style={styles.taskGroupCount}>
            {taskCount} {taskCount === 1 ? 'Event' : 'Events'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.MUTED_ON_CARD} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TaskDashboard: React.FC = () => {
  const router = useRouter();
  const { user, logout, sessionSticker, rotateSticker } = useAuth();
  const { tasks, fetchAll, toggleComplete, setInProgress } = useTasks();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stickerSources = [
    require('@/assets/stickers/cat1.png'),
    require('@/assets/stickers/cat2.png'),
    require('@/assets/stickers/cat3.png'),
    require('@/assets/stickers/halloween.png'),
  ];
  const stickerSource = stickerSources[sessionSticker % stickerSources.length];
  const { categories, fetchAll: fetchCategories } = useCategories();

  const handleToggleDone = async (task: Task) => {
    try {
      await toggleComplete(task);
      if (task.status !== 'completed') setCelebrating(true);
    } catch (e) {
      showApiErrorAlert(e);
    }
  };

  const handleStartInProgress = async (task: Task) => {
    try {
      await setInProgress(task, true);
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
  const [todayTotals, setTodayTotals] = useState<{ completed: number; pending: number; total: number }>({ completed: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const loadAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayIso = `${yyyy}-${mm}-${dd}`;
        const [, , p, todayPlan] = await Promise.all([
          fetchAll().catch(() => {}),
          fetchCategories().catch(() => {}),
          progressApi.get().catch(() => null),
          plannerApi.getDaily(todayIso).catch(() => ({ date: todayIso, tasks: [] })),
        ]);
        setProgress(p);
        const completed = todayPlan.tasks.filter((t) => t.status === 'completed').length;
        const total = todayPlan.tasks.length;
        setTodayTotals({ completed, pending: total - completed, total });
        if (isRefresh) {
          await rotateSticker().catch(() => {});
        }
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [fetchAll, fetchCategories, rotateSticker],
  );

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerScale]);

  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === 'in_progress').slice(0, 6),
    [tasks],
  );

  const upcomingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'pending').slice(0, 6),
    [tasks],
  );

  const doneTasks = useMemo(
    () => tasks.filter(t => t.status === 'completed').slice(0, 10),
    [tasks]
  );

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => {
      m[c.id] = c.name;
    });
    return m;
  }, [categories]);

  const taskCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  const completionRate = todayTotals.total > 0
    ? Math.round((todayTotals.completed / todayTotals.total) * 100)
    : (progress?.completionRate ?? 0);
  const almostDone = todayTotals.total > 0 && completionRate >= 70;

  const userName = (user?.name ?? 'USER').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'U').toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loaderWrap}>
          <LoadingCat size={120} />
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
            tintColor={colors.LIME}
          />
        }
      >
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
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/categories')}
              >
                <Ionicons name="grid-outline" size={18} color={colors.DARK_TEXT} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.85}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.DARK_TEXT} />
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
                {todayTotals.total === 0
                  ? 'Nothing scheduled'
                  : almostDone
                    ? 'Almost Done!'
                    : `${todayTotals.pending} To Do`}
              </Text>
              <TouchableOpacity
                style={styles.viewTasksBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Text style={styles.viewTasksText}>View Events</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color={colors.DARK_TEXT} />
                </View>
              </TouchableOpacity>
            </View>
            <CircularProgress progress={completionRate} />
          </Animated.View>
        </View>

        <View style={styles.card}>
          <View style={styles.handle} />

          <Image source={stickerSource} style={styles.sessionSticker} resizeMode="contain" />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <View style={[styles.sectionBadge, { backgroundColor: '#FFF4E5' }]}>
              <Text style={[styles.sectionBadgeText, { color: '#FFA502' }]}>{inProgressTasks.length}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/in-progress')}
              activeOpacity={0.7}
              style={{ marginLeft: 'auto' }}
            >
              <Text style={{ fontFamily: FontFamily.BOLD, fontSize: 13, color: colors.ACCENT }}>
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {inProgressTasks.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons name="hourglass-outline" size={32} color={colors.INPUT_BORDER} />
              <Text style={styles.emptyInlineText}>Nothing in progress yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inProgressScroll}
            >
              {inProgressTasks.map((task) => (
                <InProgressCard
                  key={task.id}
                  task={task}
                  categoryName={task.categoryId ? categoryMap[task.categoryId] : undefined}
                  onPress={() => router.push(`/edit-task?id=${task.id}`)}
                  onAction={() => handleToggleDone(task)}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{upcomingTasks.length}</Text>
            </View>
          </View>

          {upcomingTasks.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={32}
                color={colors.INPUT_BORDER}
              />
              <Text style={styles.emptyInlineText}>Nothing on deck.</Text>
              <TouchableOpacity
                style={styles.emptyInlineBtn}
                onPress={() => router.push('/(tabs)/add-task')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={colors.DARK_TEXT} />
                <Text style={styles.emptyInlineBtnText}>Add event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inProgressScroll}
            >
              {upcomingTasks.map((task) => (
                <InProgressCard
                  key={task.id}
                  task={task}
                  categoryName={task.categoryId ? categoryMap[task.categoryId] : undefined}
                  onPress={() => router.push(`/edit-task?id=${task.id}`)}
                  onAction={() => handleStartInProgress(task)}
                  actionLabel="Start"
                  actionIcon="play"
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{categories.length}</Text>
            </View>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons name="grid-outline" size={32} color={colors.INPUT_BORDER} />
              <Text style={styles.emptyInlineText}>No categories yet.</Text>
            </View>
          ) : (
            <View style={styles.taskGroupsList}>
              {categories.map((cat, i) => (
                <CategoryRow
                  key={cat.id}
                  name={cat.name}
                  color={cat.color}
                  icon={cat.icon}
                  taskCount={cat.taskCount ?? taskCountsByCategory[cat.id] ?? 0}
                  delay={i * 80}
                  onPress={() => router.push('/categories')}
                />
              ))}
            </View>
          )}

          {/* ── Done section ── */}
          {doneTasks.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Done</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#E8F9EE' }]}>
                  <Text style={[styles.sectionBadgeText, { color: '#2ED573' }]}>{doneTasks.length}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/completed')}
                  activeOpacity={0.7}
                  style={{ marginLeft: 'auto' }}
                >
                  <Text style={{ fontFamily: FontFamily.BOLD, fontSize: 13, color: colors.ACCENT }}>
                    View all
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.doneList}>
                {doneTasks.map(task => (
                  <View key={task.id} style={styles.doneRow}>
                    <View style={styles.doneCheck}>
                      <Ionicons name="checkmark" size={14} color="#2ED573" />
                    </View>
                    <View style={styles.doneInfo}>
                      <Text style={styles.doneTitle} numberOfLines={1}>{task.title}</Text>
                      {task.categoryId && categoryMap[task.categoryId] ? (
                        <Text style={styles.doneCat}>{categoryMap[task.categoryId]}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleDone(task)}
                      hitSlop={8}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color={colors.MUTED_ON_CARD} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} />
    </SafeAreaView>
  );
};

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.BACKGROUND },
  scroll: { flex: 1, backgroundColor: colors.BACKGROUND },
  scrollContent: { flexGrow: 1 },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.BACKGROUND,
  },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 52,
    position: 'relative',
  },
  circleLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.CIRCLE_LIGHT,
    top: -30,
    left: -40,
    opacity: 0.6,
  },
  circleMedium: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.CIRCLE_LIGHTER,
    top: 20,
    right: -20,
    opacity: 0.6,
  },
  circleDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.LIME,
    top: 40,
    right: width * 0.3,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  avatarText: {
    fontFamily: FontFamily.BOLD,
    color: colors.WHITE_TEXT,
    fontSize: 18,
  },
  helloText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: colors.MUTED_ON_DARK,
  },
  userName: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: colors.WHITE_TEXT,
    letterSpacing: 1,
    maxWidth: 180,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.LIME,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.MUTED_ON_DARK,
    fontSize: 13,
  },
  todayTitle: {
    fontFamily: FontFamily.BOLD,
    color: colors.WHITE_TEXT,
    fontSize: 22,
    marginTop: 2,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  viewTasksBtn: {
    backgroundColor: colors.LIME,
    borderRadius: 30,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewTasksText: {
    fontFamily: FontFamily.BOLD,
    color: colors.DARK_TEXT,
    fontSize: 13,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    fontFamily: FontFamily.BOLD,
    color: colors.WHITE_TEXT,
    fontSize: 18,
  },

  card: {
    flexGrow: 1,
    backgroundColor: colors.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.INPUT_BORDER,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sessionSticker: {
    position: 'absolute',
    top: -70,
    right: 12,
    width: 110,
    height: 110,
    zIndex: 5,
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
    color: colors.DARK_TEXT,
  },
  sectionBadge: {
    backgroundColor: colors.INPUT_BG,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontFamily: FontFamily.BOLD,
    color: colors.ACCENT,
    fontSize: 12,
  },

  inProgressScroll: { paddingRight: 20, gap: 12, marginBottom: 22 },
  inProgressCard: {
    width: Math.min(width * 0.5, 200),
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.INPUT_BORDER,
  },
  inProgressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inProgressCategory: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 11,
    color: colors.MUTED_ON_CARD,
    flex: 1,
    marginRight: 6,
  },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 14,
    color: colors.DARK_TEXT,
    lineHeight: 20,
  },
  doneBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.LIME,
    borderRadius: 12,
    paddingVertical: 8,
  },
  doneBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: colors.DARK_TEXT,
  },

  taskGroupsList: { gap: 10 },
  taskGroupRow: {
    backgroundColor: colors.INPUT_BG,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.INPUT_BORDER,
  },
  taskGroupIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
taskGroupInfo: { flex: 1 },
  taskGroupName: {
    fontFamily: FontFamily.BOLD,
    fontSize: 15,
    color: colors.DARK_TEXT,
  },
  taskGroupCount: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: colors.MUTED_ON_CARD,
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
    color: colors.MUTED_ON_CARD,
  },
  emptyInlineBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.LIME,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyInlineBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 13,
    color: colors.DARK_TEXT,
  },

  doneList: { gap: 8, marginBottom: 8 },
  doneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.INPUT_BG, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.INPUT_BORDER,
  },
  doneCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8F9EE', alignItems: 'center', justifyContent: 'center',
  },
  doneInfo: { flex: 1 },
  doneTitle: {
    fontFamily: FontFamily.BOLD, fontSize: 14, color: colors.MUTED_ON_CARD,
    textDecorationLine: 'line-through',
  },
  doneCat: { fontFamily: FontFamily.REGULAR, fontSize: 11, color: colors.MUTED_ON_CARD, marginTop: 2 },

  celebOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  celebCenter: { alignItems: 'center', justifyContent: 'center' },
  celebCard: {
    backgroundColor: '#fff', borderRadius: 28,
    paddingHorizontal: 40, paddingVertical: 32,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  celebCheck: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.ACCENT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  celebTitle: { fontFamily: FontFamily.BOLD, fontSize: 22, color: '#1A1A2E' },
  celebSub: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: '#6B6B7B' },
});

export default TaskDashboard;

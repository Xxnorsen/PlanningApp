import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingCat } from '@/components/ui/loading-cat';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { progressApi, type ProgressData } from '@/services/api/progress';
import { tasksApi } from '@/services/api/tasks';
import { categoriesApi } from '@/services/api/categories';
import type { Task } from '@/types/task';
import type { Category } from '@/types/category';
import { plannerApi } from '@/services/api/planner';
import { CircularProgress } from '@/components/circular-progress';
import { WeeklyBarChart } from '@/components/weekly-bar-chart';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const router = useRouter();
  const { user, sessionSticker, rotateSticker } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const AchievementCard = ({ icon, title, description, color }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    color: string;
  }) => (
    <View style={styles.achievementCard}>
      <View style={[styles.achievementIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDescription}>{description}</Text>
      </View>
    </View>
  );

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const userName = (user?.name ?? 'User').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'U').toUpperCase();

  const stickerSources = [
    require('@/assets/stickers/cat1.png'),
    require('@/assets/stickers/cat2.png'),
    require('@/assets/stickers/cat3.png'),
    require('@/assets/stickers/halloween.png'),
  ];
  const stickerSource = stickerSources[sessionSticker % stickerSources.length];

  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const loadProgress = useCallback(async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true); else setLoading(true);
  try {
    const today = new Date();
    const toIsoDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const [p, completed, active, c, todayPlan] = await Promise.all([
      progressApi.get().catch(() => null),
      tasksApi.getCompleted().catch(() => []),
      tasksApi.getActive().catch(() => []),
      categoriesApi.getAll().catch(() => []),
      plannerApi.getDaily(toIsoDate(today)).catch(() => ({ date: '', tasks: [] })),
    ]);

    // Merge active + completed + today's planner so we have a single source of
    // truth for both the chart (uses completed dates) and the today calc.
    const taskMap = new Map<string, Task>();
    completed.forEach(task => taskMap.set(task.id, task));
    active.forEach(task => taskMap.set(task.id, task));
    todayPlan.tasks
      .filter(t => t.status === 'completed')
      .forEach(task => taskMap.set(task.id, {
        ...task,
        completedAt: task.completedAt ?? new Date().toISOString(),
      }));

    setProgress(p);
    setTasks(Array.from(taskMap.values()));
    setCategories(c);

    if (isRefresh) {
      await rotateSticker().catch(() => {});
    }
  } finally {
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }
}, [rotateSticker]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerScale]);

  // Today's completion rate — derive from the loaded tasks list filtered by
  // today's due date so it matches the Tasks dashboard exactly. Falls back to
  // the backend's all-time rate only when nothing is due today.
  const todayDerived = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;
    const todayTasks = tasks.filter(t => t.dueDate?.slice(0, 10) === todayIso);
    const completed = todayTasks.filter(t => t.status === 'completed').length;
    return { completed, total: todayTasks.length };
  }, [tasks]);

  const completionRate = todayDerived.total > 0
    ? Math.round((todayDerived.completed / todayDerived.total) * 100)
    : (progress?.completionRate ?? 0);
  const almostDone = todayDerived.total > 0 && completionRate >= 70;

  // ── Achievements (derived from tasks + categories, no persistence) ──
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completedCount = completedTasks.length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  const hasFirstStep = completedCount >= 1;
  const hasOnARoll = completedCount >= 10;
  const hasCenturion = completedCount >= 100;
  const hasHighAchiever = completedTasks.filter(t => t.priority === 'high').length >= 5;
  const hasCleanSlate = tasks.length > 0 && pendingCount === 0;

  // Category Master: any category with >=1 task where every task is completed
  const masteredCategory = categories.find(cat => {
    const inCat = tasks.filter(t => t.categoryId === cat.id);
    return inCat.length > 0 && inCat.every(t => t.status === 'completed');
  });
  const hasCategoryMaster = !!masteredCategory;

  const earnedAchievements = [
    hasFirstStep && {
      icon: 'flag-outline' as const,
      title: 'First Step',
      description: 'Completed your first task',
      color: '#2ED573',
    },
    hasOnARoll && {
      icon: 'rocket-outline' as const,
      title: 'On a Roll',
      description: `${completedCount} tasks completed`,
      color: '#1E90FF',
    },
    hasCenturion && {
      icon: 'trophy-outline' as const,
      title: 'Centurion',
      description: '100 tasks completed',
      color: '#FFA502',
    },
    hasHighAchiever && {
      icon: 'flame-outline' as const,
      title: 'High Achiever',
      description: '5 high-priority tasks done',
      color: '#FF4757',
    },
    hasCategoryMaster && {
      icon: 'ribbon-outline' as const,
      title: 'Category Master',
      description: `Cleared every task in "${masteredCategory!.name}"`,
      color: '#6C5CE7',
    },
    hasCleanSlate && {
      icon: 'checkmark-done-circle-outline' as const,
      title: 'Clean Slate',
      description: 'Zero pending tasks',
      color: '#C8FF3E',
    },
  ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; color: string }[];

  const hasAnyAchievements = earnedAchievements.length > 0;

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
            onRefresh={() => loadProgress(true)}
            tintColor={colors.LIME}
          />
        }
      >
        {/* ── Purple hero ── */}
        <View style={styles.hero}>
          <View style={styles.circleLarge} />
          <View style={styles.circleMedium} />
          <View style={styles.circleDot} />
          <View style={styles.circlePink} />

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
                <Ionicons name="grid-outline" size={18} color={colors.DARK_TEXT} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Ionicons name="arrow-forward" size={18} color={colors.DARK_TEXT} />
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
              <Text style={styles.todaySubtitle}>Today&apos;s Progress</Text>
              <Text style={styles.todayTitle}>
                {todayDerived.total === 0
                  ? 'No tasks today'
                  : almostDone
                    ? 'Almost Done!'
                    : `${completionRate}% Complete`}
              </Text>
              <TouchableOpacity
                style={styles.viewTasksBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Text style={styles.viewTasksText}>View Tasks</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color={colors.DARK_TEXT} />
                </View>
              </TouchableOpacity>
            </View>
            <CircularProgress progress={completionRate} />
          </Animated.View>
        </View>

        {/* ── White card ── */}
        <View style={styles.card}>
          <View style={styles.handle} />

          {/* Session sticker — rotates on each login */}
          <Image
            source={stickerSource}
            style={styles.sessionSticker}
            resizeMode="contain"
          />

          <Text style={styles.sectionTitle}>Monthly Progress</Text>

          <Text style={styles.sectionSubtitle}>Completed Tasks This Month</Text>
          <WeeklyBarChart tasks={tasks} selectedTab="Monthly" />

          <Text style={styles.sectionTitle}>Achievements</Text>
          
          {hasAnyAchievements ? (
            <View style={styles.achievementsList}>
              {earnedAchievements.map((a) => (
                <AchievementCard
                  key={a.title}
                  icon={a.icon}
                  title={a.title}
                  description={a.description}
                  color={a.color}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyAchievements}>
              <Ionicons
                name="trophy-outline"
                size={48}
                color={colors.INPUT_BORDER}
              />
              <Text style={styles.emptyAchievementsText}>
                Your trophy shelf is looking a bit lonely. Let&apos;s give the cat something to celebrate!
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
    top: 40, right: width * 0.3,
  },
  circlePink: {
    position: 'absolute',
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.PINK,
    bottom: 12, left: 24, opacity: 0.55,
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.LIME,
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
    paddingLeft: 18, paddingRight: 6, paddingVertical: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  viewTasksText: {
    fontFamily: FontFamily.BOLD,
    color: colors.DARK_TEXT,
    fontSize: 13,
  },
  arrowCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
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
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.INPUT_BORDER,
    alignSelf: 'center', marginBottom: 20,
  },
  sessionSticker: {
    position: 'absolute',
    top: -70,
    right: 12,
    width: 110,
    height: 110,
    zIndex: 5,
  },

  sectionTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: colors.DARK_TEXT,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.INPUT_BG,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.LIME,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.MUTED_ON_CARD,
    fontFamily: FontFamily.BOLD,
  },
  tabButtonTextActive: {
    color: colors.DARK_TEXT,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.DARK_TEXT,
    marginBottom: 16,
    fontFamily: FontFamily.BOLD,
  },

  achievementsList: {
    gap: 16,
    marginTop: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.INPUT_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.INPUT_BORDER,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.DARK_TEXT,
    marginBottom: 4,
    fontFamily: FontFamily.BOLD,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
  },

  emptyAchievements: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyAchievementsText: {
    fontSize: 16,
    color: colors.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

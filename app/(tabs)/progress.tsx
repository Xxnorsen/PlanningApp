import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { progressApi, type ProgressData } from '@/services/api/progress';
import { tasksApi } from '@/services/api/tasks';
import { categoriesApi } from '@/services/api/categories';
import type { Task } from '@/types/task';
import type { Category } from '@/types/category';
import { plannerApi } from '@/services/api/planner';
import { CircularProgress } from '@/components/circular-progress';
import { WeeklyBarChart, type ProgressTab } from '@/components/weekly-bar-chart';

const { width } = Dimensions.get('window');

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface AchievementCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ icon, title, description, color }) => (
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


export default function ProgressScreen() {
  const router = useRouter();
  const { user, sessionSticker, rotateSticker } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ProgressTab>('Weekly');
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

    const [p, t, c, todayPlan] = await Promise.all([
  progressApi.get().catch(() => null),
  tasksApi.getCompleted().catch(() => []),
  categoriesApi.getAll().catch(() => []),
  plannerApi.getDaily(toIsoDate(today)).catch(() => ({ date: '', tasks: [] })),
]);

    // Merge today's planner tasks into completed list
    const todayCompleted = todayPlan.tasks.filter(t => t.status === 'completed');
    
    // Combine: use a Map to avoid duplicates, planner data takes priority for today
    const taskMap = new Map<string, Task>();
    t.forEach(task => taskMap.set(task.id, task));
    todayCompleted.forEach(task => taskMap.set(task.id, {
      ...task,
      // Ensure completedAt is set so daily chart can filter correctly
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

  const completionRate = progress?.completionRate ?? 65;
  const almostDone = completionRate >= 70;

  // Check for Early Bird achievement (3 tasks completed before 10 AM)
  const earlyBirdTasks = tasks.filter(task => {
    if (!task.completedAt) return false;
    const completedTime = new Date(task.completedAt);
    return completedTime.getHours() < 10; // Before 10 AM
  });
  const hasEarlyBirdAchievement = earlyBirdTasks.length >= 3;

  // Check for Foodie Master achievement (all food-related tasks completed)
  const foodCategory = categories.find(cat => 
    cat.name.toLowerCase().includes('food') || 
    cat.name.toLowerCase().includes('restaurant') ||
    cat.name.toLowerCase().includes('dining')
  );
  
  const foodTasks = tasks.filter(task => 
    task.categoryId && foodCategory && task.categoryId === foodCategory.id
  );
  
  const totalFoodTasks = [...tasks].filter(task => 
    task.categoryId && foodCategory && task.categoryId === foodCategory.id
  ).length;
  
  const hasFoodieMasterAchievement = foodCategory && totalFoodTasks > 0 && 
    foodTasks.every(task => task.status === 'completed');

  // Check if there are any achievements
  const hasAnyAchievements = hasEarlyBirdAchievement || hasFoodieMasterAchievement;

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
                onPress={() => router.push('/(tabs)/planner')}
              >
                <Ionicons name="arrow-forward" size={18} color={COLORS.DARK_TEXT} />
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
              <Text style={styles.todaySubtitle}>Your Progress is</Text>
              <Text style={styles.todayTitle}>
                {almostDone ? 'Almost Done!' : `${completionRate}% Complete`}
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

          {/* Session sticker — rotates on each login */}
          <Image
            source={stickerSource}
            style={styles.sessionSticker}
            resizeMode="contain"
          />

          <Text style={styles.sectionTitle}>Progress Overview</Text>
          
          <View style={styles.tabContainer}>
            <TabButton
              title="Daily"
              isActive={selectedTab === 'Daily'}
              onPress={() => setSelectedTab('Daily')}
            />
            <TabButton
              title="Weekly"
              isActive={selectedTab === 'Weekly'}
              onPress={() => setSelectedTab('Weekly')}
            />
            <TabButton
              title="Monthly"
              isActive={selectedTab === 'Monthly'}
              onPress={() => setSelectedTab('Monthly')}
            />
          </View>

          <Text style={styles.sectionSubtitle}>This Completed Tasks</Text>
          <WeeklyBarChart tasks={tasks} selectedTab={selectedTab} />

          <Text style={styles.sectionTitle}>Achievements</Text>
          
          {hasAnyAchievements ? (
            <View style={styles.achievementsList}>
              {hasEarlyBirdAchievement && (
                <AchievementCard
                  icon="sunny-outline"
                  title="Early Bird"
                  description={`${earlyBirdTasks.length} tasks completed before 9 AM`}
                  color="#FFA502"
                />
              )}
              {hasFoodieMasterAchievement && (
                <AchievementCard
                  icon="restaurant-outline"
                  title="Foodie Master"
                  description={`Completed all ${totalFoodTasks} Food-related tasks`}
                  color="#FF6B6B"
                />
              )}
            </View>
          ) : (
            <View style={styles.emptyAchievements}>
              <Ionicons
                name="trophy-outline"
                size={48}
                color={COLORS.INPUT_BORDER}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { flexGrow: 1 },

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

  card: {
    flexGrow: 1,
    backgroundColor: COLORS.CARD,
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
    backgroundColor: COLORS.INPUT_BORDER,
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
    color: COLORS.DARK_TEXT,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.INPUT_BG,
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
    backgroundColor: COLORS.LIME,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.BOLD,
  },
  tabButtonTextActive: {
    color: COLORS.DARK_TEXT,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK_TEXT,
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
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
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
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
    fontFamily: FontFamily.BOLD,
  },
  achievementDescription: {
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
  },

  emptyAchievements: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyAchievementsText: {
    fontSize: 16,
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

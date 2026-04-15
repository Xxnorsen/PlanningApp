import React, { useRef, useEffect } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
    Image,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');
import { HeaderLottie } from '@/components/ui/header-lottie.web';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskGroup {
  id: string;
  name: string;
  taskCount: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface InProgressTask {
  id: string;
  category: string;
  title: string;
  categoryIcon: string;
  cardBg: string;
  iconBg: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const IN_PROGRESS: InProgressTask[] = [
  {
    id: '1',
    category: 'Office Project',
    title: 'Grocery shopping app design',
    categoryIcon: '🛍️',
    cardBg: '#EEF0FF',
    iconBg: '#D8DCFF',
  },
  {
    id: '2',
    category: 'Personal Project',
    title: 'Uber Eats redesign challenge',
    categoryIcon: '🍔',
    cardBg: '#FFF0EE',
    iconBg: '#FFD8D3',
  },
];

const TASK_GROUPS: TaskGroup[] = [
  {
    id: '1',
    name: 'Office Project',
    taskCount: 23,
    icon: '💼',
    iconBg: '#EEF0FF',
    iconColor: '#6B4EFF',
  },
  {
    id: '2',
    name: 'Personal Project',
    taskCount: 30,
    icon: '👤',
    iconBg: '#F0F0FF',
    iconColor: '#6B4EFF',
  },
  {
    id: '3',
    name: 'Daily Study',
    taskCount: 30,
    icon: '📖',
    iconBg: '#FFF4EE',
    iconColor: '#FF8C42',
  },
  {
    id: '4',
    name: 'Daily Study',
    taskCount: 3,
    icon: '📚',
    iconBg: '#FFFBEE',
    iconColor: '#FFB800',
  },
];

// ─── Circular Progress ────────────────────────────────────────────────────────

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const size = 80;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
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
      {/* Foreground arc — simulated with a rotated View */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'white',
          borderTopColor: 'white',
          borderRightColor: 'white',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: 'white',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '90deg' }],
        }}
      />
      {/* Label */}
      <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
        {progress}%
      </Text>
    </View>
  );
};

// ─── In Progress Card ─────────────────────────────────────────────────────────

const InProgressCard: React.FC<{ task: InProgressTask }> = ({ task }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[styles.inProgressCard, { backgroundColor: task.cardBg }]}
  >
    <View style={styles.inProgressCardHeader}>
      <Text style={styles.inProgressCategory}>{task.category}</Text>
      <View style={[styles.categoryIconBadge, { backgroundColor: task.iconBg }]}>
        <Text style={{ fontSize: 14 }}>{task.categoryIcon}</Text>
      </View>
    </View>
    <Text style={styles.inProgressTitle}>{task.title}</Text>
  </TouchableOpacity>
);

// ─── Task Group Row ───────────────────────────────────────────────────────────

const TaskGroupRow: React.FC<{ group: TaskGroup; delay: number }> = ({ group, delay }) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, );

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <TouchableOpacity activeOpacity={0.8} style={styles.taskGroupRow}>
        <View style={[styles.taskGroupIcon, { backgroundColor: group.iconBg }]}>
          <Text style={{ fontSize: 20 }}>{group.icon}</Text>
        </View>
        <View style={styles.taskGroupInfo}>
          <Text style={styles.taskGroupName}>{group.name}</Text>
          <Text style={styles.taskGroupCount}>{group.taskCount} Tasks</Text>
        </View>
        <Text style={styles.taskGroupChevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────



// ─── Main Screen ──────────────────────────────────────────────────────────────

const TaskDashboard: React.FC = () => {
  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Top Header ── */}
        <View style={styles.topHeader}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👩</Text>
            </View>
            <View>
              <Text style={styles.helloText}>Hello!</Text>
              <Text style={styles.userName}>USER</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
        

        {/* ── Today Banner ── */}
        <Animated.View style={[styles.todayBanner, { transform: [{ scale: headerScale }], opacity: headerOpacity }]}>
          <View style={styles.todayLeft}>
            <Text style={styles.todaySubtitle}>Your Today is</Text>
            <Text style={styles.todayTitle}>Almost Done!</Text>
            <TouchableOpacity style={styles.viewTasksBtn} activeOpacity={0.85}>
              <Text style={styles.viewTasksText}>View Tasks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.todayRight}>
            <View style={styles.menuDots}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>···</Text>
            </View>
            <CircularProgress progress={85} />
          </View>
        </Animated.View>

        {/* ── In Progress ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>6</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inProgressScroll}
        >
          {IN_PROGRESS.map(task => (
            <InProgressCard key={task.id} task={task} />
          ))}
        </ScrollView>

        {/* ── Task Groups ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Task Groups</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>4</Text>
          </View>
        </View>

        <View style={styles.taskGroupsList}>
          {TASK_GROUPS.map((group, i) => (
            <TaskGroupRow key={group.id + i} group={group} delay={i * 80} />
          ))}
        </View>
      </ScrollView>

      
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F7FB',
    marginTop:20


  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0D9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 16,
  },

  // Today Banner
  todayBanner: {
    backgroundColor: '#6B4EFF',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  todayLeft: {
    flex: 1,
  },
  todaySubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  todayTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 16,
  },
  viewTasksBtn: {
    backgroundColor: 'white',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  viewTasksText: {
    color: '#6B4EFF',
    fontWeight: '700',
    fontSize: 13,
  },
  todayRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  menuDots: {
    alignSelf: 'flex-end',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  sectionBadge: {
    backgroundColor: '#E8E4FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: '#6B4EFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // In Progress
  inProgressScroll: {
    paddingRight: 20,
    gap: 12,
    marginBottom: 28,
  },
  inProgressCard: {
    width: width * 0.45,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  inProgressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inProgressCategory: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    flex: 1,
  },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 20,
  },

  // Task Groups
  taskGroupsList: {
    gap: 10,
  },
  taskGroupRow: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskGroupIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskGroupInfo: {
    flex: 1,
  },
  taskGroupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  taskGroupCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  taskGroupChevron: {
    fontSize: 22,
    color: '#CCC',
    fontWeight: '300',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default TaskDashboard;
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { COLORS } from '@/src/constants/colors';
import { FontFamily } from '@/src/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { categoriesApi } from '@/services/api/categories';
import { tasksApi } from '@/services/api/tasks';
import type { Category } from '@/types/category';
import type { Task } from '@/types/task';

const { width } = Dimensions.get('window');

// ── Category Card Component ─────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category;
  taskCount: number;
  projectCount: number;
  progress: number;
  onPress: () => void;
  onEdit: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  taskCount, 
  projectCount, 
  progress, 
  onPress,
  onEdit
}) => {
  const getIconName = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('work')) return 'laptop-outline';
    if (name.includes('fitness')) return 'fitness-outline';
    if (name.includes('grocer')) return 'cart-outline';
    if (name.includes('study')) return 'book-outline';
    return 'folder-outline';
  };

  const getSecondaryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('work')) return 'settings-outline';
    if (name.includes('fitness')) return 'create-outline';
    if (name.includes('grocer')) return 'settings-outline';
    if (name.includes('study')) return 'create-outline';
    return 'ellipsis-horizontal-outline';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return COLORS.LIME;
    if (progress >= 50) return '#FFA502';
    if (progress >= 25) return '#FF6B6B';
    return '#FF4757';
  };

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIcons}>
          <View style={styles.categoryIcon}>
            <Ionicons 
              name={getIconName(category.name)} 
              size={20} 
              color={COLORS.DARK_TEXT} 
            />
          </View>
          <View style={styles.categoryIconSecondary}>
            <Ionicons 
              name={getSecondaryIcon(category.name)} 
              size={16} 
              color={COLORS.MUTED_ON_CARD} 
            />
          </View>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => onEdit(category)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="create-outline" 
              size={16} 
              color={COLORS.MUTED_ON_CARD} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.progressCircle}>
          <View style={[
            styles.progressRing,
            { borderColor: getProgressColor(progress) }
          ]}>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryStats}>
        {projectCount} {projectCount === 1 ? 'Project' : 'Projects'}, {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
      </Text>
    </TouchableOpacity>
  );
};

// ── Main Group Screen Component ───────────────────────────────────────────────

export default function GroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userName = (user?.name ?? 'NORSEN').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'N').toUpperCase();

  const stickerSources = [
    require('@/assets/stickers/cat1.png'),
    require('@/assets/stickers/cat2.png'),
    require('@/assets/stickers/cat3.png'),
    require('@/assets/stickers/halloween.png'),
  ];
  const stickerSource = stickerSources[0]; // Use first cat for group page

  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, tsks] = await Promise.all([
        categoriesApi.getAll().catch(() => []),
        tasksApi.getAll().catch(() => []),
      ]);
      setCategories(cats);
      setTasks(tsks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerScale]);

  // Calculate stats for each category
  const getCategoryStats = (categoryId: string) => {
    const categoryTasks = tasks.filter(task => task.categoryId === categoryId);
    const completedTasks = categoryTasks.filter(task => task.status === 'completed');
    const progress = categoryTasks.length > 0 
      ? Math.round((completedTasks.length / categoryTasks.length) * 100)
      : 0;
    
    // For demo purposes, simulate project counts
    const projectCount = Math.floor(Math.random() * 5) + 1;
    
    return {
      taskCount: categoryTasks.length,
      projectCount,
      progress
    };
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayCategories = filteredCategories;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loaderWrap}>
          <Animated.View style={{ transform: [{ scale: headerScale }], opacity: headerOpacity }}>
            <View style={styles.hero}>
              <View style={styles.circleLarge} />
              <View style={styles.circleMedium} />
              <View style={styles.circleDot} />
            </View>
          </Animated.View>
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
      >
        {/* ── Purple hero with background and cat ── */}
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

          {/* Cat animation with boxes */}
          <Animated.View
            style={[
              styles.catContainer,
              { transform: [{ scale: headerScale }], opacity: headerOpacity },
            ]}
          >
            <Image
              source={stickerSource}
              style={styles.catImage}
              resizeMode="contain"
            />
            <View style={styles.boxesContainer}>
              <View style={[styles.box, styles.workBox]}>
                <Text style={styles.boxText}>Work</Text>
              </View>
              <View style={[styles.box, styles.fitnessBox]}>
                <Text style={styles.boxText}>Fitness</Text>
              </View>
              <View style={[styles.box, styles.groceriesBox]}>
                <Text style={styles.boxText}>Groceries</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── White card with categories ── */}
        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.sectionTitle}>All Task Categories</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={COLORS.MUTED_ON_CARD} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Find categories..."
              placeholderTextColor={COLORS.MUTED_ON_CARD}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.categoryCount}>
            total categories: {displayCategories.length}
          </Text>

          <View style={styles.categoriesList}>
            {displayCategories.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons 
                  name="list-outline" 
                  size={64} 
                  color={COLORS.INPUT_BORDER} 
                />
                <Text style={styles.emptyStateText}>
                  Your to-do list is looking suspiciously clear... almost too clear. Time to stir up some trouble!
                </Text>
              </View>
            ) : (
              displayCategories.map((category) => {
                const stats = getCategoryStats(category.id);
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    taskCount={stats.taskCount}
                    projectCount={stats.projectCount}
                    progress={stats.progress}
                    onPress={() => router.push('/(tabs)/planner' as any)}
                    onEdit={(category) => router.push(`/EditCategory?id=${category.id}` as any)}
                  />
                );
              })
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.manageButton]}
              onPress={() => router.push('/(tabs)/planner' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.manageButtonText}>Manage Categories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={() => router.push('/create-categories')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Create New categories</Text>
            </TouchableOpacity>
          </View>
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

  catContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  catImage: {
    width: 120,
    height: 120,
  },
  boxesContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  box: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  workBox: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  fitnessBox: {
    backgroundColor: '#E5F9F6',
    borderColor: '#4ECDC4',
  },
  groceriesBox: {
    backgroundColor: '#E5F4F8',
    borderColor: '#45B7D1',
  },
  boxText: {
    fontSize: 12,
    fontFamily: FontFamily.BOLD,
    color: COLORS.DARK_TEXT,
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

  sectionTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 22,
    color: COLORS.DARK_TEXT,
    marginBottom: 16,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    fontFamily: FontFamily.REGULAR,
  },

  categoryCount: {
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
    marginBottom: 20,
  },

  categoriesList: {
    gap: 16,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 20,
  },
  emptyStateText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 18,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
    lineHeight: 26,
  },

  categoryCard: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.LIME,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryIconSecondary: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  editIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  progressCircle: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  progressRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 4,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    fontFamily: FontFamily.BOLD,
    color: COLORS.DARK_TEXT,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: FontFamily.BOLD,
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
  },

  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.LIME,
  },
  createButton: {
    backgroundColor: COLORS.LIME,
  },
  manageButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.BOLD,
    color: COLORS.LIME,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.BOLD,
    color: COLORS.DARK_TEXT,
  },
});

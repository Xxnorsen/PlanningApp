import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { tasksApi } from '@/services/api/tasks';
import { showApiErrorAlert, toApiError } from '@/services/api/errors';
import { useTasks } from '@/context/task-context';
import { useCategories } from '@/context/category-context';
import { useTheme } from '@/context/theme-context';
import { LoadingCat } from '@/components/ui/loading-cat';
import type { Task } from '@/types/task';

export default function CompletedScreen() {
  const router = useRouter();
  const { toggleComplete } = useTasks();
  const { categories, fetchAll: fetchCategories } = useCategories();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setTasks(await tasksApi.getCompleted());
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      showApiErrorAlert(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories().catch(() => {});
      load();
    }, [fetchCategories, load]),
  );

  const categoryName = (id?: string) => {
    if (!id) return undefined;
    return categories.find((c) => c.id === id)?.name;
  };

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const cat = categoryName(t.categoryId)?.toLowerCase() ?? '';
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        cat.includes(q)
      );
    });
    // categoryName depends on `categories` state which is already a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, query, categories]);

  const handleUndo = async (task: Task) => {
    try {
      await toggleComplete(task);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      showApiErrorAlert(e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Completed</Text>
          <View style={styles.backBtnSpacer} />
        </View>
        <Text style={styles.heroSubtitle}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} done
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.handle} />

        {!loading && tasks.length > 0 && (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={COLORS.MUTED_ON_CARD} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search completed tasks"
              placeholderTextColor={COLORS.MUTED_ON_CARD}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={COLORS.MUTED_ON_CARD} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <LoadingCat size={120} />
          </View>
        ) : error && tasks.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={42} color={colors.LIME} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="checkmark-done-circle-outline" size={42} color={colors.INPUT_BORDER} />
            <Text style={styles.emptyText}>No completed tasks yet.</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={42} color={COLORS.INPUT_BORDER} />
            <Text style={styles.emptyText}>No tasks match &quot;{query}&quot;.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.LIME}
              />
            }
          >
            {filteredTasks.map((task) => (
              <View key={task.id} style={styles.row}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={14} color="#2ED573" />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{task.title}</Text>
                  {categoryName(task.categoryId) ? (
                    <Text style={styles.rowMeta}>{categoryName(task.categoryId)}</Text>
                  ) : null}
                  {task.dueDate ? (
                    <Text style={styles.rowMeta}>Due: {task.dueDate.slice(0, 10)}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleUndo(task)}
                  hitSlop={8}
                  activeOpacity={0.7}
                  style={styles.undoBtn}
                >
                  <Ionicons name="arrow-undo-outline" size={18} color={colors.MUTED_ON_CARD} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.BACKGROUND },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.LIME,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnSpacer: { width: 38, height: 38 },
  heroTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: colors.WHITE_TEXT,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: colors.MUTED_ON_DARK,
  },
  card: {
    flex: 1,
    backgroundColor: colors.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.INPUT_BORDER,
    alignSelf: 'center', marginBottom: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.DARK_TEXT,
    paddingVertical: 4,
  },
  list: { gap: 10, paddingBottom: 120 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.INPUT_BG, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.INPUT_BORDER,
  },
  checkIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8F9EE', alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontFamily: FontFamily.BOLD, fontSize: 14, color: colors.MUTED_ON_CARD,
    textDecorationLine: 'line-through',
  },
  rowMeta: {
    fontFamily: FontFamily.REGULAR, fontSize: 11,
    color: colors.MUTED_ON_CARD, marginTop: 2,
  },
  undoBtn: { padding: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  errorText: { fontFamily: FontFamily.REGULAR, fontSize: 14, color: colors.DARK_TEXT, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.LIME,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    fontFamily: FontFamily.BOLD, fontSize: 14, color: COLORS.DARK_TEXT,
  },
  emptyText: {
    fontFamily: FontFamily.REGULAR, fontSize: 14, color: colors.MUTED_ON_CARD,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useTheme } from '@/context/theme-context';
import type { Task } from '@/types/task';

export type ProgressTab = 'Weekly' | 'Monthly';

interface Props {
  tasks: Task[];
  selectedTab: ProgressTab;
}

type BarDatum = { day: string; value: number };

// Returns the best available date for when a task was completed.
// Priority: completedAt > dueDate (parsed as local date) > updatedAt.
// dueDate is preferred over updatedAt because updatedAt can reflect
// today's sync/fetch time rather than the actual completion day.
function resolveTaskDate(task: Task): Date | null {
  if (task.completedAt) return new Date(task.completedAt);
  if (task.dueDate) {
    const [y, m, d] = task.dueDate.slice(0, 10).split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  if (task.updatedAt) return new Date(task.updatedAt);
  return null;
}


function getWeeklyData(tasks: Task[]): BarDatum[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  return days.map((day, index) => {
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const count = tasks.filter(task => {
      if (task.status !== 'completed') return false;
      const d = resolveTaskDate(task);
      if (!d) return false;
      return d >= start && d < end;
    }).length;

    return { day, value: count };
  });
}

function getMonthlyData(tasks: Task[]): BarDatum[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: BarDatum[] = [];
  for (let week = 0; week < 4; week++) {
    const startDay = week * 7 + 1;
    const endDay = Math.min(startDay + 6, daysInMonth);
    const start = new Date(year, month, startDay);
    const end = new Date(year, month, endDay + 1);

    const count = tasks.filter(task => {
      if (task.status !== 'completed') return false;
      const d = resolveTaskDate(task);
      if (!d) return false;
      return d >= start && d < end;
    }).length;

    weeks.push({ day: `W${week + 1}`, value: count });
  }

  return weeks;
}

export function WeeklyBarChart({ tasks, selectedTab }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const data = selectedTab === 'Monthly' ? getMonthlyData(tasks) : getWeeklyData(tasks);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const hasAnyData = data.some(item => item.value > 0);

  if (!hasAnyData) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bar-chart-outline" size={48} color={colors.INPUT_BORDER} />
        <Text style={styles.emptyText}>
          Every big goal starts with a small task. Complete one to unlock your first Task!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((item, index) => {
          const barHeight = item.value === 0
            ? 4
            : Math.max(8, (item.value / maxValue) * 100);
          const barColor = item.value === 0
            ? colors.INPUT_BORDER
            : item.value === maxValue
              ? colors.LIME
              : '#E8F9EE';
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]} />
              <Text style={styles.day}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

type AppColors = { readonly [K in keyof typeof COLORS]: string };

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { height: 150 },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  day: {
    fontSize: 10,
    color: colors.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

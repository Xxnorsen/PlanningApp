import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import type { Task } from '@/types/task';

export type ProgressTab = 'Daily' | 'Weekly' | 'Monthly';

interface Props {
  tasks: Task[];
  selectedTab: ProgressTab;
}

type BarDatum = { day: string; value: number };

function getDailyData(tasks: Task[]): BarDatum[] {
  const today = new Date();
  const currentHour = today.getHours();

  const blocks = [
    { start: 0,  end: 2,  label: '12AM' },
    { start: 3,  end: 5,  label: '3AM'  },
    { start: 6,  end: 8,  label: '6AM'  },
    { start: 9,  end: 11, label: '9AM' },
    { start: 12, end: 14, label: '12PM' },
    { start: 15, end: 17, label: '3PM'  },
    { start: 18, end: 20, label: '6PM'  },
    { start: 21, end: 23, label: '9PM' },
  ];

  const todayCompleted = tasks.filter(task => {
    if (task.status !== 'completed') return false;
    const ref = task.completedAt ?? task.dueDate;
    if (!ref) return false;
    const d = new Date(ref);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const currentBlockIndex = blocks.findIndex(
    b => currentHour >= b.start && currentHour <= b.end
  );

  return blocks.map((block, index) => {
    const isCurrentBlock = index === currentBlockIndex;
    const value = isCurrentBlock
      ? Math.min(100, (todayCompleted.length / 3) * 100)
      : 0;
    return { day: block.label, value };
  });
}

function getWeeklyData(tasks: Task[]): BarDatum[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return days.map((day, index) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - today.getDay() + index);

    const dayTasks = tasks.filter(task => {
      if (task.status !== 'completed') return false;
      if (task.completedAt) {
        return new Date(task.completedAt).toDateString() === targetDate.toDateString();
      }
      return new Date(task.updatedAt).toDateString() === targetDate.toDateString();
    });

    const completionRate = Math.min(100, (dayTasks.length / 10) * 100);
    return { day: day.slice(0, 3), value: completionRate };
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

    const weekTasks = tasks.filter(task => {
      if (task.status !== 'completed') return false;
      const ref = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
      return (
        ref.getFullYear() === year &&
        ref.getMonth() === month &&
        ref.getDate() >= startDay &&
        ref.getDate() <= endDay
      );
    });

    weeks.push({
      day: `W${week + 1}`,
      value: Math.min(100, (weekTasks.length / 20) * 100),
    });
  }

  return weeks;
}

export function WeeklyBarChart({ tasks, selectedTab }: Props) {
  const data =
    selectedTab === 'Daily'
      ? getDailyData(tasks)
      : selectedTab === 'Monthly'
        ? getMonthlyData(tasks)
        : getWeeklyData(tasks);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const hasProgress = data.some(item => item.value > 0);

  if (!hasProgress) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bar-chart-outline" size={48} color={COLORS.INPUT_BORDER} />
        <Text style={styles.emptyText}>
          Every big goal starts with a small task. Complete one to unlock your first Task!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: (item.value / maxValue) * 100,
                  backgroundColor: item.value > 70 ? COLORS.LIME : '#E8F9EE',
                },
              ]}
            />
            <Text style={styles.day}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.MUTED_ON_CARD,
    fontFamily: FontFamily.REGULAR,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

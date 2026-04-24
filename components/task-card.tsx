import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import type { Task, TaskPriority } from '@/types/task';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const priorityIcon: Record<TaskPriority, { icon: IoniconName; bg: string; color: string }> = {
  high:   { icon: 'flame',         bg: '#FFECEE', color: '#FF4757' },
  medium: { icon: 'remove-circle', bg: '#FFF4E5', color: '#FFA502' },
  low:    { icon: 'leaf',          bg: '#E8F9EE', color: '#2ED573' },
};

const statusStyle = {
  Done:          { bg: '#E8F9EE', text: '#2ED573' },
  'In Progress': { bg: '#FFF4E5', text: '#FFA502' },
  'To-do':       { bg: COLORS.INPUT_BG, text: COLORS.BACKGROUND },
};

export type TaskStatusLabel = keyof typeof statusStyle;

export function taskStatusLabel(t: Task): TaskStatusLabel {
  return t.status === 'completed' ? 'Done' : 'To-do';
}

function formatTime(iso?: string): string {
  if (!iso) return 'No time';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  task: Task;
  categoryName?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (task: Task) => void;
}

export function TaskCard({ task, categoryName, onEdit, onDelete, onToggle }: Props) {
  const status = taskStatusLabel(task);
  const s = statusStyle[status];
  const p = priorityIcon[task.priority];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.projectName}>{categoryName ?? 'General'}</Text>
        <View style={[styles.iconCircle, { backgroundColor: p.bg }]}>
          <Ionicons name={p.icon} size={16} color={p.color} />
        </View>
      </View>
      <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
      {task.description ? (
        <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
      ) : null}
      <View style={styles.cardMeta}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.MUTED_ON_CARD} />
          <Text style={styles.timeText}>{formatTime(task.dueDate)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => onToggle(task)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={task.status === 'completed' ? 'refresh-outline' : 'checkmark'}
            size={16}
            color={COLORS.DARK_TEXT}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(task.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(task.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    flex: 1,
  },
  iconCircle: {
    width: 34, height: 34, borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
  },
  taskDesc: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 13,
    color: COLORS.MUTED_ON_CARD,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: FontFamily.BOLD, fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  completeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.LIME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  editBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  deleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: '#FF4757',
    fontSize: 14,
  },
});

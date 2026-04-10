import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
}

// SCRUM-4 / SCRUM-8: Task card UI to be implemented
export function TaskCard({ task, onPress, onToggleComplete }: TaskCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(task)}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onToggleComplete?.(task)} style={styles.checkbox} />
        <ThemedText>{task.title}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});

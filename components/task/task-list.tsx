import { FlatList, StyleSheet } from 'react-native';
import { TaskCard } from './task-card';
import type { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
}

// SCRUM-4: Task list to be implemented
export function TaskList({ tasks, onTaskPress, onToggleComplete }: TaskListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          onPress={onTaskPress}
          onToggleComplete={onToggleComplete}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

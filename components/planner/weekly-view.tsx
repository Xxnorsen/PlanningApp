import { View, StyleSheet } from 'react-native';
import type { Task } from '@/types/task';

interface WeeklyViewProps {
  weekStart: Date;
  tasks: Task[];
}

// SCRUM-9: Weekly planner view to be implemented
export function WeeklyView({ weekStart, tasks }: WeeklyViewProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

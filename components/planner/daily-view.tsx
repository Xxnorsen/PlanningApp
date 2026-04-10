import { View, StyleSheet } from 'react-native';
import type { Task } from '@/types/task';

interface DailyViewProps {
  date: Date;
  tasks: Task[];
}

// SCRUM-9: Daily planner view to be implemented
export function DailyView({ date, tasks }: DailyViewProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

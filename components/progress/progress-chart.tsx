import { View, StyleSheet } from 'react-native';

interface ProgressChartProps {
  completed: number;
  total: number;
  period?: 'week' | 'month';
}

// SCRUM-12: Progress chart to be implemented
export function ProgressChart({ completed, total, period = 'week' }: ProgressChartProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

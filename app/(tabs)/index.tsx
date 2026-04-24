import { View, StyleSheet } from 'react-native';
import TaskDashboard from '@/components/task-dashboard';
import { COLORS } from '@/constants/colors';

export default function TasksScreen() {
  return (
    <View style={styles.root}>
      <TaskDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BACKGROUND },
});

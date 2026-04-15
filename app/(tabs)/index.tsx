import { View, StyleSheet } from 'react-native';
import TaskDashboard from '../../src/screens/TaskDashboard';
import { COLORS } from '../../src/constants/colors';

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

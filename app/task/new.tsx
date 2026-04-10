import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

// SCRUM-4: Add Task UI to be implemented
export default function NewTaskScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">New Task</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

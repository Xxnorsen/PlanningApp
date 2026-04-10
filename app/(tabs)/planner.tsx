import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

// SCRUM-9: Planner screen (Daily & Weekly) to be implemented
export default function PlannerScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Planner</ThemedText>
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

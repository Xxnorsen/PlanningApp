import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

// SCRUM-12: Progress tracking screen to be implemented
export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>
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

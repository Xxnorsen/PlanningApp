import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

// SCRUM-2: UI to be implemented
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Login</ThemedText>
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

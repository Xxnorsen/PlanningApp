import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

// SCRUM-6: Categories module to be implemented
export default function CategoriesScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Categories</ThemedText>
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

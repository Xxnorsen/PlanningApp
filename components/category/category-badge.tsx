import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Category } from '@/types/category';

interface CategoryBadgeProps {
  category: Category;
}

// SCRUM-6: Category badge to be implemented
export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: category.color }]}>
      <ThemedText style={styles.label}>{category.name}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

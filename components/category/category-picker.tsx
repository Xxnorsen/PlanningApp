import { View, StyleSheet } from 'react-native';
import type { Category } from '@/types/category';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}

// SCRUM-6: Category picker to be implemented
export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

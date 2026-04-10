import { View, StyleSheet } from 'react-native';
import type { CreateTaskPayload } from '@/types/task';

interface TaskFormProps {
  initialValues?: Partial<CreateTaskPayload>;
  onSubmit: (values: CreateTaskPayload) => void;
}

// SCRUM-4 / SCRUM-5: Task form (create & edit) to be implemented
export function TaskForm({ initialValues, onSubmit }: TaskFormProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

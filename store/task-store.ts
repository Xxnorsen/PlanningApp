import type { Task } from '@/types/task';

// SCRUM-4 / SCRUM-5 / SCRUM-10: Task state management — replace with Zustand/Context in implementation
export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  selectedTaskId: string | null;
}

export const initialTaskState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  selectedTaskId: null,
};

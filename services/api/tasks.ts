import { apiClient } from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';
import { normalizeTaskRaw } from './task-utils';

function toYmd(input: string | undefined | null): string | null {
  if (!input) return null;
  // Accept "YYYY-MM-DD" or full ISO — strip the time portion.
  return input.length >= 10 ? input.slice(0, 10) : input;
}

function toApiPayload(payload: CreateTaskPayload | UpdateTaskPayload) {
  const body: Record<string, unknown> = {
    title: (payload as CreateTaskPayload).title,
    description: payload.description ?? null,
    priority: payload.priority ?? 'medium',
    category_id: payload.categoryId ? Number(payload.categoryId) : null,
    due_date: toYmd(payload.dueDate),
  };
  const status = (payload as UpdateTaskPayload).status;
  if (status !== undefined) {
    body.completed = status === 'completed';
    body.status = status;
  }
  return body;
}

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/');
    return data.map(normalizeTaskRaw);
  },

  getActive: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/active/');
    return data.map(normalizeTaskRaw);
  },

  getCompleted: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/completed/');
    return data.map(normalizeTaskRaw);
  },

  getToday: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/today/');
    return data.map(normalizeTaskRaw);
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}/`);
    return normalizeTaskRaw(data);
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post('/tasks/', toApiPayload(payload));
    return normalizeTaskRaw(data);
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${id}/`, toApiPayload(payload));
    return normalizeTaskRaw(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/`);
  },

  /**
   * Toggle completion by sending a full PUT with the `completed` flag.
   * The dedicated PATCH /tasks/{id}/complete endpoint was unreliable —
   * PUT is the same endpoint used for editing and is known to persist.
   */
  setCompleted: async (task: Task, completed: boolean): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${task.id}/`, {
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      category_id: task.categoryId ? Number(task.categoryId) : null,
      due_date: toYmd(task.dueDate),
      completed,
    });
    return normalizeTaskRaw(data);
  },
};

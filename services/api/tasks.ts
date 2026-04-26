import { apiClient } from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';
import { normalizeTaskRaw } from './task-utils';
import { inProgressStore } from '@/services/in-progress-store';

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
  }
  return body;
}

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/');
    await inProgressStore.init();
    return inProgressStore.applyOverlayList(data.map(normalizeTaskRaw));
  },

  getActive: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/active/');
    await inProgressStore.init();
    return inProgressStore.applyOverlayList(data.map(normalizeTaskRaw));
  },

  getCompleted: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/completed/');
    return data.map(normalizeTaskRaw);
  },

  getToday: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<any[]>('/tasks/today/');
    await inProgressStore.init();
    return inProgressStore.applyOverlayList(data.map(normalizeTaskRaw));
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    await inProgressStore.init();
    return inProgressStore.applyOverlay(normalizeTaskRaw(data));
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post('/tasks/', toApiPayload(payload));
    return normalizeTaskRaw(data);
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${id}`, toApiPayload(payload));
    await inProgressStore.init();
    return inProgressStore.applyOverlay(normalizeTaskRaw(data));
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
    await inProgressStore.remove(id);
  },

  /**
   * Toggle completion by sending a full PUT with the `completed` flag.
   * The dedicated PATCH /tasks/{id}/complete endpoint was unreliable —
   * PUT is the same endpoint used for editing and is known to persist.
   */
  setCompleted: async (task: Task, completed: boolean): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${task.id}`, {
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      category_id: task.categoryId ? Number(task.categoryId) : null,
      due_date: toYmd(task.dueDate),
      completed,
    });
    if (completed) await inProgressStore.remove(task.id);
    await inProgressStore.init();
    return inProgressStore.applyOverlay(normalizeTaskRaw(data));
  },

  /** Mark/unmark a task as in-progress. Local-only — backend does not persist this. */
  setInProgress: async (task: Task, inProgress: boolean): Promise<Task> => {
    if (inProgress) {
      await inProgressStore.add(task.id);
      return { ...task, status: 'in_progress' };
    }
    await inProgressStore.remove(task.id);
    return { ...task, status: task.status === 'completed' ? 'completed' : 'pending' };
  },
};

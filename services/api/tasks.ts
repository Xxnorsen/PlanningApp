import { apiClient } from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';

// ── Raw API shape (snake_case) ────────────────────────────────────────────────

interface RawTask {
  id: number | string;
  title: string;
  description?: string | null;
  status?: string;
  is_completed?: boolean;
  priority: string;
  category_id?: number | string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeTask(raw: RawTask): Task {
  const isCompleted = raw.status === 'completed' || raw.is_completed === true;
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.description ?? undefined,
    status: isCompleted ? 'completed' : 'pending',
    priority: (raw.priority as Task['priority']) ?? 'medium',
    categoryId: raw.category_id != null ? String(raw.category_id) : undefined,
    dueDate: raw.due_date ?? undefined,
    completedAt: raw.completed_at ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toApiPayload(payload: CreateTaskPayload | UpdateTaskPayload) {
  return {
    title: (payload as CreateTaskPayload).title,
    description: payload.description ?? null,
    priority: payload.priority ?? 'medium',
    category_id: payload.categoryId ? Number(payload.categoryId) : null,
    due_date: payload.dueDate ?? null,
  };
}



// ── Tasks API ─────────────────────────────────────────────────────────────────

export const tasksApi = {
  /** GET /tasks/ — all tasks */
  getAll: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<RawTask[]>('/tasks/');
    return data.map(normalizeTask);
  },

  /** GET /tasks/active/ */
  getActive: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<RawTask[]>('/tasks/active/');
    return data.map(normalizeTask);
  },

  /** GET /tasks/completed/ */
  getCompleted: async (): Promise<Task[]> => {
  const { data } = await apiClient.get<RawTask[]>('/tasks/completed/');
  console.log('RAW /tasks/completed/ response:', JSON.stringify(data[0])); // log first task raw
  
  const fullTasks = await Promise.all(
    data.map(async (t: RawTask) => {
      try {
        const { data: full } = await apiClient.get<RawTask>(`/tasks/${t.id}`);
        console.log(`RAW /tasks/${t.id} response:`, JSON.stringify(full)); // log full task raw
        return normalizeTask(full);
      } catch {
        return normalizeTask(t);
      }
    })
  );
  
  return fullTasks;
},
  /** GET /tasks/today/ */
  getToday: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<RawTask[]>('/tasks/today/');
    return data.map(normalizeTask);
  },

  /** GET /tasks/{id} */
  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<RawTask>(`/tasks/${id}`);
    return normalizeTask(data);
  },

  /** POST /tasks/ */
  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post<RawTask>('/tasks/', toApiPayload(payload));
    return normalizeTask(data);
  },

  /** PUT /tasks/{id} — partial update allowed */
  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.put<RawTask>(`/tasks/${id}`, toApiPayload(payload));
    return normalizeTask(data);
  },

  /** DELETE /tasks/{id} */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  /** PATCH /tasks/{id}/complete */
  complete: async (id: string): Promise<Task> => {
  const { data } = await apiClient.patch<RawTask>(`/tasks/${id}/complete`);
  console.log('=== /tasks/complete raw response ===', JSON.stringify(data));
  return normalizeTask(data);
},

  /** PATCH /tasks/{id}/undo */
  undo: async (id: string): Promise<Task> => {
    const { data } = await apiClient.patch<RawTask>(`/tasks/${id}/undo`);
    return normalizeTask(data);
  },

  /** Toggle complete/undo depending on current status */
  toggleComplete: async (task: Task): Promise<Task> => {
  if (task.status === 'completed') {
    const result = await tasksApi.undo(task.id);
    // Force status in case API response is wrong
    return { ...result, status: 'pending' };
  } else {
    const result = await tasksApi.complete(task.id);
    // Force status in case API response is wrong
    return { ...result, status: 'completed' };
  }
},
  
};

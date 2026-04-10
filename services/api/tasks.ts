import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';

// SCRUM-4 / SCRUM-5: Tasks API to be implemented
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    throw new Error('Not implemented');
  },

  getById: async (id: string): Promise<Task> => {
    throw new Error('Not implemented');
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    throw new Error('Not implemented');
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    throw new Error('Not implemented');
  },

  delete: async (id: string): Promise<void> => {
    throw new Error('Not implemented');
  },

  toggleComplete: async (id: string): Promise<Task> => {
    throw new Error('Not implemented');
  },
};

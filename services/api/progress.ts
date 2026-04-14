import { apiClient } from './client';

export interface ProgressData {
  total: number;
  completed: number;
  pending: number;
  completionRate: number; // 0-100
}

interface RawProgress {
  total_tasks?: number;
  total?: number;
  completed_tasks?: number;
  completed?: number;
  pending_tasks?: number;
  pending?: number;
  completion_rate?: number;
}

export const progressApi = {
  /** GET /progress/progress */
  get: async (): Promise<ProgressData> => {
    const { data } = await apiClient.get<RawProgress>('/progress/progress');
    const total = data.total_tasks ?? data.total ?? 0;
    const completed = data.completed_tasks ?? data.completed ?? 0;
    const pending = data.pending_tasks ?? data.pending ?? total - completed;
    const rate = data.completion_rate ?? (total > 0 ? (completed / total) * 100 : 0);
    return { total, completed, pending, completionRate: Math.round(rate) };
  },
};

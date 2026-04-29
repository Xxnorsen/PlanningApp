import { apiClient } from './client';
import type { Task } from '@/types/task';
import { normalizeTaskRaw } from './task-utils';
import { inProgressStore } from '@/services/in-progress-store';

export interface DayPlan {
  date: string;
  tasks: Task[];
}

export interface WeeklyPlan {
  weekStart: string;
  days: DayPlan[];
}

interface RawWeeklyDay {
  date: string;
  tasks: any[];
}

interface RawWeeklyResponse {
  week_start?: string;
  start_date?: string;
  days?: RawWeeklyDay[];
}

export const plannerApi = {
  /** GET /planner/daily?date=YYYY-MM-DD — returns an array of TaskOut */
  getDaily: async (date: string): Promise<DayPlan> => {
  const { data } = await apiClient.get<any[] | { tasks?: any[] }>('/planner/daily', {
    params: { date },
  });
  const raw = Array.isArray(data) ? data : (data.tasks ?? []);
  
  await inProgressStore.init();
  return { date, tasks: inProgressStore.applyOverlayList(raw.map(normalizeTaskRaw)) };
},

  /** GET /planner/weekly?start_date=YYYY-MM-DD */
  getWeekly: async (startDate: string): Promise<WeeklyPlan> => {
    const { data } = await apiClient.get<RawWeeklyResponse>('/planner/weekly', {
      params: { start_date: startDate },
    });
    await inProgressStore.init();
    const days: DayPlan[] = (data.days ?? []).map((d) => ({
      date: d.date,
      tasks: inProgressStore.applyOverlayList((d.tasks ?? []).map(normalizeTaskRaw)),
    }));
    return { weekStart: data.week_start ?? data.start_date ?? startDate, days };
  },
};

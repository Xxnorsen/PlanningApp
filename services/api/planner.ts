import { apiClient } from './client';
import type { Task } from '@/types/task';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DayPlan {
  date: string;
  tasks: Task[];
}

export interface WeeklyPlan {
  weekStart: string;
  days: DayPlan[];
}

// ── Raw shapes ────────────────────────────────────────────────────────────────

interface RawDailyResponse {
  date?: string;
  tasks?: any[];
  // some APIs return the tasks array directly
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

import { normalizeTaskRaw } from './task-utils';

// ── Planner API ───────────────────────────────────────────────────────────────

export const plannerApi = {
  /** GET /planner/daily?date=YYYY-MM-DD */
  getDaily: async (date: string): Promise<DayPlan> => {
  const { data } = await apiClient.get<RawDailyResponse | any[]>('/planner/daily', {
    params: { date },
  });

  const raw = Array.isArray(data) ? data : ((data as RawDailyResponse).tasks ?? []);

  // Backend doesn't return status/is_completed, so fetch each task fully
  const fullTasks = await Promise.all(
    raw.map(async (t: any) => {
      try {
        const { data: full } = await apiClient.get(`/tasks/${t.id}`);
        return normalizeTaskRaw(full);
      } catch {
        return normalizeTaskRaw(t);
      }
    })
  );

  return { date, tasks: fullTasks };
},

  /**
   * GET /planner/weekly?start_date=YYYY-MM-DD
   * start_date must be a Sunday
   */
  getWeekly: async (startDate: string): Promise<WeeklyPlan> => {
    const { data } = await apiClient.get<RawWeeklyResponse>('/planner/weekly', {
      params: { start_date: startDate },
    });

    const days: DayPlan[] = (data.days ?? []).map((d: RawWeeklyDay) => ({
      date: d.date,
      tasks: (d.tasks ?? []).map(normalizeTaskRaw),
    }));

    return { weekStart: data.week_start ?? data.start_date ?? startDate, days };
  },
};

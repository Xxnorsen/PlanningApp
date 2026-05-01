/**
 * Local-only timer store for tasks. Tracks which task is currently running
 * and when its timer started. The backend has no in-progress concept, so the
 * timer is per-device and resets on logout / app reinstall.
 *
 * Only one task can run at a time — starting a new task auto-stops any
 * previous one. When stopped, the elapsed time is discarded (per UX spec).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './local-storage';
import type { Task } from '@/types/task';

type Timers = Record<string, number>; // taskId → startedAt (ms epoch)

let cache: Map<string, number> | null = null;
const listeners = new Set<() => void>();

async function loadCache(): Promise<Map<string, number>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.IN_PROGRESS_TASK_IDS);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      cache = new Map(
        Object.entries(parsed as Timers).map(([k, v]) => [k, Number(v)]),
      );
    } else {
      cache = new Map();
    }
  } catch {
    cache = new Map();
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  const obj: Timers = Object.fromEntries(cache);
  await AsyncStorage.setItem(
    STORAGE_KEYS.IN_PROGRESS_TASK_IDS,
    JSON.stringify(obj),
  );
}

function notify() {
  listeners.forEach((l) => l());
}

export const inProgressStore = {
  init: async (): Promise<void> => {
    await loadCache();
  },

  has: (id: string): boolean => cache?.has(id) ?? false,

  /** ms epoch when the timer started, or undefined if not running. */
  getStartedAt: (id: string): number | undefined => cache?.get(id),

  /** Start the timer for `id`. Stops any other running task first. */
  start: async (id: string): Promise<void> => {
    const c = await loadCache();
    c.clear();
    c.set(id, Date.now());
    await persist();
    notify();
  },

  /** Stop the timer for `id`. Discards elapsed time. */
  stop: async (id: string): Promise<void> => {
    const c = await loadCache();
    if (!c.has(id)) return;
    c.delete(id);
    await persist();
    notify();
  },

  /** Idempotent stop — used when a task is deleted or completed. */
  clear: async (id: string): Promise<void> => {
    const c = await loadCache();
    c.delete(id);
    await persist();
    notify();
  },

  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  applyOverlay: (task: Task): Task => {
    if (task.status !== 'completed' && cache?.has(task.id)) {
      return { ...task, status: 'in_progress' };
    }
    return task;
  },

  applyOverlayList: (tasks: Task[]): Task[] =>
    tasks.map((t) => inProgressStore.applyOverlay(t)),
};

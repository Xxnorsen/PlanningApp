/**
 * Local-only in-progress flag for tasks. The backend only stores a `completed`
 * boolean, so we keep the in-progress IDs in AsyncStorage and overlay them on
 * top of fetched tasks. Completed tasks always win — a task can't be both.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './local-storage';
import type { Task } from '@/types/task';

let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

async function loadCache(): Promise<Set<string>> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.IN_PROGRESS_TASK_IDS);
  cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await AsyncStorage.setItem(
    STORAGE_KEYS.IN_PROGRESS_TASK_IDS,
    JSON.stringify(Array.from(cache)),
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

  add: async (id: string): Promise<void> => {
    const c = await loadCache();
    if (c.has(id)) return;
    c.add(id);
    await persist();
    notify();
  },

  remove: async (id: string): Promise<void> => {
    const c = await loadCache();
    if (!c.has(id)) return;
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

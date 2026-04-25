/**
 * Local status overrides — persists `in_progress` status in AsyncStorage.
 *
 * The backend only supports a `completed` boolean, so `in_progress` would be
 * lost on the next fetch. This module keeps a lightweight map of
 * taskId → status that is merged into tasks after they are fetched.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task, TaskStatus } from '@/types/task';

const STORAGE_KEY = '@task_status_overrides';

type StatusOverrides = Record<string, TaskStatus>;

export const localStatusStore = {
  /** Retrieve all stored status overrides. */
  async getAll(): Promise<StatusOverrides> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  },

  /** Persist a status override for a given task. `pending` clears the entry. */
  async set(taskId: string, status: TaskStatus): Promise<void> {
    const overrides = await this.getAll();
    if (status === 'pending') {
      delete overrides[taskId];
    } else {
      overrides[taskId] = status;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  },

  /** Remove the override for a task (e.g. after deletion). */
  async remove(taskId: string): Promise<void> {
    const overrides = await this.getAll();
    delete overrides[taskId];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  },

  /**
   * Apply stored overrides to a list of tasks.
   * - Tasks already marked `completed` by the backend are not overridden.
   * - Stale entries (task deleted server-side) are harmlessly ignored.
   */
  applyOverrides(tasks: Task[], overrides: StatusOverrides): Task[] {
    return tasks.map(task => {
      const override = overrides[task.id];
      if (override && task.status !== 'completed') {
        return { ...task, status: override };
      }
      return task;
    });
  },
};

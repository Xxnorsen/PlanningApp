import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task';
import { tasksApi } from '@/services/api/tasks';

interface TaskContextValue {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchActive: () => Promise<void>;
  fetchCompleted: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (id: string, payload: UpdateTaskPayload) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (task: Task) => Promise<Task>;
  setInProgress: (task: Task, inProgress: boolean) => Promise<Task>;
  clearError: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e.message ?? 'Request failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAll = useCallback(() =>
    run(async () => { setTasks(await tasksApi.getAll()); }), []);

  const fetchActive = useCallback(() =>
    run(async () => { setTasks(await tasksApi.getActive()); }), []);

  const fetchCompleted = useCallback(() =>
    run(async () => { setTasks(await tasksApi.getCompleted()); }), []);

  const createTask = useCallback((payload: CreateTaskPayload) =>
    run(async () => {
      const task = await tasksApi.create(payload);
      setTasks((prev) => [task, ...prev]);
      return task;
    }), []);

  const updateTask = useCallback((id: string, payload: UpdateTaskPayload) =>
    run(async () => {
      const updated = await tasksApi.update(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    }), []);

  const deleteTask = useCallback((id: string) =>
    run(async () => {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }), []);

  // Optimistic toggle: flip status locally first, reconcile with server response,
  // roll back on error. Completion day grouping depends on the backend
  // eventually returning `completed_at` — see TODO in task-utils.ts.
  const toggleComplete = useCallback(async (task: Task): Promise<Task> => {
    const nextCompleted = task.status !== 'completed';
    const optimistic: Task = { ...task, status: nextCompleted ? 'completed' : 'pending' };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
    try {
      const confirmed = await tasksApi.setCompleted(task, nextCompleted);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? confirmed : t)));
      return confirmed;
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setError(e?.message ?? 'Failed to update task');
      throw e;
    }
  }, []);

  // In-progress is a local-only flag (see services/in-progress-store.ts).
  // No server round-trip, so we just write to AsyncStorage and update state.
  const setInProgress = useCallback(async (task: Task, inProgress: boolean): Promise<Task> => {
    try {
      const updated = await tasksApi.setInProgress(task, inProgress);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update task');
      throw e;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <TaskContext.Provider
      value={{ tasks, isLoading, error, fetchAll, fetchActive, fetchCompleted, createTask, updateTask, deleteTask, toggleComplete, setInProgress, clearError }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used inside <TaskProvider>');
  return ctx;
}

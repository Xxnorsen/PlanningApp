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
  toggleComplete: (task: Task) => Promise<void>;
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

  const toggleComplete = useCallback((task: Task) =>
    run(async () => {
      const updated = await tasksApi.toggleComplete(task);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    }), []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <TaskContext.Provider
      value={{ tasks, isLoading, error, fetchAll, fetchActive, fetchCompleted, createTask, updateTask, deleteTask, toggleComplete, clearError }}
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

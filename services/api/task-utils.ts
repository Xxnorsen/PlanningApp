/**
 * Shared task normalisation used by both tasks.ts and planner.ts
 *
 * TODO(backend): add `completed_at` timestamp to TaskOut so the client can
 * group completed tasks by the day they were actually checked off. The
 * current backend only exposes a boolean `completed` flag, so `completedAt`
 * will stay undefined until the backend is updated.
 */
import type { Task } from '@/types/task';

export function normalizeTaskRaw(raw: any): Task {
  const isCompleted =
    raw.completed === true ||
    raw.status === 'completed' ||
    raw.is_completed === true;

  return {
    id: String(raw.id),
    title: raw.title ?? '',
    description: raw.description ?? undefined,
    status: isCompleted ? 'completed' : 'pending',
    priority: raw.priority ?? 'medium',
    categoryId: raw.category_id != null ? String(raw.category_id) : undefined,
    dueDate: raw.due_date ?? undefined,
    completedAt: raw.completed_at ?? undefined,
    createdAt: raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? new Date().toISOString(),
  };
}
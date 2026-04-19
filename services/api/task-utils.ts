/**
 * Shared task normalisation used by both tasks.ts and planner.ts
 */
import type { Task } from '@/types/task';

export function normalizeTaskRaw(raw: any): Task {
  const isCompleted = 
    raw.status === 'completed' || 
    raw.is_completed === true || 
    raw.completed === true; // ← ADD THIS
    
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    description: raw.description ?? undefined,
    status: isCompleted ? 'completed' : 'pending',
    priority: raw.priority ?? 'medium',
    categoryId: raw.category_id != null ? String(raw.category_id) : undefined,
    dueDate: raw.due_date ?? undefined,
    completedAt: raw.completed_at ?? raw.due_date ?? undefined, // ← fallback to due_date
    createdAt: raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.due_date ?? new Date().toISOString(), // ← fallback to due_date
  };
}

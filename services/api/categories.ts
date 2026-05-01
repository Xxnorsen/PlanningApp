import { apiClient } from './client';
import type { Category, CreateCategoryPayload } from '@/types/category';

interface RawCategory {
  id: number | string;
  name: string;
  color?: string;
  icon?: string;
  task_count?: number;
  created_at?: string;
}

function normalizeCategory(raw: RawCategory): Category {
  return {
    id: String(raw.id),
    name: raw.name,
    color: raw.color ?? '#4A4AE8',
    icon: raw.icon,
    taskCount: raw.task_count,
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

export const categoriesApi = {
  /** GET /categories/ */
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<RawCategory[]>('/categories/');
    return data.map(normalizeCategory);
  },

  /** POST /categories/ */
  create: async (payload: CreateCategoryPayload): Promise<Category> => {
    const { data } = await apiClient.post<RawCategory>('/categories/', payload);
    return normalizeCategory(data);
  },

  /** PUT /categories/{id} — no trailing slash. The backend issues a 307 redirect
   *  to the slash-less URL and browsers reject redirects on CORS preflight. */
  update: async (id: string, payload: Partial<CreateCategoryPayload>): Promise<Category> => {
    const { data } = await apiClient.put<RawCategory>(`/categories/${id}`, payload);
    return normalizeCategory(data);
  },

  /** DELETE /categories/{id}/ */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

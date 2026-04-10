import type { Category, CreateCategoryPayload } from '@/types/category';

// SCRUM-6: Categories API to be implemented
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    throw new Error('Not implemented');
  },

  create: async (payload: CreateCategoryPayload): Promise<Category> => {
    throw new Error('Not implemented');
  },

  update: async (id: string, payload: Partial<CreateCategoryPayload>): Promise<Category> => {
    throw new Error('Not implemented');
  },

  delete: async (id: string): Promise<void> => {
    throw new Error('Not implemented');
  },
};

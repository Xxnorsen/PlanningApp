import type { Category } from '@/types/category';

// SCRUM-6: Category state management — replace with Zustand/Context in implementation
export interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

export const initialCategoryState: CategoryState = {
  categories: [],
  isLoading: false,
  error: null,
};

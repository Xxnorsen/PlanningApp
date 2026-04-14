import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Category, CreateCategoryPayload } from '@/types/category';
import { categoriesApi } from '@/services/api/categories';

interface CategoryContextValue {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  createCategory: (payload: CreateCategoryPayload) => Promise<Category>;
  updateCategory: (id: string, payload: Partial<CreateCategoryPayload>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
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
    run(async () => { setCategories(await categoriesApi.getAll()); }), []);

  const createCategory = useCallback((payload: CreateCategoryPayload) =>
    run(async () => {
      const cat = await categoriesApi.create(payload);
      setCategories((prev) => [...prev, cat]);
      return cat;
    }), []);

  const updateCategory = useCallback((id: string, payload: Partial<CreateCategoryPayload>) =>
    run(async () => {
      const updated = await categoriesApi.update(id, payload);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    }), []);

  const deleteCategory = useCallback((id: string) =>
    run(async () => {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }), []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <CategoryContext.Provider
      value={{ categories, isLoading, error, fetchAll, createCategory, updateCategory, deleteCategory, clearError }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used inside <CategoryProvider>');
  return ctx;
}

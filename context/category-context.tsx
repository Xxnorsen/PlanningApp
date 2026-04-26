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
    run(async () => {
      const fresh = await categoriesApi.getAll();
      setCategories((prev) => fresh.map((cat) => {
        const existing = prev.find((c) => c.id === cat.id);
        return {
          ...cat,
          color: cat.color || existing?.color || '#4A4AE8',
          icon: cat.icon || existing?.icon,
        };
      }));
    }), []);

  const createCategory = useCallback((payload: CreateCategoryPayload) =>
    run(async () => {
      const cat = await categoriesApi.create(payload);
      const merged = {
        ...cat,
        color: cat.color || payload.color,
        icon: cat.icon || payload.icon,
      };
      setCategories((prev) => [...prev, merged]);
      return merged;
    }), []);

  const updateCategory = useCallback((id: string, payload: Partial<CreateCategoryPayload>) =>
    run(async () => {
      const updated = await categoriesApi.update(id, payload);
      // Merge payload into API response so color/icon are always applied
      // even if the backend doesn't echo them back
      const merged = {
        ...updated,
        ...(payload.color !== undefined && { color: payload.color }),
        ...(payload.icon !== undefined && { icon: payload.icon }),
        ...(payload.name !== undefined && { name: payload.name }),
      };
      setCategories((prev) => prev.map((c) => (c.id === id ? merged : c)));
      return merged;
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
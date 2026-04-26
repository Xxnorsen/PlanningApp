/**
 * Local category overrides — persists icon and color in AsyncStorage.
 *
 * The backend may not properly store or return icon/color fields,
 * so this module keeps a lightweight map of categoryId → {icon, color}
 * that is merged into categories after they are fetched.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@category_overrides';

interface CategoryOverride {
  icon?: string;
  color?: string;
}

type CategoryOverrides = Record<string, CategoryOverride>;

export const categoryOverrides = {
  /** Retrieve all stored category overrides. */
  async getAll(): Promise<CategoryOverrides> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  },

  /** Save icon and/or color for a specific category. */
  async set(categoryId: string, override: CategoryOverride): Promise<void> {
    const overrides = await this.getAll();
    if (!override.icon && !override.color) {
      delete overrides[categoryId];
    } else {
      overrides[categoryId] = { ...overrides[categoryId], ...override };
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  },

  /** Remove the override for a category (e.g. after deletion). */
  async remove(categoryId: string): Promise<void> {
    const overrides = await this.getAll();
    delete overrides[categoryId];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  },

  /** Clear all overrides. */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};

/**
 * Local-only color/icon for categories. The backend doesn't persist these
 * fields, so we keep them in AsyncStorage and overlay them on top of fetched
 * categories.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './local-storage';
import type { Category } from '@/types/category';

type Customization = { color?: string; icon?: string };
type CacheMap = Record<string, Customization>;

let cache: CacheMap | null = null;

async function loadCache(): Promise<CacheMap> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_CUSTOMIZATIONS);
  cache = raw ? (JSON.parse(raw) as CacheMap) : {};
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await AsyncStorage.setItem(
    STORAGE_KEYS.CATEGORY_CUSTOMIZATIONS,
    JSON.stringify(cache),
  );
}

export const categoryCustomizationsStore = {
  init: async (): Promise<void> => {
    await loadCache();
  },

  set: async (id: string, custom: Customization): Promise<void> => {
    const c = await loadCache();
    c[id] = { ...c[id], ...custom };
    await persist();
  },

  remove: async (id: string): Promise<void> => {
    const c = await loadCache();
    if (!(id in c)) return;
    delete c[id];
    await persist();
  },

  applyOverlay: (cat: Category): Category => {
    const custom = cache?.[cat.id];
    if (!custom) return cat;
    return {
      ...cat,
      color: custom.color ?? cat.color,
      icon: custom.icon ?? cat.icon,
    };
  },

  applyOverlayList: (cats: Category[]): Category[] =>
    cats.map((c) => categoryCustomizationsStore.applyOverlay(c)),
};

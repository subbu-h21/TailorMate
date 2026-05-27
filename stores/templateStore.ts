import { create } from 'zustand';
import { TemplateMeta, TemplateData } from '../types';
import { CATALOG_URL, templateUrl } from '../constants/cdn';

interface TemplateStore {
  catalog: TemplateMeta[];
  loadedTemplates: Record<string, TemplateData>;
  isLoading: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
  fetchTemplate: (meta: TemplateMeta) => Promise<TemplateData>;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  catalog: [],
  loadedTemplates: {},
  isLoading: false,
  error: null,

  fetchCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(CATALOG_URL);
      if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
      const data: TemplateMeta[] = await res.json();
      set({ catalog: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTemplate: async (meta: TemplateMeta) => {
    const cached = get().loadedTemplates[meta.id];
    if (cached) return cached;

    try {
      const res = await fetch(templateUrl(meta.url));
      if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
      const data: TemplateData = await res.json();
      set((state) => ({
        loadedTemplates: { ...state.loadedTemplates, [meta.id]: data },
      }));
      return data;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));

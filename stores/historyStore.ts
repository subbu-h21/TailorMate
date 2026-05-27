import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatternRecord } from '../types';

interface HistoryStore {
  records: PatternRecord[];
  addRecord: (r: Omit<PatternRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      records: [],

      addRecord: (r) => {
        const newRecord: PatternRecord = {
          ...r,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ records: [newRecord, ...state.records] }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: 'history-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

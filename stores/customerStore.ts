import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../types';

interface CustomerStore {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customers: [],

      addCustomer: (c) => {
        const now = new Date().toISOString();
        const newCustomer: Customer = {
          ...c,
          id: Date.now().toString(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },
    }),
    {
      name: 'customer-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

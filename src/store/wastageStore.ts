import { create } from 'zustand';
import { WastageEntry } from '../types';
import { useInventoryStore } from './inventoryStore';

interface WastageState {
  wastageEntries: WastageEntry[];
  addWastage: (entry: Omit<WastageEntry, 'id' | 'declaredAt'>) => WastageEntry;
  approveWastage: (id: string, approvedBy: string) => void;
  rejectWastage: (id: string) => void;
  getPendingWastage: () => WastageEntry[];
  saveWastage: () => void;
}

const STORAGE_KEY = 'inv_wastage';

export const useWastageStore = create<WastageState>((set, get) => ({
  wastageEntries: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),

  addWastage: (entryData) => {
    const newEntry: WastageEntry = {
      ...entryData,
      id: `WST-${Date.now()}`,
      declaredAt: Date.now(),
    };
    set(state => {
      const newEntries = [newEntry, ...state.wastageEntries];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      return { wastageEntries: newEntries };
    });
    return newEntry;
  },

  approveWastage: (id, approvedBy) => {
    const { adjustStock, logAudit } = useInventoryStore.getState();
    
    set(state => {
      const entryIndex = state.wastageEntries.findIndex(w => w.id === id);
      if (entryIndex === -1) return state;

      const entry = state.wastageEntries[entryIndex];
      if (entry.status !== 'pending') return state;

      // Deduct stock
      adjustStock(entry.ingredientId, -entry.qty, `Wastage #${entry.id}: ${entry.reason}`, 'WASTAGE');

      const updatedEntry: WastageEntry = {
        ...entry,
        status: 'approved',
        approvedBy,
      };

      const newEntries = [...state.wastageEntries];
      newEntries[entryIndex] = updatedEntry;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));

      logAudit('APPROVE', 'WASTAGE', id, `Approved by ${approvedBy}`);

      return { wastageEntries: newEntries };
    });
  },

  rejectWastage: (id) => {
    const { logAudit } = useInventoryStore.getState();
    set(state => {
      const entryIndex = state.wastageEntries.findIndex(w => w.id === id);
      if (entryIndex === -1) return state;

      const entry = state.wastageEntries[entryIndex];
      const updatedEntry: WastageEntry = {
        ...entry,
        status: 'rejected',
      };

      const newEntries = [...state.wastageEntries];
      newEntries[entryIndex] = updatedEntry;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));

      logAudit('REJECT', 'WASTAGE', id, `Rejected`);

      return { wastageEntries: newEntries };
    });
  },

  getPendingWastage: () => {
    return get().wastageEntries.filter(w => w.status === 'pending');
  },

  saveWastage: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().wastageEntries));
  },
}));

import { create } from 'zustand';
import { Deal } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DealState {
  deals: Deal[];
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  getActiveDeals: () => Deal[];
  saveDeals: () => void;
}

const STORAGE_KEY = 'pos_deals';

const seedDeals: Deal[] = [
  {
    id: 'deal-1',
    name: 'BBQ Family Deal',
    description: 'Chicken Tikka x2 + Seekh Kabab x4 + Naan x8',
    price: 3500,
    status: 'available',
    sortOrder: 1,
    createdAt: Date.now(),
    items: [
      { menuItemId: 'item-tikka', menuItemName: 'Chicken Tikka', qty: 2, price: 450 },
      { menuItemId: 'item-kabab', menuItemName: 'Seekh Kabab', qty: 4, price: 300 },
      { menuItemId: 'item-naan', menuItemName: 'Naan', qty: 8, price: 40 }
    ]
  },
  {
    id: 'deal-2',
    name: 'Karahi Special',
    description: 'Chicken Karahi Full x1 + Naan x4 + Raita x1',
    price: 2200,
    status: 'available',
    sortOrder: 2,
    createdAt: Date.now(),
    items: [
      { menuItemId: 'item-karahi', menuItemName: 'Chicken Karahi Full', qty: 1, price: 1800 },
      { menuItemId: 'item-naan', menuItemName: 'Naan', qty: 4, price: 40 },
      { menuItemId: 'item-raita', menuItemName: 'Raita', qty: 1, price: 150 }
    ]
  }
];

export const useDealStore = create<DealState>((set, get) => ({
  deals: (() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedDeals));
    return seedDeals;
  })(),

  addDeal: (dealData) => {
    const newDeal: Deal = {
      ...dealData,
      id: uuidv4(),
      createdAt: Date.now()
    };
    set((state) => {
      const newDeals = [...state.deals, newDeal];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDeals));
      return { deals: newDeals };
    });
    return newDeal;
  },

  updateDeal: (id, updates) => {
    set((state) => {
      const newDeals = state.deals.map((d) => (d.id === id ? { ...d, ...updates } : d));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDeals));
      return { deals: newDeals };
    });
  },

  deleteDeal: (id) => {
    set((state) => {
      const newDeals = state.deals.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDeals));
      return { deals: newDeals };
    });
  },

  getActiveDeals: () => {
    return get().deals.filter((d) => d.status === 'available').sort((a, b) => a.sortOrder - b.sortOrder);
  },

  saveDeals: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().deals));
  }
}));

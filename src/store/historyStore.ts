import { create } from 'zustand';
import { HistoryOrder } from '../types';
import { useSyncStore } from './syncStore';

interface HistoryState {
  history: HistoryOrder[];
  addToHistory: (order: HistoryOrder) => void;
  addHistoryOrder: (order: HistoryOrder) => void;
  deleteFromHistory: (orderId: string) => void;
  deleteMultipleFromHistory: (orderIds: string[]) => void;
  wipeHistory: (fromDate: number, toDate: number) => void;
  saveHistory: () => void;
}

const getStoredHistory = (): HistoryOrder[] => {
  const stored = localStorage.getItem('orderHistory');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure we have a valid array
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: getStoredHistory(),
  addToHistory: (order) => {
    const updatedHistory = [order, ...get().history];
    set({ history: updatedHistory });
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  },
  addHistoryOrder: (order) => {
    const updatedHistory = [order, ...get().history];
    set({ history: updatedHistory });
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  },
  deleteFromHistory: (orderId) => {
    const updatedHistory = get().history.filter(o => o.id !== orderId);
    set({ history: updatedHistory });
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  },
  deleteMultipleFromHistory: (orderIds) => {
    const updatedHistory = get().history.filter(o => !orderIds.includes(o.id));
    set({ history: updatedHistory });
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  },
  wipeHistory: (fromDate, toDate) => {
    const updatedHistory = get().history.filter(o => {
      const orderTime = o.closedAt || o.startTime;
      return orderTime < fromDate || orderTime > toDate;
    });
    set({ history: updatedHistory });
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  },
  saveHistory: () => {
    localStorage.setItem('orderHistory', JSON.stringify(get().history));
  },
}));

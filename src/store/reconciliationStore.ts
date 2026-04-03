import { create } from 'zustand';
import { ZReading, HistoryOrder } from '../types';

interface ReconciliationState {
  reconciliationHistory: ZReading[];
  currentShiftStart: number;
  saveZReading: (reading: ZReading) => void;
  getShiftOrders: (history: HistoryOrder[]) => HistoryOrder[];
  calcExpectedCash: (shiftOrders: HistoryOrder[]) => number;
  startNewShift: () => void;
}

const getStoredHistory = (): ZReading[] => {
  const stored = localStorage.getItem('pos_reconciliationHistory');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const getStoredShiftStart = (): number => {
  const stored = localStorage.getItem('pos_shiftStart');
  if (stored) {
    return parseInt(stored, 10);
  }
  const now = Date.now();
  localStorage.setItem('pos_shiftStart', now.toString());
  return now;
};

export const useReconciliationStore = create<ReconciliationState>((set, get) => ({
  reconciliationHistory: getStoredHistory(),
  currentShiftStart: getStoredShiftStart(),

  saveZReading: (reading) => {
    const newHistory = [reading, ...get().reconciliationHistory];
    set({ reconciliationHistory: newHistory });
    localStorage.setItem('pos_reconciliationHistory', JSON.stringify(newHistory));
  },

  getShiftOrders: (history) => {
    const start = get().currentShiftStart;
    return history.filter(o => o.closedAt >= start && o.status === 'completed');
  },

  calcExpectedCash: (shiftOrders) => {
    return shiftOrders.reduce((acc, order) => {
      const cashPayments = order.payments?.filter(p => p.method === 'Cash') || [];
      const cashTotal = cashPayments.reduce((pAcc, p) => pAcc + p.amount, 0);
      return acc + cashTotal;
    }, 0);
  },

  startNewShift: () => {
    const now = Date.now();
    set({ currentShiftStart: now });
    localStorage.setItem('pos_shiftStart', now.toString());
  },
}));

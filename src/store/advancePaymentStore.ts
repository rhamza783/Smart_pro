import { create } from 'zustand';
import { AdvancePayment, AdvancePaymentSummary } from '../types';

interface AdvancePaymentState {
  advances: AdvancePayment[];
  addAdvance: (advance: Omit<AdvancePayment, 'id' | 'createdAt'>) => AdvancePayment;
  consumeAdvance: (id: string, orderId: string) => void;
  refundAdvance: (id: string, reason: string) => void;
  getActiveAdvances: () => AdvancePayment[];
  getAdvancesForClient: (clientId: string) => AdvancePayment[];
  getAdvanceForReservation: (reservationId: string) => AdvancePayment | null;
  getSummary: () => AdvancePaymentSummary;
  searchAdvances: (query: string) => AdvancePayment[];
  getExpiringAdvances: (daysAhead: number) => AdvancePayment[];
  markExpired: () => void;
  saveAdvances: () => void;
}

export const useAdvancePaymentStore = create<AdvancePaymentState>((set, get) => ({
  advances: JSON.parse(localStorage.getItem('pos_advance_payments') || '[]'),

  addAdvance: (advanceData) => {
    const id = `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAdvance: AdvancePayment = {
      ...advanceData,
      id,
      createdAt: Date.now(),
      status: 'active'
    };

    set((state) => ({
      advances: [newAdvance, ...state.advances]
    }));
    get().saveAdvances();
    return newAdvance;
  },

  consumeAdvance: (id, orderId) => {
    set((state) => ({
      advances: state.advances.map((adv) =>
        adv.id === id
          ? {
              ...adv,
              status: 'consumed',
              consumedAt: Date.now(),
              consumedOrderId: orderId
            }
          : adv
      )
    }));
    get().saveAdvances();
  },

  refundAdvance: (id, reason) => {
    set((state) => ({
      advances: state.advances.map((adv) =>
        adv.id === id
          ? {
              ...adv,
              status: 'refunded',
              refundedAt: Date.now(),
              refundReason: reason
            }
          : adv
      )
    }));
    get().saveAdvances();
  },

  getActiveAdvances: () => {
    return get().advances.filter((adv) => adv.status === 'active');
  },

  getAdvancesForClient: (clientId) => {
    return get().advances.filter((adv) => adv.clientId === clientId);
  },

  getAdvanceForReservation: (reservationId) => {
    return get().advances.find((adv) => adv.reservationId === reservationId) || null;
  },

  getSummary: () => {
    const { advances } = get();
    return advances.reduce(
      (acc, adv) => {
        if (adv.status === 'active') {
          acc.totalActive += adv.amount;
          acc.activeCount += 1;
        } else if (adv.status === 'consumed') {
          acc.totalConsumed += adv.amount;
        } else if (adv.status === 'refunded') {
          acc.totalRefunded += adv.amount;
        }
        acc.totalCollected += adv.amount;
        return acc;
      },
      {
        totalCollected: 0,
        totalConsumed: 0,
        totalRefunded: 0,
        totalActive: 0,
        activeCount: 0
      }
    );
  },

  searchAdvances: (query) => {
    const q = query.toLowerCase();
    return get().advances.filter(
      (adv) =>
        adv.clientName.toLowerCase().includes(q) ||
        adv.clientPhone.toLowerCase().includes(q) ||
        adv.referenceNote.toLowerCase().includes(q) ||
        adv.id.toLowerCase().includes(q)
    );
  },

  getExpiringAdvances: (daysAhead) => {
    const now = Date.now();
    const future = now + daysAhead * 24 * 60 * 60 * 1000;
    return get().advances.filter((adv) => {
      if (adv.status !== 'active' || !adv.expiryDate) return false;
      const expiry = new Date(adv.expiryDate).getTime();
      return expiry > now && expiry <= future;
    });
  },

  markExpired: () => {
    const now = Date.now();
    let changed = false;
    const updatedAdvances = get().advances.map((adv) => {
      if (adv.status === 'active' && adv.expiryDate) {
        const expiry = new Date(adv.expiryDate).getTime();
        if (expiry < now) {
          changed = true;
          return { ...adv, status: 'expired' as const };
        }
      }
      return adv;
    });

    if (changed) {
      set({ advances: updatedAdvances });
      get().saveAdvances();
    }
  },

  saveAdvances: () => {
    localStorage.setItem('pos_advance_payments', JSON.stringify(get().advances));
  }
}));

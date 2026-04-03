import { create } from 'zustand';
import { Payment } from '../types';

interface PaymentState {
  tempPayments: Payment[];
  addPayment: (payment: Payment) => void;
  removePayment: (index: number) => void;
  getTotalPaid: () => number;
  getBalance: (totalDue: number) => number;
  clearPayments: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  tempPayments: [],
  addPayment: (payment) => set((state) => ({ 
    tempPayments: [...state.tempPayments, payment] 
  })),
  removePayment: (index) => set((state) => ({ 
    tempPayments: state.tempPayments.filter((_, i) => i !== index) 
  })),
  getTotalPaid: () => {
    return get().tempPayments.reduce((sum, p) => sum + p.amount, 0);
  },
  getBalance: (totalDue) => {
    return totalDue - get().getTotalPaid();
  },
  clearPayments: () => set({ tempPayments: [] }),
}));

import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastState {
  message: string | null;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type = 'info') => {
    set({ message, type });
    setTimeout(() => {
      set({ message: null });
    }, 3000);
  },
  hideToast: () => set({ message: null }),
}));

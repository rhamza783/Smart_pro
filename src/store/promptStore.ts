import { create } from 'zustand';
import { DynamicPromptProps, PromptResult } from '../types';

interface PromptStore {
  isOpen: boolean;
  config: DynamicPromptProps | null;
  openPrompt: (config: Omit<DynamicPromptProps, 'onConfirm' | 'onClose'>) => Promise<PromptResult>;
  closePrompt: () => void;
  resolvePrompt: (result: PromptResult) => void;
  _resolve: ((result: PromptResult) => void) | null;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  isOpen: false,
  config: null,
  _resolve: null,

  openPrompt: (config) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        config: {
          ...config,
          onConfirm: (result) => {
            get().resolvePrompt(result);
          },
          onClose: () => {
            get().closePrompt();
          },
        },
        _resolve: resolve,
      });
    });
  },

  closePrompt: () => {
    const resolve = get()._resolve;
    if (resolve) {
      resolve({ price: null, qty: null, text: null });
    }
    set({ isOpen: false, config: null, _resolve: null });
  },

  resolvePrompt: (result) => {
    const resolve = get()._resolve;
    if (resolve) {
      resolve(result);
    }
    set({ isOpen: false, config: null, _resolve: null });
  },
}));

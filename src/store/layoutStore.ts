import { create } from 'zustand';
import { Zone } from '../types';
import { useSyncStore } from './syncStore';

interface LayoutState {
  activeSection: string;
  setActiveSection: (id: string) => void;
  tableLayout: Zone[];
}

const DEFAULT_LAYOUT: Zone[] = [
  { 
    id: 'dinein', 
    name: 'Dine In', 
    settings: {
      askForWaiter: true,
      askForClient: true,
      tableBtnWidth: '80px',
      tableBtnHeight: '80px',
      tableBtnAutoSize: true
    },
    sections: [
      {
        name: 'Indoor',
        tables: [
          { name: 'T1', sortOrder: 1 },
          { name: 'T2', sortOrder: 2 },
          { name: 'T3', sortOrder: 3 },
        ]
      }
    ] 
  },
  { 
    id: 'takeaway', 
    name: 'Take Away', 
    settings: {
      askForWaiter: false,
      askForClient: true,
      tableBtnWidth: '80px',
      tableBtnHeight: '80px',
      tableBtnAutoSize: true
    },
    sections: [] 
  },
  { 
    id: 'delivery', 
    name: 'Delivery', 
    settings: {
      askForWaiter: false,
      askForClient: true,
      tableBtnWidth: '80px',
      tableBtnHeight: '80px',
      tableBtnAutoSize: true
    },
    sections: [] 
  },
];

const getStoredLayout = (): Zone[] => {
  const stored = localStorage.getItem('pos_layout_v2');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      return DEFAULT_LAYOUT;
    }
  }
  // Save default layout if not present
  localStorage.setItem('pos_layout_v2', JSON.stringify(DEFAULT_LAYOUT));
  return DEFAULT_LAYOUT;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  activeSection: 'dinein',
  setActiveSection: (id) => {
    set({ activeSection: id });
    useSyncStore.getState().broadcast('SECTION_CHANGED', { section: id });
  },
  tableLayout: getStoredLayout(),
}));

(window as any).useLayoutStore = useLayoutStore;

import { create } from 'zustand';
import { MenuItem, MenuCategory } from '../types';
import { useSyncStore } from './syncStore';

interface MenuState {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  saveMenuItems: () => void;
  loadMenu: () => void;
  addItem: (item: MenuItem) => void;
  updateItem: (id: string, item: MenuItem) => void;
  deleteItem: (id: string) => void;
  addCategory: (category: MenuCategory) => void;
  updateCategory: (id: string, category: MenuCategory) => void;
  deleteCategory: (id: string) => void;
}

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'bbq', name: 'BBQ', sortOrder: 1 },
  { id: 'karahi', name: 'KARAHI', sortOrder: 2 },
  { id: 'other', name: 'OTHER', sortOrder: 5 }
];

const DEMO_ITEMS: MenuItem[] = [
  { id: 'bbq_1', name: 'Chicken Tikka', price: 800, category: 'bbq', status: 'available', sortOrder: 1 },
  { id: 'bbq_2', name: 'Seekh Kabab', price: 600, category: 'bbq', status: 'available', sortOrder: 2 },
  { id: 'bbq_3', name: 'Malai Boti', price: 900, category: 'bbq', status: 'available', sortOrder: 3 },
  { 
    id: 'karahi_1', 
    name: 'Chicken Karahi', 
    price: 1200, 
    category: 'karahi', 
    status: 'available', 
    sortOrder: 1,
    variants: [
      { vName: 'Quarter', vPrice: 650 },
      { vName: 'Half', vPrice: 1200 },
      { vName: 'Full', vPrice: 2200 }
    ],
    modifiers: [
      {
        groupName: 'Add-ons',
        maxSelect: 3,
        options: [
          { name: 'Extra Butter', price: 100 },
          { name: 'Green Chilies', price: 20 },
          { name: 'Ginger', price: 20 }
        ]
      }
    ]
  },
  { id: 'karahi_2', name: 'Beef Karahi', price: 1400, category: 'karahi', status: 'available', sortOrder: 2 },
  { id: 'karahi_3', name: 'Mutton Karahi', price: 1800, category: 'karahi', status: 'available', sortOrder: 3 }
];

const getStoredData = <T>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
};

export const useMenuStore = create<MenuState>((set, get) => ({
  menuItems: getStoredData('pos_menu_items', DEMO_ITEMS),
  menuCategories: getStoredData('pos_menu_cats', DEMO_CATEGORIES),
  activeCategory: 'bbq',
  setActiveCategory: (id) => set({ activeCategory: id }),
  getItemsByCategory: (categoryId) => {
    return get().menuItems.filter(item => item.category === categoryId);
  },
  saveMenuItems: () => {
    localStorage.setItem('pos_menu_items', JSON.stringify(get().menuItems));
    localStorage.setItem('pos_menu_cats', JSON.stringify(get().menuCategories));
    useSyncStore.getState().broadcast('MENU_UPDATED', null);
  },
  loadMenu: () => {
    set({
      menuItems: getStoredData('pos_menu_items', DEMO_ITEMS),
      menuCategories: getStoredData('pos_menu_cats', DEMO_CATEGORIES)
    });
  },
  addItem: (item) => {
    const newItem = { ...item };
    if (!newItem.sortOrder) {
      const maxSort = Math.max(0, ...get().menuItems.map(i => i.sortOrder || 0));
      newItem.sortOrder = maxSort + 1;
    }
    set((state) => ({ menuItems: [...state.menuItems, newItem] }));
    get().saveMenuItems();
  },
  updateItem: (id, updatedItem) => {
    set((state) => ({
      menuItems: state.menuItems.map((item) => (item.id === id ? updatedItem : item))
    }));
    get().saveMenuItems();
  },
  deleteItem: (id) => {
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item.id !== id)
    }));
    get().saveMenuItems();
  },
  addCategory: (category) => {
    set((state) => ({ menuCategories: [...state.menuCategories, category] }));
    get().saveMenuItems();
  },
  updateCategory: (id, updatedCategory) => {
    set((state) => ({
      menuCategories: state.menuCategories.map((cat) => (cat.id === id ? updatedCategory : cat))
    }));
    get().saveMenuItems();
  },
  deleteCategory: (id) => {
    set((state) => ({
      menuCategories: state.menuCategories.filter((cat) => cat.id !== id)
    }));
    get().saveMenuItems();
  }
}));

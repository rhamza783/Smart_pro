import { create } from 'zustand';
import { Ingredient, StockMovement, AuditEntry } from '../types';
import { useSyncStore } from './syncStore';

interface InventoryState {
  ingredients: Ingredient[];
  stock: Record<string, number>;
  movements: StockMovement[];
  auditLog: AuditEntry[];
  activeTab: string;
  
  setActiveTab: (tab: string) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => Ingredient;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  archiveIngredient: (id: string) => void;
  restoreIngredient: (id: string) => void;
  getActiveIngredients: () => Ingredient[];
  getStockQty: (ingredientId: string) => number;
  setStock: (ingredientId: string, qty: number) => void;
  adjustStock: (ingredientId: string, delta: number, reason: string, type: StockMovement['type']) => number;
  getMovements: (ingredientId: string) => StockMovement[];
  getLowStockItems: () => Ingredient[];
  getStockValue: () => number;
  logAudit: (action: string, entity: string, entityId: string, details: string) => void;
  saveAll: () => void;
  loadInventory: () => void;
}

const INV_INGREDIENTS_KEY = 'inv_ingredients';
const INV_STOCK_KEY = 'inv_stock';
const INV_MOVEMENTS_KEY = 'inv_movements';
const INV_AUDIT_KEY = 'inv_audit';

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ingredients: JSON.parse(localStorage.getItem(INV_INGREDIENTS_KEY) || '[]'),
  stock: JSON.parse(localStorage.getItem(INV_STOCK_KEY) || '{}'),
  movements: JSON.parse(localStorage.getItem(INV_MOVEMENTS_KEY) || '[]'),
  auditLog: JSON.parse(localStorage.getItem(INV_AUDIT_KEY) || '[]'),
  activeTab: 'dashboard',

  setActiveTab: (tab) => set({ activeTab: tab }),

  addIngredient: (ingredient) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: `ING-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };

    const newIngredients = [...get().ingredients, newIngredient];
    set({ ingredients: newIngredients });
    get().saveAll();
    get().logAudit('CREATE', 'Ingredient', newIngredient.id, `Added ingredient: ${newIngredient.name}`);
    return newIngredient;
  },

  updateIngredient: (id, updates) => {
    const newIngredients = get().ingredients.map((ing) =>
      ing.id === id ? { ...ing, ...updates, updatedAt: Date.now() } : ing
    );
    set({ ingredients: newIngredients });
    get().saveAll();
    get().logAudit('UPDATE', 'Ingredient', id, `Updated ingredient details`);
  },

  archiveIngredient: (id) => {
    get().updateIngredient(id, { archived: true });
    get().logAudit('ARCHIVE', 'Ingredient', id, `Archived ingredient`);
  },

  restoreIngredient: (id) => {
    get().updateIngredient(id, { archived: false });
    get().logAudit('RESTORE', 'Ingredient', id, `Restored ingredient`);
  },

  getActiveIngredients: () => {
    return get().ingredients.filter((ing) => !ing.archived);
  },

  getStockQty: (ingredientId) => {
    return get().stock[ingredientId] || 0;
  },

  setStock: (ingredientId, qty) => {
    const currentQty = get().getStockQty(ingredientId);
    const delta = qty - currentQty;
    get().adjustStock(ingredientId, delta, 'Manual set', 'ADJUSTMENT');
  },

  adjustStock: (ingredientId, delta, reason, type) => {
    const currentQty = get().getStockQty(ingredientId);
    const newQty = currentQty + delta;
    
    const movement: StockMovement = {
      id: `MOV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ingredientId,
      delta,
      type,
      reason,
      userId: 'system', // Placeholder
      prevQty: currentQty,
      newQty,
      timestamp: Date.now(),
    };

    const newStock = { ...get().stock, [ingredientId]: newQty };
    const newMovements = [movement, ...get().movements];

    set({ stock: newStock, movements: newMovements });
    get().saveAll();

    useSyncStore.getState().broadcast('STOCK_UPDATED', { ingredientId, newQty, delta, type });

    return newQty;
  },

  getMovements: (ingredientId) => {
    return get().movements.filter((m) => m.ingredientId === ingredientId);
  },

  getLowStockItems: () => {
    const active = get().getActiveIngredients();
    return active.filter((ing) => {
      const qty = get().getStockQty(ing.id);
      return qty <= ing.minThreshold;
    });
  },

  getStockValue: () => {
    const active = get().getActiveIngredients();
    return active.reduce((acc, ing) => {
      const qty = get().getStockQty(ing.id);
      return acc + qty * ing.costPerUnit;
    }, 0);
  },

  logAudit: (action, entity, entityId, details) => {
    const entry: AuditEntry = {
      id: `AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: Date.now(),
      action,
      entity,
      entityId,
      details,
      userId: 'system', // Placeholder
    };

    const newAuditLog = [entry, ...get().auditLog];
    set({ auditLog: newAuditLog });
    get().saveAll();
  },

  saveAll: () => {
    const state = get();
    localStorage.setItem(INV_INGREDIENTS_KEY, JSON.stringify(state.ingredients));
    localStorage.setItem(INV_STOCK_KEY, JSON.stringify(state.stock));
    localStorage.setItem(INV_MOVEMENTS_KEY, JSON.stringify(state.movements));
    localStorage.setItem(INV_AUDIT_KEY, JSON.stringify(state.auditLog));
  },

  loadInventory: () => {
    set({
      ingredients: JSON.parse(localStorage.getItem(INV_INGREDIENTS_KEY) || '[]'),
      stock: JSON.parse(localStorage.getItem(INV_STOCK_KEY) || '{}'),
      movements: JSON.parse(localStorage.getItem(INV_MOVEMENTS_KEY) || '[]'),
      auditLog: JSON.parse(localStorage.getItem(INV_AUDIT_KEY) || '[]'),
    });
  }
}));

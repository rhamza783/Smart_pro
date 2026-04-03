import { create } from 'zustand';
import { PurchaseOrder, Supplier } from '../types';
import { useInventoryStore } from './inventoryStore';

interface PurchaseState {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => PurchaseOrder;
  approvePurchaseOrder: (id: string, approvedBy: string) => void;
  rejectPurchaseOrder: (id: string, reason: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  archiveSupplier: (id: string) => void;
  getPendingOrders: () => PurchaseOrder[];
  saveAll: () => void;
}

const PO_STORAGE_KEY = 'inv_purchases';
const SUPPLIER_STORAGE_KEY = 'inv_suppliers';

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchaseOrders: JSON.parse(localStorage.getItem(PO_STORAGE_KEY) || '[]'),
  suppliers: JSON.parse(localStorage.getItem(SUPPLIER_STORAGE_KEY) || '[]'),

  addPurchaseOrder: (poData) => {
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${Date.now()}`,
      createdAt: Date.now(),
    };
    set(state => {
      const newOrders = [newPO, ...state.purchaseOrders];
      localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(newOrders));
      return { purchaseOrders: newOrders };
    });
    return newPO;
  },

  approvePurchaseOrder: (id, approvedBy) => {
    const { adjustStock, updateIngredient, ingredients, logAudit } = useInventoryStore.getState();
    
    set(state => {
      const poIndex = state.purchaseOrders.findIndex(po => po.id === id);
      if (poIndex === -1) return state;

      const po = state.purchaseOrders[poIndex];
      if (po.status !== 'pending') return state;

      // Update stock for each item
      po.items.forEach(item => {
        adjustStock(item.ingredientId, item.qty, `Purchase Order #${po.id}`, 'PURCHASE');
        
        // Update cost per unit if it changed significantly (more than 1%)
        const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
        if (ingredient && Math.abs(ingredient.costPerUnit - item.unitCost) / ingredient.costPerUnit > 0.01) {
          updateIngredient(item.ingredientId, { costPerUnit: item.unitCost });
        }
      });

      const updatedPO: PurchaseOrder = {
        ...po,
        status: 'approved',
        approvedAt: Date.now(),
        approvedBy,
      };

      const newOrders = [...state.purchaseOrders];
      newOrders[poIndex] = updatedPO;
      localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(newOrders));

      logAudit('APPROVE', 'PURCHASE_ORDER', id, `Approved by ${approvedBy}`);

      return { purchaseOrders: newOrders };
    });
  },

  rejectPurchaseOrder: (id, reason) => {
    const { logAudit } = useInventoryStore.getState();
    set(state => {
      const poIndex = state.purchaseOrders.findIndex(po => po.id === id);
      if (poIndex === -1) return state;

      const po = state.purchaseOrders[poIndex];
      const updatedPO: PurchaseOrder = {
        ...po,
        status: 'rejected',
        rejectedReason: reason,
      };

      const newOrders = [...state.purchaseOrders];
      newOrders[poIndex] = updatedPO;
      localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(newOrders));

      logAudit('REJECT', 'PURCHASE_ORDER', id, `Rejected: ${reason}`);

      return { purchaseOrders: newOrders };
    });
  },

  addSupplier: (supplierData) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `SUP-${Date.now()}`,
      createdAt: Date.now(),
    };
    set(state => {
      const newSuppliers = [newSupplier, ...state.suppliers];
      localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(newSuppliers));
      return { suppliers: newSuppliers };
    });
    return newSupplier;
  },

  updateSupplier: (id, updates) => {
    set(state => {
      const newSuppliers = state.suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(newSuppliers));
      return { suppliers: newSuppliers };
    });
  },

  archiveSupplier: (id) => {
    get().updateSupplier(id, { archived: true });
  },

  getPendingOrders: () => {
    return get().purchaseOrders.filter(po => po.status === 'pending');
  },

  saveAll: () => {
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(get().purchaseOrders));
    localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(get().suppliers));
  },
}));

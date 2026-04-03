import { create } from 'zustand';
import { OrderItem, Order } from '../types';
import { useSettingsStore } from './settingsStore';
import { useSyncStore } from './syncStore';

interface CartState {
  currentOrder: OrderItem[];
  currentTable: string | null;
  discount: number;
  discountType: 'fixed' | 'percent';
  orderId: string | null;
  startTime: number | null;
  lastAddedId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  voucherCode: string | null;
  voucherDiscount: number;
  isReadOnly: boolean;
  appliedAdvanceId: string | null;
  appliedAdvanceAmount: number;
  
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  changeQty: (index: number, delta: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
  setTable: (tableName: string | null) => void;
  setDiscount: (amount: number, type: 'fixed' | 'percent') => void;
  setVoucher: (code: string | null, discount: number) => void;
  markAsPrinted: () => void;
  loadFromOrder: (order: Order) => void;
  updateItem: (index: number, updates: Partial<OrderItem>) => void;
  setReadOnly: (val: boolean) => void;
  applyAdvance: (id: string, amount: number) => void;
  removeAdvance: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  currentOrder: [],
  currentTable: null,
  discount: 0,
  discountType: 'fixed',
  orderId: null,
  startTime: null,
  lastAddedId: null,
  customerId: null,
  customerName: null,
  customerPhone: null,
  voucherCode: null,
  voucherDiscount: 0,
  isReadOnly: false,
  appliedAdvanceId: null,
  appliedAdvanceAmount: 0,

  setReadOnly: (val) => set({ isReadOnly: val }),

  addItem: (item) => {
    const order = [...get().currentOrder];
    const hasModifiers = item.modifiers && item.modifiers.length > 0;
    const tempId = `${item.id}-${Date.now()}`;
    
    // If no modifiers, try to merge with existing item of same name
    if (!hasModifiers) {
      const existingIndex = order.findIndex(i => i.name === item.name && (!i.modifiers || i.modifiers.length === 0));
      if (existingIndex > -1) {
        order[existingIndex].qty += item.qty;
        order[existingIndex].total = order[existingIndex].qty * order[existingIndex].price;
        set({ currentOrder: order, lastAddedId: order[existingIndex].tempId || tempId });
        return;
      }
    }

    // Otherwise add as new row
    const newItem = { ...item, tempId, printedQty: 0 };
    order.push(newItem);
    set({ currentOrder: order, lastAddedId: tempId });
  },

  removeItem: (index) => {
    const order = [...get().currentOrder];
    order.splice(index, 1);
    set({ currentOrder: order });
  },

  changeQty: (index, delta) => {
    const order = [...get().currentOrder];
    const item = order[index];
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      order.splice(index, 1);
    } else {
      item.total = item.qty * item.price;
    }
    set({ currentOrder: order });
  },

  clearCart: () => set({ 
    currentOrder: [], 
    currentTable: null, 
    discount: 0, 
    discountType: 'fixed',
    orderId: null,
    startTime: null,
    customerId: null,
    customerName: null,
    customerPhone: null,
    voucherCode: null,
    voucherDiscount: 0,
    appliedAdvanceId: null,
    appliedAdvanceAmount: 0,
    isReadOnly: false
  }),

  getSubtotal: () => {
    return get().currentOrder.reduce((sum, item) => sum + item.total, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountType, voucherDiscount } = get();
    let totalDiscount = voucherDiscount;
    
    if (discountType === 'percent') {
      totalDiscount += (subtotal * discount) / 100;
    } else {
      totalDiscount += discount;
    }
    
    return totalDiscount;
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = useSettingsStore.getState().propertySettings.taxRate || 0;
    return (taxableAmount * taxRate) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    const advance = get().appliedAdvanceAmount;
    return Math.max(0, subtotal - discount + tax - advance);
  },

  applyAdvance: (id: string, amount: number) => set({ appliedAdvanceId: id, appliedAdvanceAmount: amount }),
  removeAdvance: () => set({ appliedAdvanceId: null, appliedAdvanceAmount: 0 }),

  setTable: (tableName) => {
    set({ 
      currentTable: tableName,
      orderId: tableName ? `ORD-${Math.floor(Math.random() * 1000000)}` : null,
      startTime: tableName ? Date.now() : null
    });
    
    useSyncStore.getState().broadcast('TABLE_STATUS_CHANGED', { 
      tableName, 
      status: tableName ? 'occupied' : 'empty',
      lockedByTab: tableName ? useSyncStore.getState().tabId : undefined
    });
  },

  setDiscount: (amount, type) => set({ discount: amount, discountType: type }),

  setVoucher: (code, discount) => set({ voucherCode: code, voucherDiscount: discount }),

  markAsPrinted: () => {
    const order = get().currentOrder.map(item => ({
      ...item,
      printedQty: item.qty
    }));
    set({ currentOrder: order });
  },

  loadFromOrder: (order) => set({
    currentOrder: order.items,
    currentTable: order.table || null,
    discount: order.discount,
    discountType: order.discType,
    orderId: order.id,
    startTime: order.startTime,
    customerId: order.customerId || null,
    customerName: order.customerName || null,
    customerPhone: order.customerPhone || null,
    isReadOnly: false
  }),

  updateItem: (index, updates) => {
    const order = [...get().currentOrder];
    const item = order[index];
    if (!item) return;

    order[index] = { ...item, ...updates };
    order[index].total = order[index].qty * order[index].price;
    set({ currentOrder: order });
  }
}));

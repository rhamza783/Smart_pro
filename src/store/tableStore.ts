import { create } from 'zustand';
import { Order, Customer } from '../types';
import { useSyncStore } from './syncStore';

interface TableState {
  orders: Record<string, Order>;
  selectedTable: string | null;
  setSelectedTable: (name: string | null) => void;
  setOrders: (orders: Record<string, Order>) => void;
  createOrder: (tableName: string, waiter: string, customer: Customer) => Order;
  updateOrder: (tableName: string, order: Order) => void;
  removeOrder: (tableName: string) => void;
  moveOrder: (fromTable: string, toTable: string) => void;
  mergeOrders: (fromTable: string, toTable: string) => void;
  saveOrders: () => void;
  getTableStatus: (tableName: string) => 'empty' | 'occupied';
}

const getStoredOrders = (): Record<string, Order> => {
  const stored = localStorage.getItem('savedOrders');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return {};
    }
  }
  return {};
};

export const useTableStore = create<TableState>((set, get) => ({
  orders: getStoredOrders(),
  selectedTable: null,
  setSelectedTable: (name) => {
    set({ selectedTable: name });
    useSyncStore.getState().broadcast('TABLE_STATUS_CHANGED', { 
      tableName: name, 
      status: name ? 'occupied' : 'empty',
      lockedByTab: name ? useSyncStore.getState().tabId : undefined
    });
  },
  setOrders: (orders) => {
    set({ orders });
    localStorage.setItem('savedOrders', JSON.stringify(orders));
  },
  createOrder: (tableName, waiter, customer) => {
    const orderId = String(Date.now()).slice(-6);
    const newOrder: Order = {
      id: orderId,
      table: tableName,
      waiter,
      customer,
      items: [],
      subtotal: 0,
      discount: 0,
      discType: 'fixed',
      total: 0,
      status: 'active',
      startTime: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      lastModified: Date.now()
    };
    const updatedOrders = { ...get().orders, [tableName]: newOrder };
    set({ orders: updatedOrders });
    localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
    
    useSyncStore.getState().broadcast('ORDER_CREATED', { tableName, order: newOrder });
    
    return newOrder;
  },
  updateOrder: (tableName, order) => {
    const updatedOrder = { ...order, lastModified: Date.now() };
    const updatedOrders = { ...get().orders, [tableName]: updatedOrder };
    set({ orders: updatedOrders });
    localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
    
    useSyncStore.getState().broadcast('ORDER_UPDATED', { tableName, order: updatedOrder });
  },
  removeOrder: (tableName) => {
    const updatedOrders = { ...get().orders };
    delete updatedOrders[tableName];
    set({ orders: updatedOrders });
    localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
    
    useSyncStore.getState().broadcast('ORDER_DELETED', { tableName });
  },
  moveOrder: (from, to) => {
    const orders = { ...get().orders };
    const order = orders[from];
    if (!order) return;
    
    const updatedOrder = { ...order, table: to, lastModified: Date.now() };
    const updatedOrders = { ...orders };
    updatedOrders[to] = updatedOrder;
    delete updatedOrders[from];
    
    set({ orders: updatedOrders });
    localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
    
    useSyncStore.getState().broadcast('ORDER_UPDATED', { tableName: to, order: updatedOrder });
    useSyncStore.getState().broadcast('ORDER_DELETED', { tableName: from });
  },
  mergeOrders: (from, to) => {
    const orders = { ...get().orders };
    const fromOrder = orders[from];
    const toOrder = orders[to];
    if (!fromOrder || !toOrder) return;
    
    const updatedToOrder = {
      ...toOrder,
      items: [...toOrder.items, ...fromOrder.items],
      subtotal: toOrder.subtotal + fromOrder.subtotal,
      total: toOrder.total + fromOrder.total,
      lastModified: Date.now()
    };
    
    const updatedOrders = { ...orders };
    updatedOrders[to] = updatedToOrder;
    delete updatedOrders[from];
    
    set({ orders: updatedOrders });
    localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
    
    useSyncStore.getState().broadcast('ORDER_UPDATED', { tableName: to, order: updatedToOrder });
    useSyncStore.getState().broadcast('ORDER_DELETED', { tableName: from });
  },
  saveOrders: () => {
    localStorage.setItem('savedOrders', JSON.stringify(get().orders));
  },
  getTableStatus: (tableName) => {
    return get().orders[tableName] ? 'occupied' : 'empty';
  },
}));

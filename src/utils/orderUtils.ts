import { Order, OrderItem, Payment, HistoryOrder, AppUser } from '../types';

export const generateOrderId = (): string => {
  return String(Date.now()).slice(-6);
};

export const formatCurrency = (amount: number): string => {
  return `PKR ${amount.toLocaleString()}`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const calcOrderTotals = (items: OrderItem[], discount: number, discType: 'fixed' | 'percent', taxRate: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  let discountAmt = 0;

  if (discType === 'percent') {
    discountAmt = (subtotal * discount) / 100;
  } else {
    discountAmt = discount;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmt);
  const taxVal = (taxableAmount * taxRate) / 100;

  return {
    subtotal,
    discountAmt,
    taxVal,
    total: Math.max(0, taxableAmount + taxVal)
  };
};

export const finalizeOrder = (
  order: Order, 
  payments: Payment[], 
  currentUser: AppUser
): HistoryOrder => {
  const { subtotal, discountAmt, taxVal, total } = calcOrderTotals(
    order.items, 
    order.discount, 
    order.discType, 
    order.taxRate || 0
  );

  return {
    ...order,
    payments,
    subtotal,
    discountVal: discountAmt,
    taxVal,
    total,
    cashier: currentUser.name,
    closedAt: Date.now(),
    status: 'completed',
    customerId: order.customerId,
    customerName: order.customerName,
    customerPhone: order.customerPhone
  };
};

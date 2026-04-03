import { create } from 'zustand';
import { Voucher, VoucherUsage, VoucherValidationResult } from '../types';

interface VoucherState {
  vouchers: Voucher[];
  usageHistory: VoucherUsage[];
  
  validateVoucher: (code: string, orderTotal: number, categoryIds?: string[], itemIds?: string[]) => VoucherValidationResult;
  applyVoucher: (code: string, orderId: string, discountAmount: number, clientId?: string) => void;
  addVoucher: (voucher: Omit<Voucher, 'id' | 'createdAt' | 'usedCount'>) => Voucher;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;
  deactivateVoucher: (id: string) => void;
  getVoucherStats: (id: string) => { totalDiscountGiven: number, usageCount: number };
  saveVouchers: () => void;
}

const VOUCHERS_KEY = 'pos_vouchers';
const USAGE_KEY = 'pos_voucher_usage';

const loadVouchers = (): Voucher[] => {
  const stored = localStorage.getItem(VOUCHERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const loadUsage = (): VoucherUsage[] => {
  const stored = localStorage.getItem(USAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const useVoucherStore = create<VoucherState>((set, get) => ({
  vouchers: loadVouchers(),
  usageHistory: loadUsage(),

  validateVoucher: (code, orderTotal, categoryIds, itemIds) => {
    const voucher = get().vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    
    if (!voucher) {
      return { valid: false, errorMessage: 'Invalid voucher code' };
    }
    
    if (!voucher.isActive) {
      return { valid: false, errorMessage: 'Voucher is disabled' };
    }
    
    const now = new Date().toISOString().split('T')[0];
    if (voucher.validFrom && now < voucher.validFrom) {
      return { valid: false, errorMessage: `Voucher valid from ${voucher.validFrom}` };
    }
    if (voucher.validTo && now > voucher.validTo) {
      return { valid: false, errorMessage: 'Voucher has expired' };
    }
    
    if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
      return { valid: false, errorMessage: 'Voucher usage limit reached' };
    }
    
    if (orderTotal < voucher.minOrderAmount) {
      return { valid: false, errorMessage: `Minimum order PKR ${voucher.minOrderAmount} required` };
    }
    
    // Check applicability (simplified for now, usually needs item-level check)
    if (voucher.appliesTo === 'category' && categoryIds) {
      const isApplicable = categoryIds.some(id => voucher.targetIds.includes(id));
      if (!isApplicable) return { valid: false, errorMessage: 'Not applicable to items in cart' };
    }
    
    if (voucher.appliesTo === 'item' && itemIds) {
      const isApplicable = itemIds.some(id => voucher.targetIds.includes(id));
      if (!isApplicable) return { valid: false, errorMessage: 'Not applicable to items in cart' };
    }

    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = (orderTotal * voucher.discountValue) / 100;
    } else {
      discountAmount = voucher.discountValue;
    }

    return { valid: true, voucher, discountAmount };
  },

  applyVoucher: (code, orderId, discountAmount, clientId) => {
    const voucher = get().vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    if (!voucher) return;

    const usage: VoucherUsage = {
      voucherId: voucher.id,
      orderId,
      clientId,
      discountApplied: discountAmount,
      usedAt: Date.now()
    };

    set(state => {
      const newVouchers = state.vouchers.map(v => 
        v.id === voucher.id ? { ...v, usedCount: v.usedCount + 1 } : v
      );
      const newUsage = [usage, ...state.usageHistory];
      
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(newVouchers));
      localStorage.setItem(USAGE_KEY, JSON.stringify(newUsage));
      
      return { vouchers: newVouchers, usageHistory: newUsage };
    });
  },

  addVoucher: (voucherData) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: `VOU-${Date.now()}`,
      createdAt: Date.now(),
      usedCount: 0
    };

    set(state => {
      const newVouchers = [newVoucher, ...state.vouchers];
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(newVouchers));
      return { vouchers: newVouchers };
    });

    return newVoucher;
  },

  updateVoucher: (id, updates) => {
    set(state => {
      const newVouchers = state.vouchers.map(v => v.id === id ? { ...v, ...updates } : v);
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(newVouchers));
      return { vouchers: newVouchers };
    });
  },

  deactivateVoucher: (id) => {
    get().updateVoucher(id, { isActive: false });
  },

  getVoucherStats: (id) => {
    const usage = get().usageHistory.filter(u => u.voucherId === id);
    return {
      totalDiscountGiven: usage.reduce((sum, u) => sum + u.discountApplied, 0),
      usageCount: usage.length
    };
  },

  saveVouchers: () => {
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(get().vouchers));
    localStorage.setItem(USAGE_KEY, JSON.stringify(get().usageHistory));
  }
}));

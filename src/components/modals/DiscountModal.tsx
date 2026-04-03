import React, { useState, useEffect } from 'react';
import { X, Percent, Banknote, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface DiscountModalProps {
  subtotal: number;
  currentDiscount: number;
  currentDiscType: 'fixed' | 'percent';
  onApply: (amount: number, type: 'fixed' | 'percent') => void;
  onClose: () => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ 
  subtotal, 
  currentDiscount, 
  currentDiscType, 
  onApply, 
  onClose 
}) => {
  const [fixedAmount, setFixedAmount] = useState<number>(
    currentDiscType === 'fixed' ? currentDiscount : (subtotal * currentDiscount) / 100
  );
  const [percentValue, setPercentValue] = useState<number>(
    currentDiscType === 'percent' ? currentDiscount : (currentDiscount / subtotal) * 100
  );
  
  const currentUser = useAuthStore(state => state.currentUser);
  const hasPermission = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const handlePercentChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setPercentValue(num);
    setFixedAmount((subtotal * num) / 100);
  };

  const handleFixedChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setFixedAmount(num);
    setPercentValue((num / subtotal) * 100);
  };

  const newTotal = Math.max(0, subtotal - fixedAmount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-background w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-scale-in relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">Apply Discount</h2>
          <p className="text-sm text-text-secondary">Adjust order total</p>
        </div>

        {!hasPermission && (
          <div className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 flex items-center gap-3 text-danger">
            <ShieldAlert size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Manager approval required</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Percentage (%)</label>
            <div className="flex items-center gap-2 bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3">
              <Percent size={16} className="text-text-secondary" />
              <input
                type="number"
                value={percentValue || ''}
                onChange={(e) => handlePercentChange(e.target.value)}
                disabled={!hasPermission}
                className="bg-transparent w-full outline-none text-text-primary font-bold"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Fixed (PKR)</label>
            <div className="flex items-center gap-2 bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3">
              <Banknote size={16} className="text-text-secondary" />
              <input
                type="number"
                value={fixedAmount || ''}
                onChange={(e) => handleFixedChange(e.target.value)}
                disabled={!hasPermission}
                className="bg-transparent w-full outline-none text-text-primary font-bold"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center">
          <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">New Total</span>
          <span className="text-2xl font-black text-primary">PKR {newTotal.toLocaleString()}</span>
        </div>

        <button
          onClick={() => onApply(fixedAmount, 'fixed')}
          disabled={!hasPermission}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
            hasPermission ? 'bg-primary hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Apply Discount
        </button>
      </div>
    </div>
  );
};

export default DiscountModal;

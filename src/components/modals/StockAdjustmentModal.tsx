import React, { useState } from 'react';
import { X, Check, AlertCircle, Plus, Minus, Hash } from 'lucide-react';
import { Ingredient } from '../../types';
import { useInventoryStore } from '../../store/inventoryStore';
import { useToastStore } from '../../store/toastStore';
import ManagerPINModal from './ManagerPINModal';

interface StockAdjustmentModalProps {
  ingredient: Ingredient;
  currentQty: number;
  onClose: () => void;
}

type AdjustmentType = 'ADD' | 'REMOVE' | 'SET';

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ ingredient, currentQty, onClose }) => {
  const { adjustStock } = useInventoryStore();
  const { showToast } = useToastStore();
  
  const [type, setType] = useState<AdjustmentType>('ADD');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const newQty = type === 'ADD' 
    ? currentQty + amount 
    : type === 'REMOVE' 
      ? currentQty - amount 
      : amount;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (amount <= 0 && type !== 'SET') {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    if (type === 'REMOVE') {
      setShowPinModal(true);
    } else {
      confirmAdjustment();
    }
  };

  const confirmAdjustment = () => {
    const delta = type === 'ADD' 
      ? amount 
      : type === 'REMOVE' 
        ? -amount 
        : amount - currentQty;

    const movementType = type === 'ADD' ? 'ADJUSTMENT' : type === 'REMOVE' ? 'WASTAGE' : 'COUNT';
    
    adjustStock(ingredient.id, delta, reason, movementType);
    showToast('Stock adjusted successfully', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#E0E5EC] w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 flex justify-between items-center border-b border-gray-300/30">
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">
              Adjust Stock
            </h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">
              {ingredient.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Current Stock Display */}
          <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset text-center">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Current Stock</p>
            <p className="text-4xl font-black text-primary">
              {currentQty.toLocaleString()} <span className="text-lg opacity-50">{ingredient.unit}</span>
            </p>
          </div>

          {/* Adjustment Type Tabs */}
          <div className="flex p-2 rounded-2xl bg-background shadow-neumorphic-inset">
            <button 
              onClick={() => setType('ADD')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'ADD' ? 'bg-green-500 text-white shadow-lg' : 'text-text-secondary'}`}
            >
              <Plus size={14} />
              Add
            </button>
            <button 
              onClick={() => setType('REMOVE')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'REMOVE' ? 'bg-red-500 text-white shadow-lg' : 'text-text-secondary'}`}
            >
              <Minus size={14} />
              Remove
            </button>
            <button 
              onClick={() => {
                setType('SET');
                setAmount(currentQty);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'SET' ? 'bg-blue-500 text-white shadow-lg' : 'text-text-secondary'}`}
            >
              <Hash size={14} />
              Set
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">
              {type === 'SET' ? 'New Total Quantity' : 'Amount to ' + (type === 'ADD' ? 'Add' : 'Remove')}
            </label>
            <div className="relative">
              <input 
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-6 py-5 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-2xl font-black text-primary border-none text-center"
                autoFocus
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-text-secondary uppercase">{ingredient.unit}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Reason *</label>
            <input 
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
              placeholder="e.g. Manual recount, Found extra, Spillage"
            />
          </div>

          {/* Preview Row */}
          <div className="flex justify-between items-center p-4 rounded-2xl bg-background shadow-neumorphic border-l-4 border-primary">
            <p className="text-xs font-black text-text-secondary uppercase tracking-widest">New Stock Preview</p>
            <p className="text-lg font-black text-primary">
              {newQty.toLocaleString()} {ingredient.unit}
            </p>
          </div>

          <button 
            onClick={() => handleSubmit()}
            className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 ${
              type === 'ADD' ? 'bg-green-500' : type === 'REMOVE' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            <Check size={24} />
            <span>Apply Adjustment</span>
          </button>
        </div>
      </div>

      {showPinModal && (
        <ManagerPINModal 
          onApprove={confirmAdjustment}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
};

export default StockAdjustmentModal;

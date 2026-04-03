import React, { useState, useMemo } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';
import { useWastageStore } from '../../store/wastageStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface DeclareWastageModalProps {
  onClose: () => void;
}

const DeclareWastageModal: React.FC<DeclareWastageModalProps> = ({ onClose }) => {
  const { addWastage } = useWastageStore();
  const { ingredients, getStockQty } = useInventoryStore();
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();

  const [ingredientId, setIngredientId] = useState('');
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState('');

  const activeIngredients = useMemo(() => ingredients.filter(i => !i.archived), [ingredients]);
  const selectedIngredient = useMemo(() => ingredients.find(i => i.id === ingredientId), [ingredients, ingredientId]);
  const currentStock = ingredientId ? getStockQty(ingredientId) : 0;

  const handleDeclare = () => {
    if (!ingredientId) {
      showToast('Please select an ingredient', 'error');
      return;
    }
    if (qty <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    if (qty > currentStock) {
      showToast('Wastage cannot exceed current stock', 'error');
      return;
    }
    if (!reason) {
      showToast('Please provide a reason for wastage', 'error');
      return;
    }

    addWastage({
      ingredientId,
      ingredientName: selectedIngredient?.name || 'Unknown',
      qty,
      unit: selectedIngredient?.unit || '',
      reason,
      declaredBy: currentUser?.name || 'Staff',
      status: 'pending'
    });

    showToast('Wastage declared and pending manager approval', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-gray-300/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Declare Wastage</h2>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Report spoiled or wasted stock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Ingredient</label>
            <select 
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
            >
              <option value="">Select Ingredient...</option>
              {activeIngredients.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            {ingredientId && (
              <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-4 mt-1">
                Current Stock: <span className="text-orange-600">{currentStock} {selectedIngredient?.unit}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Quantity to Waste</label>
            <div className="relative">
              <input 
                type="number"
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                {selectedIngredient?.unit || '-'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Reason</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being wasted? (e.g., Expired, Spilled, Burnt)"
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none min-h-[100px] resize-none"
            />
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3 border border-orange-100">
            <AlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-orange-700 leading-relaxed">
              Wastage declarations require manager approval before stock is deducted. Please ensure the reason is accurate.
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-gray-300/30 bg-gray-50/50 flex justify-end">
          <button 
            onClick={handleDeclare}
            className="px-10 py-4 rounded-2xl bg-orange-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Save size={20} />
            Declare Wastage
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclareWastageModal;

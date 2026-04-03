import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, Plus, Minus, Trash2, ChevronRight, User, CheckCircle2, AlertCircle, GripVertical } from 'lucide-react';
import { Order, SplitBillConfig, SplitPortion, SplitItem, OrderItem } from '../../types';
import { formatCurrency } from '../../utils/reportUtils';
import { usePermission } from '../../hooks/usePermission';
import { usePrompt } from '../../hooks/usePrompt';
import { toast } from 'sonner';

interface SplitBillModalProps {
  order: Order;
  onComplete: (splits: SplitPortion[]) => void;
  onClose: () => void;
}

const SplitBillModal: React.FC<SplitBillModalProps> = ({ order, onComplete, onClose }) => {
  const { hasPerm } = usePermission();
  const { askConfirm, askPIN } = usePrompt();
  const [mode, setMode] = useState<'equal' | 'byItem' | 'custom'>('equal');
  const [partyCount, setPartyCount] = useState(2);
  const [parties, setParties] = useState<{ id: string; label: string; customAmount?: number; items: SplitItem[] }[]>([
    { id: '1', label: 'Person 1', items: [] },
    { id: '2', label: 'Person 2', items: [] },
  ]);

  const canSplit = hasPerm('splitOrder');

  // Equal Split Logic
  const equalSplits = useMemo(() => {
    const amountPerPerson = Math.floor(order.total / partyCount);
    const remainder = order.total - (amountPerPerson * partyCount);
    
    return Array.from({ length: partyCount }).map((_, i) => ({
      id: `equal-${i + 1}`,
      label: `Person ${i + 1}`,
      amount: i === partyCount - 1 ? amountPerPerson + remainder : amountPerPerson,
      isRemainder: i === partyCount - 1 && remainder > 0,
      remainderAmount: remainder
    }));
  }, [order.total, partyCount]);

  // By Item Logic
  const [unassignedItems, setUnassignedItems] = useState<SplitItem[]>([]);

  useEffect(() => {
    if (mode === 'byItem') {
      const initialItems = order.items.map((item, index) => ({
        orderItemIndex: index,
        itemName: item.name,
        itemTotal: item.total,
        qty: item.qty,
        assignedQty: 0
      }));
      setUnassignedItems(initialItems);
    }
  }, [mode, order.items]);

  const handleAssignItem = (itemIndex: number, partyId: string, qty: number = 1) => {
    setUnassignedItems(prev => {
      const newUnassigned = [...prev];
      const item = newUnassigned[itemIndex];
      if (item.qty >= qty) {
        item.qty -= qty;
        item.assignedQty += qty;
      }
      return newUnassigned.filter(i => i.qty > 0 || i.assignedQty > 0);
    });

    setParties(prev => prev.map(p => {
      if (p.id === partyId) {
        const existingItem = p.items.find(i => i.orderItemIndex === itemIndex);
        if (existingItem) {
          return {
            ...p,
            items: p.items.map(i => i.orderItemIndex === itemIndex ? { ...i, qty: i.qty + qty } : i)
          };
        } else {
          const orderItem = order.items[itemIndex];
          return {
            ...p,
            items: [...p.items, {
              orderItemIndex: itemIndex,
              itemName: orderItem.name,
              itemTotal: (orderItem.total / orderItem.qty) * qty,
              qty: qty,
              assignedQty: qty
            }]
          };
        }
      }
      return p;
    }));
  };

  const handleUnassignItem = (partyId: string, itemIndex: number, qty: number = 1) => {
    setParties(prev => prev.map(p => {
      if (p.id === partyId) {
        return {
          ...p,
          items: p.items.map(i => {
            if (i.orderItemIndex === itemIndex) {
              return { ...i, qty: i.qty - qty };
            }
            return i;
          }).filter(i => i.qty > 0)
        };
      }
      return p;
    }));

    setUnassignedItems(prev => {
      const existing = prev.find(i => i.orderItemIndex === itemIndex);
      if (existing) {
        return prev.map(i => i.orderItemIndex === itemIndex ? { ...i, qty: i.qty + qty } : i);
      } else {
        const orderItem = order.items[itemIndex];
        return [...prev, {
          orderItemIndex: itemIndex,
          itemName: orderItem.name,
          itemTotal: orderItem.total,
          qty: qty,
          assignedQty: 0
        }].sort((a, b) => a.orderItemIndex - b.orderItemIndex);
      }
    });
  };

  const partyTotals = useMemo(() => {
    return parties.map(p => ({
      id: p.id,
      total: p.items.reduce((acc, i) => acc + i.itemTotal, 0)
    }));
  }, [parties]);

  // Custom Amount Logic
  const [customSplits, setCustomSplits] = useState<{ id: string; label: string; amount: number }[]>([
    { id: '1', label: 'Portion 1', amount: 0 },
    { id: '2', label: 'Portion 2', amount: 0 },
  ]);

  useEffect(() => {
    if (mode === 'custom') {
      setCustomSplits(Array.from({ length: partyCount }).map((_, i) => ({
        id: `custom-${i + 1}`,
        label: `Portion ${i + 1}`,
        amount: 0
      })));
    }
  }, [mode, partyCount]);

  const customTotal = customSplits.reduce((acc, s) => acc + s.amount, 0);
  const remainingCustom = order.total - customTotal;

  const handleProceed = () => {
    let finalSplits: SplitPortion[] = [];

    if (mode === 'equal') {
      finalSplits = equalSplits.map(s => ({
        id: s.id,
        label: s.label,
        items: [], // Equal split doesn't assign specific items
        customAmount: s.amount,
        isPaid: false,
        payments: []
      }));
    } else if (mode === 'byItem') {
      if (unassignedItems.some(i => i.qty > 0)) {
        toast.error('Please assign all items before proceeding');
        return;
      }
      finalSplits = parties.map(p => ({
        id: p.id,
        label: p.label,
        items: p.items,
        isPaid: false,
        payments: []
      }));
    } else {
      if (customTotal !== order.total) {
        toast.error('Total amount must match order total');
        return;
      }
      finalSplits = customSplits.map(s => ({
        id: s.id,
        label: s.label,
        items: [],
        customAmount: s.amount,
        isPaid: false,
        payments: []
      }));
    }

    onComplete(finalSplits);
  };

  if (!canSplit) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Access Denied</h2>
          <p className="text-gray-500 mb-8">You don't have permission to split bills. Please contact a manager.</p>
          <button onClick={onClose} className="w-full py-4 bg-gray-100 rounded-2xl font-bold text-gray-900 hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#E4E3E0] rounded-[40px] shadow-2xl w-full max-w-[800px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Split Bill</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{order.table}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order Total</p>
            <p className="text-3xl font-black text-purple-600 tracking-tighter">{formatCurrency(order.total)}</p>
          </div>
          <button onClick={onClose} className="ml-6 p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 py-4 flex gap-2">
          {(['equal', 'byItem', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMode(t)}
              className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                mode === t 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                  : 'bg-white/50 text-gray-500 hover:bg-white'
              }`}
            >
              {t === 'equal' ? 'Equal Split' : t === 'byItem' ? 'By Item' : 'Custom Amount'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4">
          {mode === 'equal' && (
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => setPartyCount(Math.max(2, partyCount - 1))}
                  className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
                >
                  <Minus className="w-8 h-8 text-gray-900" />
                </button>
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Parties</p>
                  <p className="text-6xl font-black text-gray-900 tracking-tighter">{partyCount}</p>
                </div>
                <button 
                  onClick={() => setPartyCount(partyCount + 1)}
                  className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
                >
                  <Plus className="w-8 h-8 text-gray-900" />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-center">
                  Split {formatCurrency(order.total)} between {partyCount} people
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {equalSplits.map((s) => (
                    <div key={s.id} className="bg-white p-6 rounded-[32px] shadow-neumorphic">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                      <p className="text-2xl font-black text-purple-600 tracking-tighter">{formatCurrency(s.amount)}</p>
                      {s.isRemainder && (
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                          (Includes {formatCurrency(s.remainderAmount)} rounding)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'byItem' && (
            <div className="flex gap-6 h-full">
              {/* Items List */}
              <div className="flex-1 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Unassigned Items</h3>
                <div className="space-y-2">
                  {unassignedItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-purple-600 transition-colors">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 uppercase text-sm">{item.itemName}</p>
                          <p className="text-xs font-bold text-gray-500">{item.qty} × {formatCurrency(item.itemTotal / (item.qty + item.assignedQty))}</p>
                        </div>
                      </div>
                      <select 
                        onChange={(e) => handleAssignItem(idx, e.target.value)}
                        className="bg-gray-50 border-none rounded-xl text-xs font-black uppercase tracking-widest px-3 py-2 focus:ring-2 focus:ring-purple-500"
                        value=""
                      >
                        <option value="" disabled>Assign to...</option>
                        {parties.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {unassignedItems.length === 0 && (
                    <div className="p-8 text-center bg-green-50 rounded-[32px] border-2 border-dashed border-green-200">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-black text-green-600 uppercase tracking-widest">All items assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parties Columns */}
              <div className="w-1/2 space-y-4 overflow-y-auto pr-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Parties</h3>
                  <button 
                    onClick={() => setParties([...parties, { id: String(parties.length + 1), label: `Person ${parties.length + 1}`, items: [] }])}
                    className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {parties.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[32px] shadow-neumorphic space-y-4">
                      <div className="flex items-center justify-between">
                        <input 
                          value={p.label}
                          onChange={(e) => setParties(parties.map(party => party.id === p.id ? { ...party, label: e.target.value } : party))}
                          className="font-black text-gray-900 uppercase text-sm bg-transparent border-none p-0 focus:ring-0 w-2/3"
                        />
                        <p className="font-black text-purple-600 text-lg tracking-tighter">
                          {formatCurrency(partyTotals.find(t => t.id === p.id)?.total || 0)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {p.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-600">{item.qty} × {item.itemName}</span>
                            <button 
                              onClick={() => handleUnassignItem(p.id, item.orderItemIndex, 1)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => setPartyCount(Math.max(2, partyCount - 1))}
                  className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
                >
                  <Minus className="w-8 h-8 text-gray-900" />
                </button>
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Parties</p>
                  <p className="text-6xl font-black text-gray-900 tracking-tighter">{partyCount}</p>
                </div>
                <button 
                  onClick={() => setPartyCount(partyCount + 1)}
                  className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
                >
                  <Plus className="w-8 h-8 text-gray-900" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {customSplits.map((s, idx) => (
                  <div key={s.id} className="bg-white p-6 rounded-[32px] shadow-neumorphic space-y-4">
                    <input 
                      value={s.label}
                      onChange={(e) => setCustomSplits(customSplits.map(split => split.id === s.id ? { ...split, label: e.target.value } : split))}
                      className="text-xs font-black text-gray-400 uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 w-full"
                    />
                    <div className="relative">
                      <input 
                        type="number"
                        value={s.amount || ''}
                        onChange={(e) => setCustomSplits(customSplits.map(split => split.id === s.id ? { ...split, amount: Number(e.target.value) } : split))}
                        className="w-full bg-gray-50 shadow-neumorphic-inset border-none rounded-2xl py-4 px-6 text-2xl font-black text-purple-600 focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                      {idx === customSplits.length - 1 && remainingCustom > 0 && (
                        <button 
                          onClick={() => setCustomSplits(customSplits.map(split => split.id === s.id ? { ...split, amount: s.amount + remainingCustom } : split))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          Auto-fill
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white rounded-[32px] shadow-neumorphic flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Running Total</p>
                  <p className={`text-2xl font-black tracking-tighter ${customTotal === order.total ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(customTotal)} / {formatCurrency(order.total)}
                  </p>
                </div>
                {remainingCustom !== 0 && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      {remainingCustom > 0 ? `PKR ${remainingCustom} unallocated` : `PKR ${Math.abs(remainingCustom)} over`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-black/5 bg-white/30">
          <button 
            onClick={handleProceed}
            disabled={mode === 'custom' && customTotal !== order.total}
            className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${
              (mode === 'custom' && customTotal !== order.total)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
            }`}
          >
            Proceed to Payment
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SplitBillModal;

import React, { useState, useMemo } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { MenuItem, SelectedModifier } from '../../types';

interface ModifierModalProps {
  item: MenuItem;
  basePrice: number;
  variantName?: string;
  onConfirm: (modifiers: SelectedModifier[]) => void;
  onClose: () => void;
}

const ModifierModal: React.FC<ModifierModalProps> = ({ item, basePrice, variantName, onConfirm, onClose }) => {
  const [selections, setSelections] = useState<SelectedModifier[]>([]);

  const toggleOption = (groupName: string, optionName: string, price: number) => {
    const existing = selections.find(s => s.groupName === groupName && s.optionName === optionName);
    if (existing) {
      setSelections(selections.filter(s => !(s.groupName === groupName && s.optionName === optionName)));
    } else {
      setSelections([...selections, { groupName, optionName, price, qty: 1 }]);
    }
  };

  const updateQty = (groupName: string, optionName: string, delta: number) => {
    setSelections(prev => prev.map(s => {
      if (s.groupName === groupName && s.optionName === optionName) {
        const newQty = Math.max(0, Math.min(10, s.qty + delta));
        return { ...s, qty: newQty };
      }
      return s;
    }).filter(s => s.qty > 0));
  };

  const totalPrice = useMemo(() => {
    const modifiersTotal = selections.reduce((sum, mod) => sum + (mod.price * mod.qty), 0);
    return basePrice + modifiersTotal;
  }, [basePrice, selections]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-[500px] rounded-3xl p-6 shadow-2xl animate-scale-in relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">{item.name}</h2>
          {variantName && <p className="text-sm text-text-secondary">Option: {variantName}</p>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
          {item.modifiers?.map((group) => (
            <div key={group.groupName} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-primary/20 pb-1">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                  {group.groupName}
                </span>
                {group.maxSelect && (
                  <span className="text-[10px] text-text-secondary italic">
                    (Max {group.maxSelect})
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {group.options.map((opt) => {
                  const selection = selections.find(s => s.groupName === group.groupName && s.optionName === opt.name);
                  const isSelected = !!selection;

                  return (
                    <div key={opt.name} className="relative group">
                      <button
                        onClick={() => toggleOption(group.groupName, opt.name, opt.price)}
                        className={`
                          px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[100px] transition-all duration-200
                          ${isSelected 
                            ? 'bg-primary text-white scale-95 shadow-neumorphic-inset' 
                            : 'bg-background shadow-neumorphic text-text-primary hover:scale-105'
                          }
                        `}
                      >
                        <span className="font-bold text-sm">{opt.name}</span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-success'}`}>
                          +Rs. {opt.price}
                        </span>

                        {isSelected && (
                          <div 
                            className="mt-2 flex items-center gap-2 bg-black/15 rounded-full px-2 py-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              onClick={() => updateQty(group.groupName, opt.name, -1)}
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-bold min-w-[12px]">{selection.qty}</span>
                            <button 
                              onClick={() => updateQty(group.groupName, opt.name, 1)}
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Live Summary Bar */}
        <div className="mt-8 p-4 bg-background shadow-neumorphic-inset rounded-2xl flex justify-between items-center">
          <div className="flex flex-wrap gap-2 flex-1 mr-4">
            {selections.length === 0 ? (
              <span className="text-xs text-text-secondary italic">No extras selected</span>
            ) : (
              selections.map((s, idx) => (
                <span key={idx} className="bg-primary text-white text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                  {s.optionName} {s.qty > 1 && <span className="bg-white/20 px-1 rounded">x{s.qty}</span>}
                </span>
              ))
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Total Price</p>
            <p className="text-xl font-black text-primary leading-none">Rs. {totalPrice}</p>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => onConfirm([])}
            className="flex-1 py-4 rounded-2xl font-bold text-text-secondary bg-background shadow-neumorphic hover:text-primary transition-all active:shadow-neumorphic-inset"
          >
            No Extras
          </button>
          <button
            onClick={() => onConfirm(selections)}
            className="flex-[2] py-4 rounded-2xl font-bold text-white bg-primary shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            Add to Order — Rs. {totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifierModal;

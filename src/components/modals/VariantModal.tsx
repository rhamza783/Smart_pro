import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MenuItem, Variant } from '../../types';

interface VariantModalProps {
  item: MenuItem;
  onSelect: (variant: Variant) => void;
  onClose: () => void;
}

const VariantModal: React.FC<VariantModalProps> = ({ item, onSelect, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedVariants = [...(item.variants || [])].sort((a, b) => a.vPrice - b.vPrice);

  const handleSelect = (v: Variant) => {
    setSelectedId(v.vName);
    setTimeout(() => {
      onSelect(v);
    }, 200);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-scale-in relative"
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
          <p className="text-sm text-text-secondary">Select a size or option</p>
        </div>

        <div className="space-y-4">
          {sortedVariants.map((v) => (
            <button
              key={v.vName}
              onClick={() => handleSelect(v)}
              className={`
                w-full flex justify-between items-center p-4 rounded-2xl transition-all duration-200 border-2
                ${selectedId === v.vName 
                  ? 'bg-success/20 border-success scale-[0.98]' 
                  : 'bg-background shadow-neumorphic border-transparent hover:border-primary/50'
                }
              `}
            >
              <span className="font-bold text-base text-text-primary">{v.vName}</span>
              <span className="font-bold text-lg text-primary">Rs. {v.vPrice}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-3 rounded-xl font-bold text-text-secondary hover:text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VariantModal;

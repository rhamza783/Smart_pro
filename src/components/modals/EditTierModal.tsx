import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { LoyaltyTier } from '../../types';

interface EditTierModalProps {
  tier: LoyaltyTier;
  onSave: (tier: LoyaltyTier) => void;
  onClose: () => void;
}

const EditTierModal: React.FC<EditTierModalProps> = ({ tier, onSave, onClose }) => {
  const [formData, setFormData] = useState<LoyaltyTier>({ ...tier });
  const [newPerk, setNewPerk] = useState('');

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setFormData({ ...formData, perks: [...formData.perks, newPerk.trim()] });
      setNewPerk('');
    }
  };

  const handleRemovePerk = (index: number) => {
    setFormData({ ...formData, perks: formData.perks.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-[#E0E5EC] rounded-[32px] p-8 shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">Edit {tier.name} Tier</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Tier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Min Points</label>
              <input
                type="number"
                value={formData.minPoints}
                onChange={(e) => setFormData({ ...formData, minPoints: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Badge Emoji</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none text-center text-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Tier Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
              />
              <span className="font-mono text-sm uppercase">{formData.color}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Perks</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPerk}
                onChange={(e) => setNewPerk(e.target.value)}
                placeholder="Add a perk..."
                className="flex-1 bg-[#E0E5EC] border-none rounded-2xl p-3 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
              <button
                onClick={handleAddPerk}
                className="p-3 bg-purple-600 text-white rounded-2xl shadow-neumorphic hover:bg-purple-700 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {formData.perks.map((perk, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/30 p-2 rounded-xl text-sm">
                  <span>{perk}</span>
                  <button onClick={() => handleRemovePerk(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSave(formData)}
          className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-neumorphic hover:bg-purple-700 transition-all mt-8"
        >
          Save Tier
        </button>
      </div>
    </div>
  );
};

export default EditTierModal;

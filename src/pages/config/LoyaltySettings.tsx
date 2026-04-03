import React, { useState } from 'react';
import { Settings, Award, TrendingUp, Edit2, Plus, Trash2 } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import { LoyaltyTier } from '../../types';
import EditTierModal from '../../components/modals/EditTierModal';

const LoyaltySettings: React.FC = () => {
  const { loyaltySettings, updateLoyaltySettings } = useClientStore();
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [calcAmount, setCalcAmount] = useState<number>(1000);

  const handleUpdateTier = (updatedTier: LoyaltyTier) => {
    const newTiers = loyaltySettings.tiers.map(t => t.name === editingTier?.name ? updatedTier : t);
    updateLoyaltySettings({ tiers: newTiers });
    setEditingTier(null);
  };

  const earnedPoints = Math.floor(calcAmount * loyaltySettings.pointsPerCurrency);
  const pointsValue = Math.floor(earnedPoints / loyaltySettings.redeemRate);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Points Configuration */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#E0E5EC] rounded-[32px] p-6 shadow-neumorphic">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-black text-gray-700 uppercase tracking-tight">Earning Rate</h3>
          </div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Points per PKR 1 spent</label>
          <input
            type="number"
            value={loyaltySettings.pointsPerCurrency}
            onChange={(e) => updateLoyaltySettings({ pointsPerCurrency: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-2 italic">Example: Spend PKR 1 = Earn {loyaltySettings.pointsPerCurrency} pts</p>
        </div>

        <div className="bg-[#E0E5EC] rounded-[32px] p-6 shadow-neumorphic">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Award size={20} />
            </div>
            <h3 className="font-black text-gray-700 uppercase tracking-tight">Redeem Rate</h3>
          </div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Points for PKR 1 discount</label>
          <input
            type="number"
            value={loyaltySettings.redeemRate}
            onChange={(e) => updateLoyaltySettings({ redeemRate: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-2 italic">Example: {loyaltySettings.redeemRate} pts = PKR 1 discount</p>
        </div>

        <div className="bg-[#E0E5EC] rounded-[32px] p-6 shadow-neumorphic">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Settings size={20} />
            </div>
            <h3 className="font-black text-gray-700 uppercase tracking-tight">Min Redemption</h3>
          </div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Minimum points to redeem</label>
          <input
            type="number"
            value={loyaltySettings.minRedeem}
            onChange={(e) => updateLoyaltySettings({ minRedeem: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-2 italic">Customers must have at least this many points</p>
        </div>
      </section>

      {/* Tiers Configuration */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">Loyalty Tiers</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loyaltySettings.tiers.map((tier, idx) => (
            <div key={idx} className="bg-[#E0E5EC] rounded-[32px] p-6 shadow-neumorphic flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{tier.badge}</span>
                <button 
                  onClick={() => setEditingTier(tier)}
                  className="p-2 bg-white/50 rounded-xl hover:bg-white transition-all text-purple-600"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <h4 className="font-black text-lg uppercase tracking-tight" style={{ color: tier.color }}>{tier.name}</h4>
              <p className="text-xs font-bold text-gray-500 mb-4">{tier.minPoints.toLocaleString()} pts required</p>
              
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Perks</p>
                {tier.perks.length > 0 ? (
                  <ul className="space-y-1">
                    {tier.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="text-xs flex items-center gap-2 text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-purple-500" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-gray-400">No perks defined</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Points Calculator */}
      <section className="bg-purple-600 rounded-[32px] p-8 text-white shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight mb-6">Live Points Calculator</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1 ml-1">If customer spends PKR:</label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-white/10 border-none rounded-2xl p-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 outline-none text-2xl font-black"
            />
          </div>
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">They earn</p>
              <p className="text-4xl font-black">{earnedPoints.toLocaleString()} <span className="text-sm font-normal">pts</span></p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">Worth PKR</p>
              <p className="text-4xl font-black">{pointsValue.toLocaleString()} <span className="text-sm font-normal">discount</span></p>
            </div>
          </div>
        </div>
      </section>

      {editingTier && (
        <EditTierModal
          tier={editingTier}
          onSave={handleUpdateTier}
          onClose={() => setEditingTier(null)}
        />
      )}
    </div>
  );
};

export default LoyaltySettings;

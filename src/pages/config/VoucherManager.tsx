import React, { useState, useMemo } from 'react';
import { Ticket, Plus, Trash2, RefreshCw, Check, X, Search, Calendar, Tag, ShoppingBag } from 'lucide-react';
import { useVoucherStore } from '../../store/voucherStore';
import { useMenuStore } from '../../store/menuStore';
import { Voucher } from '../../types';

const VoucherManager: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deactivateVoucher, getVoucherStats } = useVoucherStore();
  const { menuCategories, menuItems } = useMenuStore();
  
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 0,
    minOrderAmount: 0,
    maxUses: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    isActive: true,
    appliesTo: 'all',
    targetIds: []
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSave = () => {
    if (!formData.code || !formData.discountValue) return;
    
    if (editingVoucher) {
      updateVoucher(editingVoucher.id, formData);
    } else {
      addVoucher(formData as Omit<Voucher, 'id' | 'createdAt' | 'usedCount'>);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percent',
      discountValue: 0,
      minOrderAmount: 0,
      maxUses: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      isActive: true,
      appliesTo: 'all',
      targetIds: []
    });
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({ ...voucher });
  };

  const getStatus = (voucher: Voucher) => {
    if (!voucher.isActive) return { label: 'DISABLED', color: 'bg-red-100 text-red-600' };
    const now = new Date().toISOString().split('T')[0];
    if (voucher.validTo && now > voucher.validTo) return { label: 'EXPIRED', color: 'bg-gray-100 text-gray-600' };
    return { label: 'ACTIVE', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* List Column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">Active Vouchers</h3>
          <span className="text-xs font-bold text-gray-400">{vouchers.length} total</span>
        </div>
        
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
          {vouchers.map((voucher) => {
            const status = getStatus(voucher);
            const stats = getVoucherStats(voucher.id);
            return (
              <div 
                key={voucher.id}
                onClick={() => handleEdit(voucher)}
                className={`
                  bg-[#E0E5EC] rounded-3xl p-5 shadow-neumorphic cursor-pointer transition-all hover:scale-[1.02]
                  ${editingVoucher?.id === voucher.id ? 'ring-2 ring-purple-500' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono font-black text-lg tracking-tighter text-purple-600 uppercase">{voucher.code}</span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{voucher.description || 'No description'}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xl font-black text-gray-700">
                      {voucher.discountType === 'percent' ? `${voucher.discountValue}%` : `PKR ${voucher.discountValue}`} OFF
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      Used {voucher.usedCount}{voucher.maxUses > 0 ? `/${voucher.maxUses}` : ''} times
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Valid Until</p>
                    <p className="text-xs font-black text-gray-600">{voucher.validTo || 'Unlimited'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {vouchers.length === 0 && (
            <div className="text-center py-12 bg-white/30 rounded-[32px] border-2 border-dashed border-gray-300">
              <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 font-bold">No vouchers created yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Column */}
      <div className="lg:col-span-7">
        <div className="bg-[#E0E5EC] rounded-[40px] p-8 shadow-neumorphic sticky top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-gray-700 uppercase tracking-tight">
              {editingVoucher ? 'Edit Voucher' : 'Create Voucher'}
            </h3>
            {editingVoucher && (
              <button onClick={resetForm} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Voucher Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="E.G. SUMMER2026"
                  className="flex-1 bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none font-mono font-black"
                />
                <button 
                  onClick={generateRandomCode}
                  className="p-4 bg-white/50 text-purple-600 rounded-2xl shadow-neumorphic hover:bg-white transition-all"
                  title="Generate Random"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Discount Type</label>
              <div className="flex p-1 bg-white/30 rounded-2xl shadow-neumorphic-inset">
                <button
                  onClick={() => setFormData({ ...formData, discountType: 'percent' })}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.discountType === 'percent' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  PERCENT %
                </button>
                <button
                  onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.discountType === 'fixed' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  FIXED PKR
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Min Order Amount</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Max Uses (0 = Unlimited)</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Valid From</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Valid To</label>
              <input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Applies To</label>
              <select
                value={formData.appliesTo}
                onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as any, targetIds: [] })}
                className="w-full bg-[#E0E5EC] border-none rounded-2xl p-4 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                <option value="all">All Items</option>
                <option value="category">Specific Category</option>
                <option value="item">Specific Item</option>
              </select>
            </div>

            {formData.appliesTo !== 'all' && (
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Select {formData.appliesTo === 'category' ? 'Categories' : 'Items'}
                </label>
                <div className="max-h-32 overflow-y-auto bg-white/30 rounded-2xl p-2 space-y-1 custom-scrollbar">
                  {(formData.appliesTo === 'category' ? menuCategories : menuItems).map((target: any) => (
                    <label key={target.id} className="flex items-center gap-2 p-2 hover:bg-white/50 rounded-xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.targetIds?.includes(target.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...(formData.targetIds || []), target.id]
                            : (formData.targetIds || []).filter(id => id !== target.id);
                          setFormData({ ...formData, targetIds: newIds });
                        }}
                        className="w-4 h-4 rounded border-none bg-[#E0E5EC] shadow-neumorphic-inset text-purple-600 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-gray-600">{target.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex items-center gap-4 py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`
                  w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-neumorphic-inset
                  ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}
                `}>
                  <div className={`
                    w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300
                    ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}
                  `} />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Voucher Active</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            {editingVoucher && (
              <button
                onClick={() => {
                  deactivateVoucher(editingVoucher.id);
                  resetForm();
                }}
                className="flex-1 bg-red-100 text-red-600 font-black py-4 rounded-2xl shadow-neumorphic hover:bg-red-200 transition-all"
              >
                DISABLE
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-[2] bg-purple-600 text-white font-black py-4 rounded-2xl shadow-neumorphic hover:bg-purple-700 transition-all"
            >
              {editingVoucher ? 'UPDATE VOUCHER' : 'SAVE VOUCHER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherManager;

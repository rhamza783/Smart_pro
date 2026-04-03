import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { CreditCard, Plus, Trash2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrompt } from '../../hooks/usePrompt';

const PaymentMethodsSettings: React.FC = () => {
  const { paymentMethods, updatePaymentMethods } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [newMethod, setNewMethod] = useState('');
  const [localMethods, setLocalMethods] = useState<string[]>(paymentMethods);

  const handleAdd = () => {
    if (!newMethod.trim()) return;
    if (localMethods.includes(newMethod.trim())) return;
    setLocalMethods([...localMethods, newMethod.trim()]);
    setNewMethod('');
  };

  const handleDelete = (method: string) => {
    if (localMethods.length <= 1) return;
    setLocalMethods(localMethods.filter(m => m !== method));
  };

  const handleSave = () => {
    updatePaymentMethods(localMethods);
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Methods', 'Are you sure you want to reset payment methods to default?');
    if (confirmed) {
      setLocalMethods(['Cash', 'Udhaar', 'Account', 'Advance']);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Current Methods List */}
      <div className="lg:col-span-2 bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-inner">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800">Payment Methods</h3>
            <p className="text-sm text-gray-500 font-medium">Manage available payment options at checkout</p>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {localMethods.map((method) => (
              <motion.div
                key={method}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 bg-white/50 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
                    {method[0]}
                  </div>
                  <span className="font-bold text-gray-700">{method}</span>
                </div>
                
                <button
                  onClick={() => handleDelete(method)}
                  disabled={localMethods.length <= 1}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {localMethods.length <= 1 && (
          <div className="mt-6 flex items-center gap-2 p-4 bg-orange-50 text-orange-600 rounded-2xl text-xs font-bold">
            <AlertCircle size={16} />
            Cannot delete the last remaining payment method.
          </div>
        )}
      </div>

      {/* Add New Method Form */}
      <div className="space-y-8">
        <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-purple-600" />
            Add Method
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Method Name</label>
              <input
                type="text"
                placeholder="e.g. Foodpanda, Card"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full px-4 py-3 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500 font-bold"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!newMethod.trim()}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] disabled:opacity-50 transition-all"
            >
              Add Method
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-green-500 text-white rounded-2xl font-black shadow-lg shadow-green-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="w-full py-4 bg-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsSettings;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import { usePrompt } from '../../hooks/usePrompt';
import { toast } from 'sonner';

interface TransferWaiterModalProps {
  currentTable: string;
  currentWaiter: string;
  onTransfer: (newWaiter: string) => void;
  onClose: () => void;
}

const TransferWaiterModal: React.FC<TransferWaiterModalProps> = ({ currentTable, currentWaiter, onTransfer, onClose }) => {
  const { orders, updateOrder } = useTableStore();
  const { appWorkers } = useAuthStore();
  const { hasPerm } = usePermission();
  const { askConfirm } = usePrompt();

  const waiters = appWorkers.filter(w => w.role === 'Waiter');

  const handleTransfer = async (newWaiter: string) => {
    if (newWaiter === currentWaiter) {
      onClose();
      return;
    }

    if (!hasPerm('transferWaiter')) {
      toast.error('Permission denied');
      return;
    }

    const confirmed = await askConfirm(
      'Change Waiter',
      `Change waiter for ${currentTable} from ${currentWaiter} to ${newWaiter}?`
    );

    if (confirmed) {
      const order = orders[currentTable];
      if (order) {
        updateOrder(currentTable, { ...order, waiter: newWaiter });
        onTransfer(newWaiter);
        toast.success(`Waiter changed to ${newWaiter}`);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#E4E3E0] rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Change Waiter</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{currentTable}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-neumorphic flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Waiter</span>
            <span className="text-sm font-black text-gray-900 uppercase">{currentWaiter}</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Select New Waiter</h3>
            <div className="grid grid-cols-1 gap-2">
              {waiters.map(waiter => {
                const isActive = waiter.name === currentWaiter;
                return (
                  <button
                    key={waiter.login}
                    onClick={() => handleTransfer(waiter.name)}
                    className={`p-4 rounded-2xl text-left transition-all flex items-center justify-between ${
                      isActive 
                        ? 'bg-green-50 border-2 border-green-500' 
                        : 'bg-white shadow-neumorphic hover:shadow-neumorphic-inset'
                    }`}
                  >
                    <span className="text-sm font-black text-gray-900 uppercase">{waiter.name}</span>
                    {isActive && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-black/5 bg-white/30">
          <button 
            onClick={onClose}
            className="w-full py-6 bg-white text-gray-500 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TransferWaiterModal;

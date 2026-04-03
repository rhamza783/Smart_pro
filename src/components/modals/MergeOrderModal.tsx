import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, X, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useCartStore } from '../../store/cartStore';
import { usePermission } from '../../hooks/usePermission';
import { usePrompt } from '../../hooks/usePrompt';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/reportUtils';

interface MergeOrderModalProps {
  currentTable: string;
  onMerge: (targetTable: string) => void;
  onClose: () => void;
}

const MergeOrderModal: React.FC<MergeOrderModalProps> = ({ currentTable, onMerge, onClose }) => {
  const { orders, mergeOrders } = useTableStore();
  const { tableLayout } = useLayoutStore();
  const { hasPerm } = usePermission();
  const { askConfirm, askPIN } = usePrompt();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const currentOrder = orders[currentTable];
  const targetOrder = selectedTarget ? orders[selectedTarget] : null;

  const tables = useMemo(() => {
    const allTables: any[] = [];
    tableLayout.forEach(zone => {
      zone.sections.forEach(section => {
        section.tables.forEach(table => {
          allTables.push({ ...table, zoneName: zone.name });
        });
      });
    });
    return allTables;
  }, [tableLayout]);

  const activeOrders = useMemo(() => {
    return tables.filter(t => t.name !== currentTable && !!orders[t.name]);
  }, [tables, orders, currentTable]);

  const handleMerge = async () => {
    if (!selectedTarget) return;
    if (!hasPerm('mergeOrder')) {
      toast.error('Permission denied');
      return;
    }

    const confirmed = await askConfirm(
      'Confirm Merge',
      `Move all items from ${currentTable} into ${selectedTarget}'s order?`
    );

    if (confirmed) {
      mergeOrders(currentTable, selectedTarget);
      onMerge(selectedTarget);
      toast.success(`Orders merged into ${selectedTarget}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#E4E3E0] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
              <GitMerge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Merge Orders</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Combining {currentTable} with another table</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-neumorphic flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Table: {currentTable}</p>
              <p className="text-lg font-black text-gray-900 uppercase">{currentOrder?.items.length} Items • {formatCurrency(currentOrder?.total || 0)}</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-gray-300" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Target Table</h3>
            <div className="grid grid-cols-2 gap-4">
              {activeOrders.map(table => {
                const order = orders[table.name];
                const isSelected = selectedTarget === table.name;
                
                return (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTarget(table.name)}
                    className={`p-6 rounded-[32px] text-left transition-all ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-95' 
                        : 'bg-white text-gray-900 shadow-neumorphic hover:shadow-neumorphic-inset'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-black tracking-tighter uppercase">{table.name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                        {table.zoneName}
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                      {order?.items.length} items • {formatCurrency(order?.total || 0)}
                    </p>
                  </button>
                );
              })}
              {activeOrders.length === 0 && (
                <div className="col-span-2 p-12 text-center bg-white/50 rounded-[40px] border-2 border-dashed border-gray-200">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No other active orders to merge with</p>
                </div>
              )}
            </div>
          </div>

          {selectedTarget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 p-6 rounded-[32px] border border-green-100"
            >
              <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Merge Preview</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase">After merge, {selectedTarget} will have:</p>
                  <p className="text-xs font-bold text-gray-500">{(currentOrder?.items.length || 0) + (targetOrder?.items.length || 0)} total items</p>
                </div>
                <p className="text-2xl font-black text-green-600 tracking-tighter">
                  New Total: {formatCurrency((currentOrder?.total || 0) + (targetOrder?.total || 0))}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-black/5 bg-white/30 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-6 bg-white text-gray-500 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleMerge}
            disabled={!selectedTarget}
            className={`flex-[2] py-6 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedTarget 
                ? 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm Merge
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MergeOrderModal;

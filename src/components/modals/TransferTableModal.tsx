import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, X, Search, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useCartStore } from '../../store/cartStore';
import { usePermission } from '../../hooks/usePermission';
import { usePrompt } from '../../hooks/usePrompt';
import { toast } from 'sonner';

interface TransferTableModalProps {
  currentTable: string;
  onTransfer: (newTable: string) => void;
  onClose: () => void;
}

const TransferTableModal: React.FC<TransferTableModalProps> = ({ currentTable, onTransfer, onClose }) => {
  const { orders, moveOrder } = useTableStore();
  const { tableLayout } = useLayoutStore();
  const { hasPerm } = usePermission();
  const { askConfirm, askPIN } = usePrompt();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables = useMemo(() => {
    return tables.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tables, searchTerm, refreshKey]);

  const handleTransfer = async (targetTable: string) => {
    if (!hasPerm('transferTable')) {
      toast.error('Permission denied');
      return;
    }

    const order = orders[currentTable];
    if (order?.items.some(i => (i.printedQty || 0) > 0)) {
      const confirmed = await askConfirm(
        'KOT Printed',
        'KOT has already been sent to the kitchen. Transferring may cause confusion. Proceed anyway?'
      );
      if (!confirmed) return;
      
      const pin = await askPIN('Manager Approval Required');
      if (!pin) return;
    }

    const confirmed = await askConfirm(
      'Confirm Transfer',
      `Transfer order from ${currentTable} to ${targetTable}?`
    );

    if (confirmed) {
      moveOrder(currentTable, targetTable);
      onTransfer(targetTable);
      toast.success(`Order transferred to ${targetTable}`);
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
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Transfer Table</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Moving from {currentTable}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Search */}
        <div className="px-8 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tables..."
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8">
          {tableLayout.map(zone => {
            const zoneTables = filteredTables.filter(t => t.zoneName === zone.name);
            if (zoneTables.length === 0) return null;

            return (
              <div key={zone.id} className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{zone.name}</h3>
                <div className="grid grid-cols-4 gap-4">
                  {zoneTables.map(table => {
                    const isOccupied = !!orders[table.name];
                    const isCurrent = table.name === currentTable;
                    
                    return (
                      <button
                        key={table.name}
                        disabled={isOccupied || isCurrent}
                        onClick={() => handleTransfer(table.name)}
                        className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all relative ${
                          isCurrent 
                            ? 'bg-purple-100 border-2 border-purple-500 cursor-default'
                            : isOccupied 
                              ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                              : 'bg-white shadow-neumorphic hover:shadow-neumorphic-inset hover:scale-95 active:scale-90'
                        }`}
                      >
                        <span className={`text-lg font-black tracking-tighter ${isCurrent ? 'text-purple-600' : 'text-gray-900'}`}>
                          {table.name}
                        </span>
                        {isOccupied && !isCurrent && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Occupied</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default TransferTableModal;

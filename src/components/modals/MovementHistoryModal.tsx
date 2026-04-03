import React, { useState, useMemo } from 'react';
import { X, Download, Filter, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Ingredient, StockMovement } from '../../types';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatQty } from '../../utils/inventoryUtils';

interface MovementHistoryModalProps {
  ingredient: Ingredient;
  onClose: () => void;
}

const MovementHistoryModal: React.FC<MovementHistoryModalProps> = ({ ingredient, onClose }) => {
  const { getMovements } = useInventoryStore();
  const [filter, setFilter] = useState<string>('All');

  const movements = useMemo(() => getMovements(ingredient.id), [ingredient.id, getMovements]);

  const filteredMovements = useMemo(() => {
    if (filter === 'All') return movements;
    return movements.filter(m => m.type === filter);
  }, [movements, filter]);

  const stats = useMemo(() => {
    const totalIn = movements.filter(m => m.delta > 0).reduce((acc, m) => acc + m.delta, 0);
    const totalOut = movements.filter(m => m.delta < 0).reduce((acc, m) => acc + Math.abs(m.delta), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [movements]);

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'text-blue-600 bg-blue-100';
      case 'MANUAL': return 'text-orange-600 bg-orange-100';
      case 'WASTAGE': return 'text-red-600 bg-red-100';
      case 'SALE': return 'text-purple-600 bg-purple-100';
      case 'COUNT': return 'text-green-600 bg-green-100';
      case 'ADJUSTMENT': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Delta', 'Prev Stock', 'New Stock', 'Reason', 'User'];
    const rows = filteredMovements.map(m => [
      new Date(m.timestamp).toLocaleString(),
      m.type,
      m.delta,
      m.prevQty,
      m.newQty,
      m.reason,
      m.userId
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${ingredient.name}_history.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#E0E5EC] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 flex justify-between items-center border-b border-gray-300/30">
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">
              Movement History
            </h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">
              {ingredient.name}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleExport}
              className="p-3 rounded-2xl bg-background shadow-neumorphic text-primary hover:text-primary transition-all flex items-center gap-2"
            >
              <Download size={20} />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Export CSV</span>
            </button>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-background rounded-3xl p-4 shadow-neumorphic-inset text-center">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total In</p>
              <p className="text-lg font-black text-green-600">+{stats.totalIn.toLocaleString()}</p>
            </div>
            <div className="bg-background rounded-3xl p-4 shadow-neumorphic-inset text-center">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Total Out</p>
              <p className="text-lg font-black text-red-600">-{stats.totalOut.toLocaleString()}</p>
            </div>
            <div className="bg-background rounded-3xl p-4 shadow-neumorphic-inset text-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Net Change</p>
              <p className="text-lg font-black text-primary">{stats.net > 0 ? '+' : ''}{stats.net.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-3 overflow-x-auto no-scrollbar pb-2">
            {['All', 'PURCHASE', 'MANUAL', 'SALE', 'WASTAGE', 'COUNT', 'ADJUSTMENT'].map(t => (
              <button 
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-primary text-white shadow-lg' : 'bg-background text-text-secondary shadow-neumorphic hover:shadow-neumorphic-inset'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Movement Table */}
          <div className="bg-background rounded-3xl p-4 shadow-neumorphic overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                    <th className="pb-4 px-4">Date/Time</th>
                    <th className="pb-4 px-4">Type</th>
                    <th className="pb-4 px-4 text-center">Delta</th>
                    <th className="pb-4 px-4 text-center">Stock</th>
                    <th className="pb-4 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300/30">
                  {filteredMovements.length > 0 ? (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-primary/5 transition-all">
                        <td className="py-4 px-4">
                          <p className="text-xs font-black text-text-primary">{new Date(m.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-text-secondary">{new Date(m.timestamp).toLocaleTimeString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getMovementTypeColor(m.type)}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-center text-xs font-black ${m.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.delta > 0 ? '+' : ''}{m.delta}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <p className="text-[10px] font-bold text-text-secondary">{m.prevQty} → {m.newQty}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs font-bold text-text-primary truncate max-w-[150px]">{m.reason}</p>
                          <p className="text-[10px] font-bold text-text-secondary uppercase">{m.userId}</p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary font-bold">No movements found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementHistoryModal;

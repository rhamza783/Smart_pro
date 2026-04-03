import React, { useState, useMemo } from 'react';
import { Play, Check, X, AlertTriangle, ClipboardList, History, ChevronRight, Save } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { usePrompt } from '../../hooks/usePrompt';
import { PhysicalCount, CountEntry } from '../../types';

const PhysicalCountTab: React.FC = () => {
  const { ingredients, getStockQty, adjustStock } = useInventoryStore();
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const { askConfirm } = usePrompt();

  const [activeCount, setActiveCount] = useState<PhysicalCount | null>(null);
  const [completedCounts, setCompletedCounts] = useState<PhysicalCount[]>([]);
  const [showUncountedOnly, setShowUncountedOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeIngredients = useMemo(() => ingredients.filter(i => !i.archived), [ingredients]);

  const startNewCount = () => {
    const newCount: PhysicalCount = {
      id: `CNT-${Date.now()}`,
      startedAt: Date.now(),
      status: 'in_progress',
      entries: activeIngredients.map(ing => ({
        ingredientId: ing.id,
        systemQty: getStockQty(ing.id),
        countedQty: 0,
        variance: 0
      })),
      startedBy: currentUser?.name || 'Staff'
    };
    setActiveCount(newCount);
    showToast('Physical count started', 'info');
  };

  const updateCountedQty = (ingredientId: string, qty: number) => {
    if (!activeCount) return;
    const newEntries = activeCount.entries.map(entry => {
      if (entry.ingredientId === ingredientId) {
        return { ...entry, countedQty: qty, variance: qty - entry.systemQty };
      }
      return entry;
    });
    setActiveCount({ ...activeCount, entries: newEntries });
  };

  const filteredEntries = useMemo(() => {
    if (!activeCount) return [];
    if (showUncountedOnly) {
      return activeCount.entries.filter(e => e.countedQty === 0);
    }
    return activeCount.entries;
  }, [activeCount, showUncountedOnly]);

  const progress = useMemo(() => {
    if (!activeCount) return 0;
    const counted = activeCount.entries.filter(e => e.countedQty > 0).length;
    return Math.round((counted / activeCount.entries.length) * 100);
  }, [activeCount]);

  const handleSubmit = async () => {
    if (!activeCount) return;
    
    const uncounted = activeCount.entries.filter(e => e.countedQty === 0).length;
    if (uncounted > 0) {
      const confirmed = await askConfirm('Submit Count', `${uncounted} items have 0 counted quantity. Are you sure you want to submit?`);
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
  };

  const applyVariances = () => {
    if (!activeCount) return;
    
    activeCount.entries.forEach(entry => {
      if (entry.variance !== 0) {
        adjustStock(
          entry.ingredientId, 
          entry.variance, 
          `Physical Count Variance (${activeCount.id})`, 
          'COUNT'
        );
      }
    });

    const completedCount: PhysicalCount = {
      ...activeCount,
      status: 'completed',
      completedAt: Date.now()
    };

    setCompletedCounts([completedCount, ...completedCounts]);
    setActiveCount(null);
    setIsSubmitting(false);
    showToast('Stock levels updated with variances', 'success');
  };

  const discardCount = async () => {
    const confirmed = await askConfirm('Discard Count', 'Are you sure you want to discard this count? No changes will be saved.');
    if (confirmed) {
      setActiveCount(null);
      setIsSubmitting(false);
    }
  };

  if (!activeCount) {
    return (
      <div className="space-y-8">
        <div className="bg-background rounded-[40px] p-12 shadow-neumorphic flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-background shadow-neumorphic flex items-center justify-center mb-8">
            <ClipboardList size={48} className="text-primary/30" />
          </div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-4">No Physical Count in Progress</h2>
          <p className="text-sm font-bold text-text-secondary max-w-md mb-8">
            Start a new physical count to reconcile your system stock with actual shelf quantities.
          </p>
          <button 
            onClick={startNewCount}
            className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Play size={20} />
            Start New Count
          </button>
        </div>

        {completedCounts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest ml-4">Past Completed Counts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedCounts.map(count => (
                <div key={count.id} className="bg-background rounded-3xl p-6 shadow-neumorphic flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100 text-green-600">
                      <History size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-primary uppercase tracking-widest">{count.id}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase">
                        Completed {new Date(count.completedAt!).toLocaleDateString()} by {count.startedBy}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-text-secondary" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-orange-700 uppercase tracking-tight">Count in progress</h3>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Do not change stock manually or process purchases during count</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">Overall Progress</p>
          <div className="w-48 h-3 bg-orange-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-orange-500 transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-black text-orange-700 mt-1">{progress}% Complete</p>
        </div>
      </div>

      {/* Counting Table */}
      <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">Inventory List</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Show uncounted only</span>
            <button 
              onClick={() => setShowUncountedOnly(!showUncountedOnly)}
              className={`w-12 h-6 rounded-full transition-all relative ${showUncountedOnly ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showUncountedOnly ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">Ingredient</th>
                <th className="pb-4 px-4 text-center">Unit</th>
                {isSubmitting && <th className="pb-4 px-4 text-center">System Qty</th>}
                <th className="pb-4 px-4 text-center">Counted Qty</th>
                {isSubmitting && <th className="pb-4 px-4 text-right">Variance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filteredEntries.map((entry) => {
                const ing = ingredients.find(i => i.id === entry.ingredientId);
                return (
                  <tr key={entry.ingredientId} className={entry.countedQty === 0 ? 'bg-red-50/30' : ''}>
                    <td className="py-4 px-4">
                      <p className="text-sm font-black text-primary">{ing?.name}</p>
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{ing?.category}</p>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary uppercase">
                      {ing?.unit}
                    </td>
                    {isSubmitting && (
                      <td className="py-4 px-4 text-center text-sm font-bold text-text-primary">
                        {entry.systemQty}
                      </td>
                    )}
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="number"
                        value={entry.countedQty}
                        disabled={isSubmitting}
                        onChange={(e) => updateCountedQty(entry.ingredientId, parseFloat(e.target.value) || 0)}
                        className={`w-24 px-4 py-2 rounded-xl bg-background shadow-neumorphic-inset outline-none text-center text-sm font-black border-none ${isSubmitting ? 'opacity-50' : 'text-primary'}`}
                      />
                    </td>
                    {isSubmitting && (
                      <td className={`py-4 px-4 text-right text-sm font-black ${entry.variance > 0 ? 'text-green-600' : entry.variance < 0 ? 'text-red-600' : 'text-text-secondary'}`}>
                        {entry.variance > 0 ? '+' : ''}{entry.variance}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center p-8 bg-background rounded-[32px] shadow-neumorphic">
        <button 
          onClick={discardCount}
          className="px-8 py-3 rounded-2xl bg-background shadow-neumorphic text-red-600 font-black text-xs uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
        >
          Discard Count
        </button>
        
        {isSubmitting ? (
          <button 
            onClick={applyVariances}
            className="px-12 py-4 rounded-2xl bg-green-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Check size={20} />
            Apply Variances
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Save size={20} />
            Submit Count
          </button>
        )}
      </div>
    </div>
  );
};

export default PhysicalCountTab;

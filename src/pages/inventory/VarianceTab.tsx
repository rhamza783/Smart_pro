import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';

// Mocking past counts for UI demonstration
// In a real app, this would come from a physicalCountStore
const pastCounts = [
  {
    id: 'CNT-1711641600000',
    startedAt: 1711641600000,
    completedAt: 1711645200000,
    status: 'completed',
    startedBy: 'Manager Ahmed',
    entries: [
      { ingredientId: 'i1', systemQty: 10, countedQty: 9.5, variance: -0.5 },
      { ingredientId: 'i2', systemQty: 5, countedQty: 5.2, variance: 0.2 },
      { ingredientId: 'i3', systemQty: 20, countedQty: 20, variance: 0 },
      { ingredientId: 'i4', systemQty: 15, countedQty: 12, variance: -3 },
    ]
  },
  {
    id: 'CNT-1711555200000',
    startedAt: 1711555200000,
    completedAt: 1711558800000,
    status: 'completed',
    startedBy: 'Manager Ahmed',
    entries: [
      { ingredientId: 'i1', systemQty: 8, countedQty: 8, variance: 0 },
      { ingredientId: 'i2', systemQty: 4, countedQty: 4.5, variance: 0.5 },
    ]
  }
];

const VarianceTab: React.FC = () => {
  const { ingredients } = useInventoryStore();
  const [expandedCountId, setExpandedCountId] = useState<string | null>(null);

  const varianceWarningPct = 5; // Settings threshold
  const varianceCriticalPct = 10; // Settings threshold

  const toggleExpand = (id: string) => {
    setExpandedCountId(expandedCountId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-primary uppercase tracking-tight">Variance Reports</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <TrendingDown size={12} />
            Warning: {varianceWarningPct}%
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">
            <TrendingDown size={12} />
            Critical: {varianceCriticalPct}%
          </div>
        </div>
      </div>

      <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">Count Date</th>
                <th className="pb-4 px-4 text-center">Total Items</th>
                <th className="pb-4 px-4 text-center">Items with Variance</th>
                <th className="pb-4 px-4 text-right">Total Variance Value</th>
                <th className="pb-4 px-4 text-center">Submitted By</th>
                <th className="pb-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {pastCounts.map((count) => {
                const itemsWithVariance = count.entries.filter(e => e.variance !== 0).length;
                const totalVarianceValue = count.entries.reduce((sum, e) => {
                  const ing = ingredients.find(i => i.id === e.ingredientId);
                  return sum + (e.variance * (ing?.costPerUnit || 0));
                }, 0);

                return (
                  <React.Fragment key={count.id}>
                    <tr 
                      onClick={() => toggleExpand(count.id)}
                      className="group hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-primary/5 text-primary">
                            <Calendar size={16} />
                          </div>
                          <span className="text-sm font-black text-primary">
                            {new Date(count.completedAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center text-sm font-bold text-text-primary">
                        {count.entries.length}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${itemsWithVariance > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {itemsWithVariance} items
                        </span>
                      </td>
                      <td className={`py-6 px-4 text-right text-sm font-black ${totalVarianceValue < 0 ? 'text-red-600' : totalVarianceValue > 0 ? 'text-green-600' : 'text-text-secondary'}`}>
                        PKR {totalVarianceValue.toLocaleString()}
                      </td>
                      <td className="py-6 px-4 text-center text-xs font-bold text-text-secondary uppercase">
                        {count.startedBy}
                      </td>
                      <td className="py-6 px-4 text-right">
                        {expandedCountId === count.id ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-text-secondary" />}
                      </td>
                    </tr>
                    {expandedCountId === count.id && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div className="bg-background shadow-neumorphic-inset rounded-3xl m-4 p-6 space-y-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-gray-300/30 pb-2">Variance Breakdown</h4>
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="text-[9px] font-black text-text-secondary uppercase tracking-widest">
                                  <th className="pb-2 px-2">Ingredient</th>
                                  <th className="pb-2 px-2 text-center">System Qty</th>
                                  <th className="pb-2 px-2 text-center">Counted Qty</th>
                                  <th className="pb-2 px-2 text-right">Variance</th>
                                  <th className="pb-2 px-2 text-right">Value Impact</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-300/30">
                                {count.entries.filter(e => e.variance !== 0).map((entry, idx) => {
                                  const ing = ingredients.find(i => i.id === entry.ingredientId);
                                  const variancePct = Math.abs((entry.variance / entry.systemQty) * 100);
                                  const isCritical = variancePct > varianceCriticalPct;
                                  const isWarning = variancePct > varianceWarningPct;
                                  
                                  return (
                                    <tr key={idx}>
                                      <td className="py-3 px-2 text-xs font-bold text-text-primary">{ing?.name}</td>
                                      <td className="py-3 px-2 text-center text-xs font-bold text-text-secondary">{entry.systemQty}</td>
                                      <td className="py-3 px-2 text-center text-xs font-black text-primary">{entry.countedQty}</td>
                                      <td className={`py-3 px-2 text-right text-xs font-black ${entry.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <div className="flex flex-col items-end">
                                          <span>{entry.variance > 0 ? '+' : ''}{entry.variance} {ing?.unit}</span>
                                          <span className={`text-[8px] uppercase ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-text-secondary'}`}>
                                            ({variancePct.toFixed(1)}% variance)
                                          </span>
                                        </div>
                                      </td>
                                      <td className={`py-3 px-2 text-right text-xs font-black ${entry.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        PKR {(entry.variance * (ing?.costPerUnit || 0)).toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VarianceTab;

import React, { useState, useMemo } from 'react';
import { ShoppingCart, AlertTriangle, Package, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useToastStore } from '../../store/toastStore';
import CreatePurchaseOrderModal from '../../components/modals/CreatePurchaseOrderModal';

const ReorderTab: React.FC = () => {
  const { ingredients, getStockQty } = useInventoryStore();
  const { suppliers } = usePurchaseStore();
  const { showToast } = useToastStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const reorderItems = useMemo(() => {
    return ingredients
      .filter(ing => !ing.archived)
      .map(ing => {
        const currentQty = getStockQty(ing.id);
        const suggestedQty = Math.max(0, (ing.minThreshold * 2) - currentQty);
        return {
          ...ing,
          currentQty,
          suggestedQty,
          isLow: currentQty <= ing.minThreshold
        };
      })
      .filter(item => item.isLow);
  }, [ingredients, getStockQty]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reorderItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reorderItems.map(i => i.id));
    }
  };

  const handleCreatePO = () => {
    if (selectedIds.length === 0) {
      showToast('Please select items to reorder', 'error');
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Reorder Suggestions</h2>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">
            Ingredients at or below minimum threshold
          </p>
        </div>
        <button 
          onClick={handleCreatePO}
          disabled={selectedIds.length === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${
            selectedIds.length > 0 ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={18} />
          <span>Create PO from Suggestions ({selectedIds.length})</span>
        </button>
      </div>

      <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4 text-center">
                  <button onClick={toggleSelectAll} className="text-primary">
                    {selectedIds.length === reorderItems.length && reorderItems.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="pb-4 px-4">Ingredient</th>
                <th className="pb-4 px-4 text-center">Current Stock</th>
                <th className="pb-4 px-4 text-center">Min Threshold</th>
                <th className="pb-4 px-4 text-center">Suggested Qty</th>
                <th className="pb-4 px-4 text-right">Est. Cost</th>
                <th className="pb-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {reorderItems.length > 0 ? (
                reorderItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => toggleSelect(item.id)}
                    className="group hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <td className="py-6 px-4 text-center">
                      <div className="text-primary">
                        {selectedIds.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 shadow-sm border border-red-100">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-primary uppercase tracking-tight">{item.name}</p>
                          <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-sm font-black text-red-600">
                        {item.currentQty} {item.unit}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center text-xs font-bold text-text-secondary uppercase">
                      {item.minThreshold} {item.unit}
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-black">
                        {item.suggestedQty} {item.unit}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-right text-sm font-black text-primary">
                      PKR {(item.suggestedQty * item.costPerUnit).toLocaleString()}
                    </td>
                    <td className="py-6 px-4 text-right">
                      <ChevronRight size={20} className="text-text-secondary" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-text-secondary font-bold">
                    <div className="flex flex-col items-center gap-4">
                      <Package size={48} className="text-primary/20" />
                      <p className="text-sm font-black uppercase tracking-widest">All stock levels are healthy</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePurchaseOrderModal 
          onClose={() => setIsCreateModalOpen(false)} 
          // In a real app, we'd pass the pre-filled items to the modal
        />
      )}
    </div>
  );
};

export default ReorderTab;

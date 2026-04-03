import React, { useState, useMemo } from 'react';
import { Plus, Filter, Eye, Check, X, AlertCircle, ShoppingCart } from 'lucide-react';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import CreatePurchaseOrderModal from '../../components/modals/CreatePurchaseOrderModal';
import PODetailModal from '../../components/modals/PODetailModal';

const PurchasesTab: React.FC = () => {
  const { purchaseOrders, approvePurchaseOrder, rejectPurchaseOrder } = usePurchaseStore();
  const { currentUser } = useAuthStore();
  const { hasPerm } = usePermission();
  const canApprove = hasPerm('approvePurchase');

  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return purchaseOrders;
    return purchaseOrders.filter(po => po.status === statusFilter);
  }, [purchaseOrders, statusFilter]);

  const selectedPO = useMemo(() => 
    purchaseOrders.find(po => po.id === selectedPOId), 
    [purchaseOrders, selectedPOId]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex p-2 rounded-2xl bg-background shadow-neumorphic-inset">
          {['All', 'pending', 'approved', 'rejected'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-primary'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
        >
          <Plus size={18} />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="bg-background rounded-[32px] p-6 shadow-neumorphic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">PO Number</th>
                <th className="pb-4 px-4">Supplier</th>
                <th className="pb-4 px-4 text-center">Items Count</th>
                <th className="pb-4 px-4 text-right">Total Cost</th>
                <th className="pb-4 px-4 text-center">Date</th>
                <th className="pb-4 px-4 text-center">Status</th>
                <th className="pb-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((po) => (
                  <tr 
                    key={po.id} 
                    className={`group hover:bg-primary/5 transition-all ${po.status === 'pending' ? 'border-l-4 border-yellow-400' : ''}`}
                  >
                    <td className="py-4 px-4 text-sm font-black text-primary">{po.id}</td>
                    <td className="py-4 px-4 text-sm font-bold text-text-primary">{po.supplierName}</td>
                    <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary">
                      {po.items.length} items
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-black text-primary">
                      PKR {po.totalCost.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center text-[10px] font-bold text-text-secondary uppercase">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedPOId(po.id)}
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-blue-600 hover:shadow-neumorphic-inset transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        {po.status === 'pending' && (
                          <>
                            {canApprove && (
                              <button 
                                onClick={() => setSelectedPOId(po.id)}
                                className="p-2 rounded-xl bg-background shadow-neumorphic text-green-600 hover:shadow-neumorphic-inset transition-all"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectedPOId(po.id)}
                              className="p-2 rounded-xl bg-background shadow-neumorphic text-red-600 hover:shadow-neumorphic-inset transition-all"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-text-secondary font-bold">
                    <div className="flex flex-col items-center gap-4">
                      <ShoppingCart size={48} className="text-primary/20" />
                      <p className="text-sm font-black uppercase tracking-widest">No purchase orders found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePurchaseOrderModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {selectedPO && (
        <PODetailModal 
          po={selectedPO} 
          onClose={() => setSelectedPOId(null)} 
        />
      )}
    </div>
  );
};

export default PurchasesTab;

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Check, X, AlertCircle, Trash } from 'lucide-react';
import { useWastageStore } from '../../store/wastageStore';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import DeclareWastageModal from '../../components/modals/DeclareWastageModal';
import ManagerPINModal from '../../components/modals/ManagerPINModal';
import { useToastStore } from '../../store/toastStore';

const WastageTab: React.FC = () => {
  const { wastageEntries, approveWastage, rejectWastage } = useWastageStore();
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const { hasPerm } = usePermission();
  const canApprove = hasPerm('approveWastage');

  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [isPINModalOpen, setIsPINModalOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (statusFilter === 'All') return wastageEntries;
    return wastageEntries.filter(w => w.status === statusFilter);
  }, [wastageEntries, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = (id: string) => {
    setPendingActionId(id);
    setIsPINModalOpen(true);
  };

  const onPINSuccess = () => {
    if (pendingActionId) {
      approveWastage(pendingActionId, currentUser?.name || 'Manager');
      showToast('Wastage approved and stock deducted', 'success');
      setPendingActionId(null);
    }
    setIsPINModalOpen(false);
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
          onClick={() => setIsDeclareModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
        >
          <Plus size={18} />
          <span>Declare Wastage</span>
        </button>
      </div>

      {/* Wastage Table */}
      <div className="bg-background rounded-[32px] p-6 shadow-neumorphic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">Date</th>
                <th className="pb-4 px-4">Ingredient</th>
                <th className="pb-4 px-4 text-center">Quantity</th>
                <th className="pb-4 px-4">Reason</th>
                <th className="pb-4 px-4">Declared By</th>
                <th className="pb-4 px-4 text-center">Status</th>
                <th className="pb-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`group hover:bg-primary/5 transition-all ${entry.status === 'pending' ? 'border-l-4 border-yellow-400' : ''}`}
                  >
                    <td className="py-4 px-4 text-[10px] font-bold text-text-secondary uppercase">
                      {new Date(entry.declaredAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm font-black text-primary">{entry.ingredientName}</td>
                    <td className="py-4 px-4 text-center text-sm font-black text-primary">
                      {entry.qty} {entry.unit}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-text-primary italic truncate max-w-[200px]">
                      "{entry.reason}"
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-text-secondary">{entry.declaredBy}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {entry.status === 'pending' && (
                          <>
                            {canApprove && (
                              <button 
                                onClick={() => handleApprove(entry.id)}
                                className="p-2 rounded-xl bg-background shadow-neumorphic text-green-600 hover:shadow-neumorphic-inset transition-all"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => rejectWastage(entry.id)}
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
                      <Trash size={48} className="text-primary/20" />
                      <p className="text-sm font-black uppercase tracking-widest">No wastage entries found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeclareModalOpen && (
        <DeclareWastageModal onClose={() => setIsDeclareModalOpen(false)} />
      )}

      {isPINModalOpen && (
        <ManagerPINModal 
          onSuccess={onPINSuccess}
          onClose={() => setIsPINModalOpen(false)}
        />
      )}
    </div>
  );
};

export default WastageTab;

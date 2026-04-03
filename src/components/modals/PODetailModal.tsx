import React, { useState } from 'react';
import { X, Check, XCircle, ShoppingCart, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import { useToastStore } from '../../store/toastStore';
import { PurchaseOrder } from '../../types';
import ManagerPINModal from './ManagerPINModal';

interface PODetailModalProps {
  po: PurchaseOrder;
  onClose: () => void;
}

const PODetailModal: React.FC<PODetailModalProps> = ({ po, onClose }) => {
  const { approvePurchaseOrder, rejectPurchaseOrder } = usePurchaseStore();
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const { hasPerm } = usePermission();
  const canApprove = hasPerm('approvePurchase');

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isPINModalOpen, setIsPINModalOpen] = useState(false);

  const handleApprove = () => {
    setIsPINModalOpen(true);
  };

  const onPINSuccess = () => {
    approvePurchaseOrder(po.id, currentUser?.name || 'Manager');
    showToast('Purchase Order approved and stock updated', 'success');
    setIsPINModalOpen(false);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    rejectPurchaseOrder(po.id, rejectReason);
    showToast('Purchase Order rejected', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-300/30 flex justify-between items-center bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">PO #{po.id}</h2>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Purchase Order Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Supplier</p>
                <p className="text-sm font-black text-primary">{po.supplierName}</p>
              </div>
            </div>
            <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Created Date</p>
                <p className="text-sm font-black text-primary">{new Date(po.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest ml-4">Order Items</h3>
            <div className="bg-background rounded-3xl p-6 shadow-neumorphic overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                    <th className="pb-4 px-4">Ingredient</th>
                    <th className="pb-4 px-4 text-center">Quantity</th>
                    <th className="pb-4 px-4 text-center">Unit</th>
                    <th className="pb-4 px-4 text-right">Unit Cost</th>
                    <th className="pb-4 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300/30">
                  {po.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 px-4 text-sm font-bold text-text-primary">{item.ingredientName}</td>
                      <td className="py-4 px-4 text-center text-sm font-black text-primary">{item.qty}</td>
                      <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary uppercase">{item.unit}</td>
                      <td className="py-4 px-4 text-right text-xs font-bold text-text-primary">PKR {item.unitCost.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-sm font-black text-primary">PKR {item.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Notes</p>
                <p className="text-sm font-bold text-text-primary mt-1">{po.notes}</p>
              </div>
            </div>
          )}

          {/* Status Info */}
          {po.status !== 'pending' && (
            <div className={`rounded-3xl p-6 flex items-center gap-4 ${po.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <div className={`p-3 rounded-xl ${po.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                {po.status === 'approved' ? <Check size={18} /> : <XCircle size={18} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Status: {po.status}</p>
                {po.status === 'approved' ? (
                  <p className="text-sm font-black">Approved by {po.approvedBy} on {new Date(po.approvedAt!).toLocaleDateString()}</p>
                ) : (
                  <p className="text-sm font-black">Reason: {po.rejectedReason}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-300/30 bg-gray-50/50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total Order Value</p>
            <p className="text-2xl font-black text-primary">PKR {po.totalCost.toLocaleString()}</p>
          </div>
          
          {po.status === 'pending' && (
            <div className="flex gap-4">
              {isRejecting ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background shadow-neumorphic-inset outline-none text-xs font-bold border-none w-64"
                  />
                  <button 
                    onClick={handleReject}
                    className="p-3 rounded-xl bg-red-600 text-white shadow-lg hover:opacity-90 transition-all"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={() => setIsRejecting(false)}
                    className="p-3 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsRejecting(true)}
                    className="px-8 py-4 rounded-2xl bg-background shadow-neumorphic text-red-600 font-black text-xs uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
                  >
                    Reject Order
                  </button>
                  {canApprove && (
                    <button 
                      onClick={handleApprove}
                      className="px-10 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Check size={18} />
                      Approve Order
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isPINModalOpen && (
        <ManagerPINModal 
          onSuccess={onPINSuccess}
          onClose={() => setIsPINModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PODetailModal;

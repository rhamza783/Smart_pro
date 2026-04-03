import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wallet, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Printer
} from 'lucide-react';
import { AdvancePayment } from '../../types';
import { useAdvancePaymentStore } from '../../store/advancePaymentStore';
import { useClientStore } from '../../store/clientStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../utils/reportUtils';
import { printAdvanceReceipt, printRefundReceipt } from '../../utils/printUtils';
import { format } from 'date-fns';
import ManagerPINModal from './ManagerPINModal';
import { toast } from 'sonner';

interface AdvanceDetailModalProps {
  advance: AdvancePayment;
  onClose: () => void;
}

export const AdvanceDetailModal: React.FC<AdvanceDetailModalProps> = ({ advance, onClose }) => {
  const { refundAdvance } = useAdvancePaymentStore();
  const { addLedgerEntry } = useClientStore();
  const { propertySettings } = useSettingsStore();
  const [showPINModal, setShowPINModal] = useState(false);
  const [showRefundReason, setShowRefundReason] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const handleRefund = () => {
    if (!refundReason) {
      toast.error('Please provide a refund reason');
      return;
    }

    refundAdvance(advance.id, refundReason);
    
    if (advance.clientId) {
      addLedgerEntry(advance.clientId, {
        type: 'adjustment',
        credit: -advance.amount,
        debit: 0,
        description: `Advance Refunded — ${refundReason}`,
        orderId: advance.id
      });
    }

    toast.success(`Advance of ${formatCurrency(advance.amount)} refunded`);
    
    // Print refund receipt
    printRefundReceipt({
      ...advance,
      status: 'refunded',
      refundedAt: Date.now(),
      refundReason
    }, propertySettings);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#E0E5EC] rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">{advance.id}</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Advance Payment Details</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              advance.status === 'active' ? 'bg-green-100 text-green-600' :
              advance.status === 'consumed' ? 'bg-blue-100 text-blue-600' :
              advance.status === 'refunded' ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {advance.status}
            </span>
            <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
              <X className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
          {/* Client Card */}
          <div className="bg-white p-6 rounded-[32px] shadow-neumorphic flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-black text-xl">
                {advance.clientName.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-gray-900 uppercase">{advance.clientName}</p>
                <p className="text-sm font-bold text-gray-500">{advance.clientPhone}</p>
              </div>
            </div>
            {advance.clientId && (
              <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-purple-600 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-neumorphic">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</p>
              <p className="text-sm font-black text-gray-900 uppercase">{advance.type}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-neumorphic">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Method</p>
              <p className="text-sm font-black text-gray-900 uppercase">{advance.paymentMethod}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-neumorphic col-span-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-2xl font-black text-purple-600 tracking-tighter">{formatCurrency(advance.amount)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-neumorphic col-span-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference Note</p>
              <p className="text-sm font-bold text-gray-700">{advance.referenceNote || 'No reference provided'}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">History</h3>
            <div className="bg-white p-6 rounded-[32px] shadow-neumorphic space-y-6 relative">
              <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-gray-100" />
              
              <div className="flex items-start gap-4 relative">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Advance Recorded</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{format(advance.createdAt, 'MMM d, yyyy h:mm a')} • {advance.createdBy}</p>
                </div>
              </div>

              {advance.status === 'consumed' && (
                <div className="flex items-start gap-4 relative">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Consumed</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{format(advance.consumedAt || 0, 'MMM d, yyyy h:mm a')}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Order #{advance.consumedOrderId}</p>
                  </div>
                </div>
              )}

              {advance.status === 'refunded' && (
                <div className="flex items-start gap-4 relative">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center z-10">
                    <RefreshCw className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Refunded</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{format(advance.refundedAt || 0, 'MMM d, yyyy h:mm a')}</p>
                    <p className="text-[10px] font-black text-orange-600 uppercase mt-1">Reason: {advance.refundReason}</p>
                  </div>
                </div>
              )}

              {advance.expiryDate && (
                <div className="flex items-start gap-4 relative">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-10">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Expiry Date</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{format(new Date(advance.expiryDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-black/5 flex gap-4">
          <button 
            onClick={() => printAdvanceReceipt(advance, propertySettings)}
            className="p-4 bg-white text-gray-600 rounded-2xl font-black uppercase tracking-widest shadow-neumorphic hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
          </button>
          {advance.status === 'active' && (
            <>
              <button 
                onClick={() => setShowPINModal(true)}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refund Advance
              </button>
            </>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest shadow-sm hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Refund Flow */}
      <AnimatePresence>
        {showPINModal && (
          <ManagerPINModal 
            onApprove={() => {
              setShowPINModal(false);
              setShowRefundReason(true);
            }}
            onClose={() => setShowPINModal(false)}
          />
        )}
        {showRefundReason && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md"
            >
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Refund Reason</h3>
              <div className="space-y-4 mb-8">
                <select 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-[#F0F2F5] border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-neumorphic-inset"
                >
                  <option value="">Select a reason...</option>
                  <option value="Customer cancelled">Customer cancelled</option>
                  <option value="Event cancelled">Event cancelled</option>
                  <option value="Partial refund">Partial refund</option>
                  <option value="Other">Other</option>
                </select>
                <textarea 
                  placeholder="Additional notes..."
                  className="w-full bg-[#F0F2F5] border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-neumorphic-inset h-32"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleRefund}
                  className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all"
                >
                  Confirm Refund
                </button>
                <button 
                  onClick={() => setShowRefundReason(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

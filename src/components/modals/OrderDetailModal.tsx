import React from 'react';
import { X, Printer, CheckCircle2, User, Clock, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryOrder } from '../../types';

interface OrderDetailModalProps {
  order: HistoryOrder;
  onClose: () => void;
  onReprint: () => void;
  onReprintKOT: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onReprint, onReprintKOT }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-300/30 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-primary">Order #{order.id}</h3>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={14} />
                Completed
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Order Meta */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <MapPin size={18} className="text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider">Table / Zone</p>
                    <p className="text-sm font-bold text-text-primary">{order.table}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Clock size={18} className="text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider">Opened / Closed</p>
                    <p className="text-sm font-bold text-text-primary">
                      {formatDate(order.startTime)} - {formatDate(order.closedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <User size={18} className="text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider">Waiter / Cashier</p>
                    <p className="text-sm font-bold text-text-primary">
                      {order.waiter} / {order.cashier || 'System'}
                    </p>
                  </div>
                </div>
                {order.customer?.name && (
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Phone size={18} className="text-primary" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider">Customer</p>
                      <p className="text-sm font-bold text-text-primary">
                        {order.customer.name} ({order.customer.phone})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-2xl bg-background shadow-neumorphic-inset overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300/30">
                  {order.items.map((item, idx) => {
                    const isDeal = (item as any).type === 'deal';
                    const dealChildren = (item as any).children || [];

                    return (
                      <React.Fragment key={idx}>
                        <tr>
                          <td className={`px-4 py-3 font-bold ${isDeal ? 'text-purple-600 italic' : 'text-text-primary'}`}>
                            {isDeal && <span className="mr-1">🔥</span>}
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{item.qty}</td>
                          <td className="px-4 py-3 text-right text-text-secondary">{isDeal ? '-' : item.price}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary">{item.total}</td>
                        </tr>
                        {isDeal && dealChildren.map((child: any, cIdx: number) => (
                          <tr key={`${idx}-child-${cIdx}`} className="bg-purple-50/30">
                            <td className="px-4 py-1 pl-8 text-xs text-purple-600 italic">
                              ↳ {child.name}
                            </td>
                            <td className="px-4 py-1 text-center text-xs text-purple-600 font-medium">x{child.qty}</td>
                            <td className="px-4 py-1 text-right text-xs text-purple-600">-</td>
                            <td className="px-4 py-1 text-right text-xs text-purple-600">-</td>
                          </tr>
                        ))}
                        {item.modifiers?.map((mod, mIdx) => (
                        <tr key={`${idx}-${mIdx}`} className="bg-gray-50/50">
                          <td className="px-4 py-1 pl-8 text-xs text-text-secondary italic">
                            ▸ {mod.optionName}
                          </td>
                          <td className="px-4 py-1 text-center text-xs text-text-secondary">{mod.qty}</td>
                          <td className="px-4 py-1 text-right text-xs text-text-secondary">{mod.price}</td>
                          <td className="px-4 py-1 text-right text-xs text-text-secondary">{mod.price * mod.qty}</td>
                        </tr>
                      ))}
                      {item.itemNote && (
                        <tr>
                          <td colSpan={4} className="px-4 py-1 pl-8 text-xs text-text-secondary italic opacity-60">
                            Note: {item.itemNote}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-bold">{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                    <span>Discount ({order.discType === 'percent' ? `${order.discount}%` : 'Fixed'})</span>
                    <span className="font-bold">-{order.discountVal}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-primary pt-2 border-t border-gray-300/30">
                  <span>Grand Total</span>
                  <span>PKR {order.total}</span>
                </div>
                
                {/* Payments */}
                <div className="pt-4 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Payment Breakdown</p>
                  {order.payments?.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-text-primary">
                      <span>{p.method}</span>
                      <span>{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50/50 border-t border-gray-300/30 flex gap-4">
            <button 
              onClick={onReprint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Printer size={18} />
              <span>Reprint Bill</span>
            </button>
            <button 
              onClick={onReprintKOT}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Printer size={18} />
              <span>Reprint KOT</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-background text-text-secondary font-bold shadow-neumorphic hover:text-primary active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderDetailModal;

import React, { useState, useEffect } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useAuthStore } from '../store/authStore';
import { useReconciliationStore } from '../store/reconciliationStore';
import { Calculator, Lock, CheckCircle, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { backupSystem } from '../utils/backupUtils';
import { usePrompt } from '../hooks/usePrompt';

interface CashierBreakdown {
  name: string;
  cash: number;
  udhaar: number;
  account: number;
  advance: number;
  total: number;
  orders: number;
}

const DayEndPage: React.FC = () => {
  const { history } = useHistoryStore();
  const { currentUser } = useAuthStore();
  const { currentShiftStart, getShiftOrders, calcExpectedCash, saveZReading, startNewShift } = useReconciliationStore();
  const { askPrice } = usePrompt();
  
  const [phase, setPhase] = useState<'summary' | 'blind_count' | 'final'>('summary');
  const [countedCash, setCountedCash] = useState<number>(0);
  const [revealSystem, setRevealSystem] = useState(false);
  const [notes, setNotes] = useState('');
  const [expandedCashier, setExpandedCashier] = useState<string | null>(null);

  const shiftOrders = getShiftOrders(history);
  const expectedCash = calcExpectedCash(shiftOrders);

  const summary = {
    totalOrders: shiftOrders.length,
    grossRevenue: shiftOrders.reduce((acc, o) => acc + o.subtotal, 0),
    totalDiscounts: shiftOrders.reduce((acc, o) => acc + o.discountVal, 0),
    netRevenue: shiftOrders.reduce((acc, o) => acc + o.total, 0),
    paymentBreakdown: {} as Record<string, number>,
    cashierBreakdown: {} as Record<string, CashierBreakdown>,
    topItems: [] as { name: string, qty: number }[]
  };

  shiftOrders.forEach(o => {
    o.payments?.forEach(p => {
      summary.paymentBreakdown[p.method] = (summary.paymentBreakdown[p.method] || 0) + p.amount;
    });

    const cashierId = o.cashier || 'unknown';
    if (!summary.cashierBreakdown[cashierId]) {
      summary.cashierBreakdown[cashierId] = {
        name: o.cashier,
        cash: 0,
        udhaar: 0,
        account: 0,
        advance: 0,
        total: 0,
        orders: 0
      };
    }
    const cb = summary.cashierBreakdown[cashierId];
    cb.total += o.total;
    cb.orders += 1;
    o.payments?.forEach(p => {
      if (p.method === 'Cash') cb.cash += p.amount;
      else if (p.method === 'Udhaar') cb.udhaar += p.amount;
      else if (p.method === 'Account') cb.account += p.amount;
      else if (p.method === 'Advance') cb.advance += p.amount;
    });

    o.items.forEach(item => {
      const existing = summary.topItems.find(ti => ti.name === item.name);
      if (existing) existing.qty += item.qty;
      else summary.topItems.push({ name: item.name, qty: item.qty });
    });
  });

  summary.topItems.sort((a, b) => b.qty - a.qty);
  const top10 = summary.topItems.slice(0, 10);

  const handleSaveZReading = () => {
    saveZReading({
      id: `Z-${Date.now()}`,
      shiftStart: currentShiftStart,
      shiftEnd: Date.now(),
      cashier: currentUser?.name || 'System',
      expectedCash,
      countedCash,
      difference: countedCash - expectedCash,
      totalOrders: summary.totalOrders,
      grossRevenue: summary.grossRevenue,
      netRevenue: summary.netRevenue,
      totalDiscounts: summary.totalDiscounts,
      paymentBreakdown: summary.paymentBreakdown,
      notes,
      createdAt: Date.now()
    });
    setPhase('final');
  };

  const handleCloseShift = () => {
    startNewShift();
    window.location.reload(); // Refresh to reset all states
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calculator className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Day End Reconciliation</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11">
            Shift started: {new Date(currentShiftStart).toLocaleString()}
          </p>
        </div>

        {phase === 'summary' && (
          <div className="flex gap-4">
            <button
              onClick={() => setPhase('blind_count')}
              className="px-6 py-3 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-orange-600 font-bold hover:shadow-inner transition-shadow flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Start Z-Reading
            </button>
            <button
              onClick={handleCloseShift}
              className="px-6 py-3 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-red-600 font-bold hover:shadow-inner transition-shadow flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Close Shift
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Revenue Summary */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Orders', value: summary.totalOrders, color: 'text-purple-600' },
                  { label: 'Gross Revenue', value: `PKR ${summary.grossRevenue.toLocaleString()}`, color: 'text-gray-800' },
                  { label: 'Discounts', value: `PKR ${summary.totalDiscounts.toLocaleString()}`, color: 'text-red-500' },
                  { label: 'Net Revenue', value: `PKR ${summary.netRevenue.toLocaleString()}`, color: 'text-green-600' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#E0E5EC] shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Payment Breakdown */}
              <div className="p-8 rounded-3xl bg-[#E0E5EC] shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff]">
                <h3 className="text-lg font-bold text-gray-700 mb-6">Payment Method Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-200">
                        <th className="pb-4">Cashier</th>
                        <th className="pb-4">Orders</th>
                        <th className="pb-4">Cash</th>
                        <th className="pb-4">Udhaar</th>
                        <th className="pb-4">Account</th>
                        <th className="pb-4">Advance</th>
                        <th className="pb-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(Object.values(summary.cashierBreakdown) as CashierBreakdown[]).map((cb, i) => (
                        <tr key={i} className="text-sm font-bold text-gray-700">
                          <td className="py-4">{cb.name}</td>
                          <td className="py-4">{cb.orders}</td>
                          <td className="py-4">PKR {cb.cash.toLocaleString()}</td>
                          <td className="py-4">PKR {cb.udhaar.toLocaleString()}</td>
                          <td className="py-4">PKR {cb.account.toLocaleString()}</td>
                          <td className="py-4">PKR {cb.advance.toLocaleString()}</td>
                          <td className="py-4 text-right text-purple-600">PKR {cb.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-lg font-black text-gray-800 border-t-2 border-gray-200">
                        <td className="pt-4" colSpan={2}>TOTALS</td>
                        <td className="pt-4">PKR {summary.paymentBreakdown['Cash']?.toLocaleString() || 0}</td>
                        <td className="pt-4">PKR {summary.paymentBreakdown['Udhaar']?.toLocaleString() || 0}</td>
                        <td className="pt-4">PKR {summary.paymentBreakdown['Account']?.toLocaleString() || 0}</td>
                        <td className="pt-4">PKR {summary.paymentBreakdown['Advance']?.toLocaleString() || 0}</td>
                        <td className="pt-4 text-right text-green-600">PKR {summary.netRevenue.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="p-8 rounded-3xl bg-[#E0E5EC] shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff]">
              <h3 className="text-lg font-bold text-gray-700 mb-6">Top 10 Items Sold</h3>
              <div className="space-y-4">
                {top10.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-[10px] flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{item.qty} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'blind_count' && (
          <motion.div
            key="blind_count"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-10 rounded-[40px] bg-[#E0E5EC] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Cash Drawer Count</h2>
              <p className="text-gray-500 mb-10">Count your physical cash and enter the total below</p>

              <div className="mb-8">
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-3">Counted cash amount (PKR)</label>
                <div 
                  onClick={async () => {
                    const res = await askPrice('Cash Drawer Count', countedCash);
                    if (res !== null) setCountedCash(res);
                  }}
                  className="w-full bg-[#E0E5EC] rounded-2xl p-6 text-3xl font-black text-center text-purple-600 shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] cursor-pointer hover:shadow-neumorphic-inset transition-all"
                >
                  {countedCash > 0 ? `PKR ${countedCash.toLocaleString()}` : 'Tap to Enter Cash'}
                </div>
              </div>

              {!revealSystem ? (
                <button
                  onClick={() => setRevealSystem(true)}
                  disabled={countedCash === 0}
                  className="w-full py-5 rounded-2xl bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Reveal System Total
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">System Expected</p>
                      <p className="text-2xl font-black text-blue-700">PKR {expectedCash.toLocaleString()}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">Your Count</p>
                      <p className="text-2xl font-black text-purple-700">PKR {countedCash.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl flex items-center justify-center gap-3 ${
                    countedCash === expectedCash ? 'bg-green-100 text-green-700' :
                    countedCash > expectedCash ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {countedCash === expectedCash ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="text-xl font-black uppercase tracking-widest">Balanced ✓</span>
                      </>
                    ) : (
                      <span className="text-xl font-black uppercase tracking-widest">
                        {countedCash > expectedCash ? 'OVER' : 'SHORT'}: PKR {Math.abs(countedCash - expectedCash).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add shift notes here..."
                    className="w-full bg-[#E0E5EC] rounded-2xl p-4 text-gray-700 shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] focus:outline-none min-h-[100px]"
                  />

                  <button
                    onClick={handleSaveZReading}
                    className="w-full py-5 rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Z-Reading
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'final' && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="p-10 rounded-[40px] bg-[#E0E5EC] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Z-Reading Saved</h2>
              <p className="text-gray-500 mb-10">Shift data has been recorded successfully.</p>

              <div className="space-y-4">
                <button
                  onClick={backupSystem}
                  className="w-full py-4 rounded-2xl bg-white text-gray-700 font-bold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-shadow"
                >
                  <Download className="w-5 h-5" />
                  Download System Backup
                </button>
                <button
                  onClick={handleCloseShift}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-colors"
                >
                  Reset Shift Tracking & Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DayEndPage;

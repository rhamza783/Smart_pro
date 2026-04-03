import React, { useState, useMemo } from 'react';
import { History, Search, Download, ChevronDown, ChevronUp, DollarSign, Calendar, User, Clock, FileText } from 'lucide-react';
import { useReconciliationStore } from '../store/reconciliationStore';
import { motion, AnimatePresence } from 'framer-motion';

const ReconciliationHistoryPage: React.FC = () => {
  const { reconciliationHistory } = useReconciliationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return reconciliationHistory;
    return reconciliationHistory.filter(r => 
      r.cashier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reconciliationHistory, searchQuery]);

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Shift Start', 'Shift End', 'Cashier', 'Expected', 'Counted', 'Difference', 'Orders', 'Revenue'];
    const rows = filteredHistory.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleDateString(),
      new Date(r.shiftStart).toLocaleTimeString(),
      new Date(r.shiftEnd).toLocaleTimeString(),
      r.cashier,
      r.expectedCash,
      r.countedCash,
      r.difference,
      r.totalOrders,
      r.netRevenue
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reconciliation_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] p-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
            <History className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Reconciliation History</h1>
            <p className="text-gray-500 text-sm font-medium">View and export past Z-Readings</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search cashier or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500 w-64 text-sm"
            />
          </div>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#E0E5EC] rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                <th className="p-6">Date / Shift</th>
                <th className="p-6">Cashier</th>
                <th className="p-6">Expected</th>
                <th className="p-6">Counted</th>
                <th className="p-6">Difference</th>
                <th className="p-6">Orders</th>
                <th className="p-6 text-right">Revenue</th>
                <th className="p-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((reading) => (
                <React.Fragment key={reading.id}>
                  <tr 
                    className="text-sm font-bold text-gray-700 hover:bg-white/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === reading.id ? null : reading.id)}
                  >
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span>{new Date(reading.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(reading.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(reading.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">{reading.cashier}</td>
                    <td className="p-6 text-blue-600">PKR {reading.expectedCash.toLocaleString()}</td>
                    <td className="p-6 text-purple-600">PKR {reading.countedCash.toLocaleString()}</td>
                    <td className={`p-6 ${reading.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      PKR {reading.difference.toLocaleString()}
                    </td>
                    <td className="p-6">{reading.totalOrders}</td>
                    <td className="p-6 text-right font-black text-gray-800">PKR {reading.netRevenue.toLocaleString()}</td>
                    <td className="p-6">
                      {expandedId === reading.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === reading.id && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/40 p-8 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payment Breakdown</h4>
                                <div className="space-y-2">
                                  {Object.entries(reading.paymentBreakdown).map(([method, amount]) => (
                                    <div key={method} className="flex justify-between text-sm">
                                      <span className="text-gray-500">{method}</span>
                                      <span className="font-bold text-gray-700">PKR {amount.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Shift Summary</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Gross Revenue</span>
                                    <span className="font-bold text-gray-700">PKR {reading.grossRevenue.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Discounts</span>
                                    <span className="font-bold text-red-600">PKR {reading.totalDiscounts.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-gray-800 font-black">Net Revenue</span>
                                    <span className="font-black text-purple-600">PKR {reading.netRevenue.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Notes</h4>
                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                  {reading.notes || 'No notes provided for this shift.'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium italic">
                    No reconciliation history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationHistoryPage;

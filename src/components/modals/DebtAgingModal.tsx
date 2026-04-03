import React from 'react';
import { X, Download, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';
import { Client } from '../../types';

interface DebtAgingModalProps {
  clients: Client[];
  onClose: () => void;
}

const DebtAgingModal: React.FC<DebtAgingModalProps> = ({ clients, onClose }) => {
  const agingData = clients
    .filter(c => c.balance > 0)
    .map(client => {
      // In a real app, we'd check individual unpaid orders
      // For this demo, we'll simulate aging based on the last order date
      const lastOrderDate = client.lastOrderDate ? new Date(client.lastOrderDate) : new Date();
      const diffDays = Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24));
      
      return {
        ...client,
        days: diffDays,
        category: diffDays <= 30 ? '0-30' : diffDays <= 60 ? '31-60' : diffDays <= 90 ? '61-90' : '90+'
      };
    })
    .sort((a, b) => b.balance - a.balance);

  const totals = {
    '0-30': agingData.filter(d => d.category === '0-30').reduce((sum, d) => sum + d.balance, 0),
    '31-60': agingData.filter(d => d.category === '31-60').reduce((sum, d) => sum + d.balance, 0),
    '61-90': agingData.filter(d => d.category === '61-90').reduce((sum, d) => sum + d.balance, 0),
    '90+': agingData.filter(d => d.category === '90+').reduce((sum, d) => sum + d.balance, 0),
  };

  const totalDebt = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-[#E0E5EC] rounded-[40px] p-8 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-700 uppercase tracking-tight">Debt Aging Report</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Analysis of outstanding balances by duration</p>
          </div>
          <div className="flex gap-4">
            <button className="p-3 bg-white/50 text-purple-600 rounded-2xl shadow-neumorphic hover:bg-white transition-all flex items-center gap-2 text-xs font-bold">
              <Download size={16} /> EXPORT PDF
            </button>
            <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/30 p-4 rounded-3xl shadow-neumorphic-inset text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Debt</p>
            <p className="text-xl font-black text-gray-700">PKR {totalDebt.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-3xl shadow-neumorphic text-center">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">0-30 Days</p>
            <p className="text-xl font-black text-green-700">PKR {totals['0-30'].toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-3xl shadow-neumorphic text-center">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">31-60 Days</p>
            <p className="text-xl font-black text-blue-700">PKR {totals['31-60'].toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-3xl shadow-neumorphic text-center">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">61-90 Days</p>
            <p className="text-xl font-black text-orange-700">PKR {totals['61-90'].toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-3xl shadow-neumorphic text-center">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">90+ Days</p>
            <p className="text-xl font-black text-red-700">PKR {totals['90+'].toLocaleString()}</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead className="sticky top-0 bg-[#E0E5EC] z-10">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-2">Client Name</th>
                <th className="px-6 py-2">Total Balance</th>
                <th className="px-6 py-2">Last Activity</th>
                <th className="px-6 py-2">Aging Category</th>
                <th className="px-6 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {agingData.map((client) => (
                <tr key={client.id} className="bg-white/40 hover:bg-white/60 transition-all rounded-3xl shadow-sm">
                  <td className="px-6 py-4 rounded-l-3xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-700">{client.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{client.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-700">PKR {client.balance.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Clock size={14} />
                      {client.days} days ago
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest
                      ${client.category === '0-30' ? 'bg-green-100 text-green-600' : 
                        client.category === '31-60' ? 'bg-blue-100 text-blue-600' : 
                        client.category === '61-90' ? 'bg-orange-100 text-orange-600' : 
                        'bg-red-100 text-red-600'}
                    `}>
                      {client.category} DAYS
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right rounded-r-3xl">
                    <button className="text-purple-600 hover:text-purple-800 font-black text-[10px] uppercase tracking-widest">
                      SEND REMINDER
                    </button>
                  </td>
                </tr>
              ))}
              {agingData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-400">
                      <CheckCircle2 size={48} className="text-green-400" />
                      <p className="font-black uppercase tracking-widest">No outstanding debts found!</p>
                    </div>
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

export default DebtAgingModal;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  PlusCircle, 
  Search, 
  Filter, 
  X, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  Eye, 
  Printer, 
  Trash2, 
  Calendar,
  ChevronRight,
  User,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAdvancePaymentStore } from '../store/advancePaymentStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency } from '../utils/reportUtils';
import { printAdvanceReceipt } from '../utils/printUtils';
import { format } from 'date-fns';
import { AdvancePayment } from '../types';
import { NewAdvanceModal } from '../components/modals/NewAdvanceModal';
import { AdvanceDetailModal } from '../components/modals/AdvanceDetailModal';
import { useCartStore } from '../store/cartStore';
import { toast } from 'sonner';

const AdvancePaymentPage: React.FC = () => {
  const { advances, searchAdvances, getSummary } = useAdvancePaymentStore();
  const { propertySettings } = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'consumed' | 'refunded' | 'expired'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'reservation' | 'catering' | 'general'>('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvancePayment | null>(null);

  const summary = getSummary();

  const filteredAdvances = useMemo(() => {
    let result = searchTerm ? searchAdvances(searchTerm) : advances;

    if (statusFilter !== 'All') {
      result = result.filter(adv => adv.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      result = result.filter(adv => adv.type === typeFilter);
    }

    return result.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.createdAt - a.createdAt;
    });
  }, [advances, searchTerm, statusFilter, typeFilter, searchAdvances]);

  const stats = [
    { 
      label: 'Total Active Deposits', 
      value: formatCurrency(summary.totalActive), 
      count: summary.activeCount,
      icon: Wallet, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      label: 'Consumed Today', 
      value: formatCurrency(summary.totalConsumed), 
      count: advances.filter(a => a.status === 'consumed' && format(a.consumedAt || 0, 'yyyy-MM-dd') === format(Date.now(), 'yyyy-MM-dd')).length,
      icon: CheckCircle, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      label: 'Refunded Total', 
      value: formatCurrency(summary.totalRefunded), 
      count: advances.filter(a => a.status === 'refunded').length,
      icon: RefreshCw, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100' 
    },
    { 
      label: 'Expiring Soon', 
      value: advances.filter(a => a.status === 'active' && a.expiryDate && new Date(a.expiryDate).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000).length.toString(), 
      count: 0,
      icon: Clock, 
      color: 'text-red-600', 
      bg: 'bg-red-100' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#E0E5EC] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-neumorphic flex items-center justify-center">
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Advance Payments</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Track deposits and prepayments</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            New Advance
          </button>
          <button className="px-6 py-3 bg-white text-gray-600 rounded-2xl font-black uppercase tracking-widest shadow-neumorphic hover:shadow-neumorphic-inset transition-all">
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] shadow-neumorphic">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[40px] shadow-neumorphic mb-8">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by client name, phone, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F0F2F5] border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            {['All', 'active', 'consumed', 'refunded', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-[#F0F2F5] text-gray-500 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {['All', 'reservation', 'catering', 'general'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  typeFilter === type 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-[#F0F2F5] text-gray-500 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setTypeFilter('All');
            }}
            className="text-xs font-black text-purple-600 uppercase tracking-widest hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] shadow-neumorphic overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAdvances.map((adv) => (
              <tr 
                key={adv.id} 
                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedAdvance(adv)}
              >
                <td className="p-6">
                  <span className="font-mono text-xs text-gray-400">{adv.id}</span>
                </td>
                <td className="p-6">
                  <p className="font-black text-gray-900 uppercase">{adv.clientName}</p>
                  <p className="text-xs font-bold text-gray-500">{adv.clientPhone}</p>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    adv.type === 'reservation' ? 'bg-blue-100 text-blue-600' :
                    adv.type === 'catering' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {adv.type}
                  </span>
                </td>
                <td className="p-6">
                  <span className="text-lg font-black text-purple-600 tracking-tighter">
                    {formatCurrency(adv.amount)}
                  </span>
                </td>
                <td className="p-6">
                  <span className="text-xs font-bold text-gray-500 uppercase">{adv.paymentMethod}</span>
                </td>
                <td className="p-6">
                  <p className="text-xs font-black text-gray-900">{format(adv.createdAt, 'MMM d, h:mm a')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{adv.createdBy}</p>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    adv.status === 'active' ? 'bg-green-100 text-green-600' :
                    adv.status === 'consumed' ? 'bg-blue-100 text-blue-600' :
                    adv.status === 'refunded' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {adv.status}
                  </span>
                </td>
                <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedAdvance(adv)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => printAdvanceReceipt(adv, propertySettings)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAdvances.length === 0 && (
              <tr>
                <td colSpan={8} className="p-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-black text-gray-400 uppercase tracking-widest">No advance payments found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isNewModalOpen && (
          <NewAdvanceModal onClose={() => setIsNewModalOpen(false)} />
        )}
        {selectedAdvance && (
          <AdvanceDetailModal 
            advance={selectedAdvance} 
            onClose={() => setSelectedAdvance(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancePaymentPage;

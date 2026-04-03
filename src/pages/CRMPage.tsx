import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Ban, 
  CheckCircle, 
  Star, 
  ChevronRight, 
  History, 
  Info, 
  StickyNote, 
  Download,
  ShoppingBag,
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  X,
  ShieldAlert,
  MessageSquare,
  Clock,
  Calendar,
  Cake,
  Heart,
  Wallet,
  PlusCircle,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientStore } from '../store/clientStore';
import { useHistoryStore } from '../store/historyStore';
import { useAdvancePaymentStore } from '../store/advancePaymentStore';
import { useSettingsStore } from '../store/settingsStore';
import { usePrompt } from '../hooks/usePrompt';
import { Client, LedgerEntry, Order, CommunicationEntry, AdvancePayment } from '../types';
import { formatCurrency } from '../utils/reportUtils';
import { usePrinter } from '../context/PrinterContext';
import PermissionGuard from '../components/ui/PermissionGuard';
import AddClientModal from '../components/modals/AddClientModal';
import RecordPaymentModal from '../components/modals/RecordPaymentModal';
import { NewAdvanceModal } from '../components/modals/NewAdvanceModal';
import OrderDetailModal from '../components/modals/OrderDetailModal';
import DebtAgingModal from '../components/modals/DebtAgingModal';
import { AdvanceDetailModal } from '../components/modals/AdvanceDetailModal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import HighlightText from '../components/ui/HighlightText';
import { fuzzySearch } from '../utils/autocompleteEngine';
import { toast } from 'sonner';

const CRMPage: React.FC = () => {
  const { 
    clients, 
    selectedClient, 
    setSelectedClient, 
    updateClient, 
    deleteClient, 
    recordPayment, 
    blockClient, 
    unblockClient,
    redeemPoints,
    getClientTier,
    logCommunication,
    loyaltySettings
  } = useClientStore();
  const { history } = useHistoryStore();
  const { advances } = useAdvancePaymentStore();
  const { askConfirm, askText, askQty } = usePrompt();
  const { printAdvanceReceipt } = usePrinter();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Has Balance' | 'Blocked' | 'VIP' | 'Inactive' | 'High Debt'>('All');
  const [sortBy, setSortBy] = useState<'Name' | 'Balance' | 'Date Added' | 'Total Orders'>('Name');
  const [activeTab, setActiveTab] = useState<'Ledger' | 'Orders' | 'Advances' | 'Communications' | 'Notes' | 'Info'>('Ledger');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showDebtAgingModal, setShowDebtAgingModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingAdvance, setViewingAdvance] = useState<AdvancePayment | null>(null);
  const [commType, setCommType] = useState<CommunicationEntry['type']>('call');
  const [commNote, setCommNote] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fuzzySearch(searchTerm, clients, ['name', 'phone', 'company', 'email'], { maxResults: 50 });
  }, [searchTerm, clients]);

  // Stats
  const stats = useMemo(() => {
    const totalOutstanding = clients.reduce((acc, c) => acc + (c.totalOrdered - c.totalPaid), 0);
    const collectedToday = clients.reduce((acc, c) => {
      const todayPayments = c.ledger
        .filter(l => l.type === 'payment' && new Date(l.date).toDateString() === new Date().toDateString())
        .reduce((sum, l) => sum + l.credit, 0);
      return acc + todayPayments;
    }, 0);
    return {
      totalClients: clients.length,
      totalOutstanding,
      collectedToday
    };
  }, [clients]);

  // Filtered and Sorted Clients
  const filteredClients = useMemo(() => {
    let result = searchTerm.trim() === '' 
      ? [...clients]
      : searchResults.map(r => r.item);

    if (filter === 'Has Balance') result = result.filter(c => (c.totalOrdered - c.totalPaid) > 0);
    if (filter === 'Blocked') result = result.filter(c => c.isBlocked);
    if (filter === 'VIP') result = result.filter(c => c.loyaltyPoints > 1000);
    if (filter === 'Inactive') {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      result = result.filter(c => !c.lastOrderDate || new Date(c.lastOrderDate).getTime() < thirtyDaysAgo);
    }
    if (filter === 'High Debt') result = result.filter(c => (c.totalOrdered - c.totalPaid) > 5000);

    result.sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Balance') return (b.totalOrdered - b.totalPaid) - (a.totalOrdered - a.totalPaid);
      if (sortBy === 'Date Added') return b.createdAt - a.createdAt;
      if (sortBy === 'Total Orders') return b.totalOrdered - a.totalOrdered;
      return 0;
    });

    return result;
  }, [clients, searchTerm, searchResults, filter, sortBy]);

  const renderClientSearchItem = (client: Client, query: string, highlightRanges: [number, number][]) => {
    const balance = client.totalOrdered - client.totalPaid;
    return (
      <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-500 font-bold">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-700">
              <HighlightText text={client.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-xs text-gray-400">
              <HighlightText text={client.phone} query={query} highlightRanges={highlightRanges} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {balance > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
              PKR {balance}
            </span>
          )}
          {client.isBlocked && (
            <span className="text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
              <ShieldAlert size={8} />
            </span>
          )}
        </div>
      </div>
    );
  };

  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return history.filter(o => o.customerId === selectedClient.id || o.customerPhone === selectedClient.phone);
  }, [selectedClient, history]);

  const clientAdvances = useMemo(() => {
    if (!selectedClient) return [];
    return advances.filter(a => a.clientId === selectedClient.id || a.clientPhone === selectedClient.phone);
  }, [selectedClient, advances]);

  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleRecordPayment = (amount: number, method: string) => {
    if (!selectedClient) return;
    recordPayment(selectedClient.id, amount, method);
    toast.success(`Payment of ${formatCurrency(amount)} recorded for ${selectedClient.name}`);
  };

  const handleLogCommunication = () => {
    if (!selectedClient || !commNote.trim()) return;
    logCommunication(selectedClient.id, {
      type: commType.toLowerCase() as any,
      summary: commNote.trim(),
      direction: 'outbound',
      createdBy: 'Admin' // Should be current user
    });
    setCommNote('');
    toast.success('Communication logged');
  };

  const currentTier = selectedClient ? getClientTier(selectedClient.loyaltyPoints) : null;
  const nextTier = selectedClient ? loyaltySettings.tiers.find(t => t.minPoints > selectedClient.loyaltyPoints) : null;

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    const confirmed = await askConfirm(
      'Delete Client',
      `Are you sure you want to delete ${selectedClient.name}? This action cannot be undone.`
    );
    if (confirmed) {
      deleteClient(selectedClient.id);
      toast.success('Client deleted successfully');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#E0E5EC] overflow-hidden">
      {/* Left Column - Client List */}
      <aside className="w-full lg:w-[340px] bg-background shadow-neumorphic z-10 flex flex-col">
        <div className="p-6 space-y-6 border-b border-gray-300/30">
          <div className="relative">
            <AutocompleteInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSelect={(client) => {
                setSelectedClient(client);
                setSearchTerm('');
              }}
              items={clients}
              searchFields={['name', 'phone', 'company', 'email']}
              renderItem={renderClientSearchItem}
              placeholder="Search clients..."
              icon={<Search size={18} />}
              maxResults={8}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary z-10">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Has Balance', 'Blocked', 'VIP', 'Inactive', 'High Debt'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === f ? 'bg-primary text-white shadow-lg' : 'bg-background shadow-neumorphic text-text-secondary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-text-secondary">
              <ArrowUpDown size={14} />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                <option value="Name">By Name</option>
                <option value="Balance">By Balance</option>
                <option value="Date Added">By Date Added</option>
                <option value="Total Orders">By Total Orders</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-background shadow-neumorphic-inset text-center">
              <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1">Total</p>
              <p className="text-sm font-black text-primary">{stats.totalClients}</p>
            </div>
            <div className="p-3 rounded-2xl bg-background shadow-neumorphic-inset text-center cursor-pointer hover:bg-red-50 transition-colors" onClick={() => setShowDebtAgingModal(true)}>
              <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1">Debt</p>
              <p className="text-sm font-black text-red-500">{formatCurrency(stats.totalOutstanding).replace('PKR ', '')}</p>
            </div>
            <div className="p-3 rounded-2xl bg-background shadow-neumorphic-inset text-center">
              <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1">Today</p>
              <p className="text-sm font-black text-green-500">{formatCurrency(stats.collectedToday).replace('PKR ', '')}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {filteredClients.map((client) => {
            const balance = client.totalOrdered - client.totalPaid;
            const isVIP = client.loyaltyPoints > 1000;
            return (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`w-full text-left p-4 rounded-2xl transition-all border-l-4 ${
                  selectedClient?.id === client.id 
                    ? 'bg-primary/5 border-primary shadow-neumorphic-inset' 
                    : 'bg-background border-transparent shadow-neumorphic hover:shadow-neumorphic-inset'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg ${getAvatarColor(client.name)}`}>
                    {client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-primary truncate">{client.name}</h3>
                      <span className={`text-xs font-black ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] font-bold text-text-secondary">{client.phone}</p>
                      <div className="flex gap-1">
                        {client.isBlocked && <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-[8px] font-black text-white uppercase">Blocked</span>}
                        {isVIP && <span className="px-1.5 py-0.5 rounded-md bg-yellow-500 text-[8px] font-black text-white uppercase">⭐ VIP</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="py-20 text-center text-text-secondary opacity-50">
              <User size={48} className="mx-auto mb-4" />
              <p className="font-bold">No clients found</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-background border-t border-gray-300/30">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Add New Client</span>
          </button>
        </div>
      </aside>

      {/* Right Column - Client Detail Panel */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedClient ? (
            <motion.div 
              key={selectedClient.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden p-8 space-y-8 no-scrollbar"
            >
              {/* Client Header Card */}
              <div className="bg-background rounded-[32px] p-8 shadow-neumorphic flex flex-col md:flex-row items-center gap-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-xl ${getAvatarColor(selectedClient.name)}`}>
                  {selectedClient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-primary tracking-tight">{selectedClient.name}</h2>
                    {selectedClient.company && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                        <Building size={12} />
                        {selectedClient.company}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-text-secondary font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{selectedClient.phone}</span>
                    </div>
                    {selectedClient.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button 
                    onClick={() => setActiveTab('Info')}
                    className="p-4 rounded-2xl bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                    title="Edit Client"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                  >
                    <Plus size={20} />
                    <span>Payment</span>
                  </button>
                  <button 
                    onClick={() => setShowAdvanceModal(true)}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                  >
                    <Wallet size={20} />
                    <span>Advance</span>
                  </button>
                  <button 
                    onClick={() => selectedClient.isBlocked ? unblockClient(selectedClient.id) : blockClient(selectedClient.id)}
                    className={`p-4 rounded-2xl bg-background shadow-neumorphic transition-all ${selectedClient.isBlocked ? 'text-green-500' : 'text-red-500'}`}
                    title={selectedClient.isBlocked ? 'Unblock Client' : 'Block Client'}
                  >
                    {selectedClient.isBlocked ? <CheckCircle size={20} /> : <Ban size={20} />}
                  </button>
                  <button 
                    onClick={handleDeleteClient}
                    className="p-4 rounded-2xl bg-background shadow-neumorphic text-red-500 hover:shadow-neumorphic-inset transition-all"
                    title="Delete Client"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Financial Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset border-l-4 border-purple-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Total Ordered</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(selectedClient.totalOrdered)}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset border-l-4 border-green-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-2xl font-black text-green-500">{formatCurrency(selectedClient.totalPaid)}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset border-l-4 border-red-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Outstanding Balance</p>
                  <p className="text-2xl font-black text-red-500">{formatCurrency(selectedClient.totalOrdered - selectedClient.totalPaid)}</p>
                </div>
              </div>

              {/* Loyalty Points Card */}
              <div className="bg-background rounded-[32px] p-8 shadow-neumorphic flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-inner">
                    <Star size={32} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Loyalty Points</p>
                    <p className="text-3xl font-black text-primary">{selectedClient.loyaltyPoints.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex-1 max-w-md w-full">
                  <div className="flex justify-between text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currentTier?.badge}</span>
                      <span style={{ color: currentTier?.color }}>{currentTier?.name}</span>
                    </div>
                    {nextTier && (
                      <span>Next: {nextTier.name} ({nextTier.minPoints})</span>
                    )}
                  </div>
                  <div className="h-3 bg-background shadow-neumorphic-inset rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 shadow-lg transition-all duration-1000" 
                      style={{ 
                        width: nextTier 
                          ? `${Math.min(100, (selectedClient.loyaltyPoints / nextTier.minPoints) * 100)}%`
                          : '100%'
                      }}
                    />
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    const points = await askQty('Redeem Points', selectedClient.loyaltyPoints, selectedClient.name);
                    if (points !== null && points > 0) {
                      if (points > selectedClient.loyaltyPoints) {
                        toast.error('Insufficient points');
                      } else {
                        redeemPoints(selectedClient.id, points, 'Manual');
                        toast.success(`Redeemed ${points} points!`);
                      }
                    }
                  }}
                  className="px-8 py-4 rounded-2xl bg-background shadow-neumorphic text-primary font-black uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
                >
                  Redeem Points
                </button>
              </div>

              {/* Tab Row */}
              <div className="flex gap-4 p-2 bg-background rounded-2xl shadow-neumorphic-inset">
                {[
                  { id: 'Ledger', icon: History },
                  { id: 'Orders', icon: ShoppingBag },
                  { id: 'Advances', icon: Wallet },
                  { id: 'Communications', icon: MessageSquare },
                  { id: 'Notes', icon: StickyNote },
                  { id: 'Info', icon: Info }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                      activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-primary'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.id}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === 'Ledger' && (
                  <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-primary uppercase tracking-tight">Account Ledger</h3>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background shadow-neumorphic text-primary text-[10px] font-black uppercase tracking-widest hover:shadow-neumorphic-inset transition-all">
                        <Download size={14} />
                        <span>Export</span>
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                            <th className="pb-4 px-4">Date</th>
                            <th className="pb-4 px-4">Description</th>
                            <th className="pb-4 px-4 text-right">Debit</th>
                            <th className="pb-4 px-4 text-right">Credit</th>
                            <th className="pb-4 px-4 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300/30">
                          {selectedClient.ledger.map((entry) => (
                            <tr 
                              key={entry.id} 
                              className={`group hover:bg-primary/5 transition-all ${entry.orderId ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (entry.orderId) {
                                  const order = history.find(o => o.id === entry.orderId);
                                  if (order) setViewingOrder(order);
                                }
                              }}
                            >
                              <td className="py-4 px-4 text-xs font-bold text-text-secondary">
                                {new Date(entry.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${entry.type === 'order' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                                    {entry.type === 'order' ? <ShoppingBag size={14} /> : <ArrowUpRight size={14} />}
                                  </div>
                                  <span className="text-sm font-black text-primary">{entry.description}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right text-sm font-black text-red-500">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                              </td>
                              <td className="py-4 px-4 text-right text-sm font-black text-green-500">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                              </td>
                              <td className={`py-4 px-4 text-right text-sm font-black ${entry.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {formatCurrency(entry.balance)}
                              </td>
                            </tr>
                          ))}
                          {selectedClient.ledger.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-20 text-center text-text-secondary opacity-50 font-bold">
                                No ledger entries found
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="border-t-2 border-primary/10">
                          <tr className="bg-primary/5 font-black text-primary">
                            <td colSpan={2} className="py-4 px-4 text-xs uppercase tracking-widest">Summary</td>
                            <td className="py-4 px-4 text-right text-sm">{formatCurrency(selectedClient.totalOrdered)}</td>
                            <td className="py-4 px-4 text-right text-sm">{formatCurrency(selectedClient.totalPaid)}</td>
                            <td className={`py-4 px-4 text-right text-sm ${selectedClient.totalOrdered - selectedClient.totalPaid > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {formatCurrency(selectedClient.totalOrdered - selectedClient.totalPaid)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'Orders' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setViewingOrder(order)}
                        className="bg-background p-6 rounded-[32px] shadow-neumorphic text-left hover:shadow-neumorphic-inset transition-all space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Order ID</p>
                            <p className="text-lg font-black text-primary">#{order.id.slice(-6).toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Date</p>
                            <p className="text-xs font-bold text-text-primary">{new Date(order.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 text-text-secondary">
                            <ShoppingBag size={14} />
                            <span className="text-xs font-bold">{order.items.length} Items</span>
                          </div>
                          <p className="text-xl font-black text-primary">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-300/30 flex justify-between items-center">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
                            {order.paymentMethod}
                          </span>
                          <ChevronRight size={16} className="text-text-secondary" />
                        </div>
                      </button>
                    ))}
                    {clientOrders.length === 0 && (
                      <div className="col-span-2 py-20 text-center text-text-secondary opacity-50 bg-background rounded-[32px] shadow-neumorphic-inset">
                        <ShoppingBag size={48} className="mx-auto mb-4" />
                        <p className="font-bold">No orders found for this client</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Advances' && (
                  <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-primary uppercase tracking-tight">Advance Payments</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                            <th className="pb-4 px-4">ID</th>
                            <th className="pb-4 px-4">Type</th>
                            <th className="pb-4 px-4 text-right">Amount</th>
                            <th className="pb-4 px-4">Date</th>
                            <th className="pb-4 px-4 text-right">Status</th>
                            <th className="pb-4 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300/30">
                          {clientAdvances.map((advance) => (
                            <tr key={advance.id} className="group hover:bg-primary/5 transition-all">
                              <td className="py-4 px-4 text-xs font-bold text-text-secondary">
                                #{advance.id.slice(-6).toUpperCase()}
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-black text-primary capitalize">{advance.type}</span>
                              </td>
                              <td className="py-4 px-4 text-right text-sm font-black text-green-500">
                                {formatCurrency(advance.amount)}
                              </td>
                              <td className="py-4 px-4 text-xs font-bold text-text-secondary">
                                {new Date(advance.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                                  advance.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                  advance.status === 'consumed' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                  {advance.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => setViewingAdvance(advance)}
                                    className="p-2 rounded-lg bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                                    title="View Details"
                                  >
                                    <Info size={14} />
                                  </button>
                                  <button 
                                    onClick={() => printAdvanceReceipt(advance)}
                                    className="p-2 rounded-lg bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                                    title="Print Receipt"
                                  >
                                    <Printer size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {clientAdvances.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-20 text-center text-text-secondary opacity-50 font-bold">
                                No advance payments found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'Communications' && (
                  <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-primary uppercase tracking-tight">Communication Log</h3>
                    </div>

                    {/* Log Form */}
                    <div className="bg-white/30 p-6 rounded-3xl shadow-neumorphic-inset space-y-4">
                      <div className="flex gap-4">
                        <select 
                          value={commType}
                          onChange={(e) => setCommType(e.target.value as any)}
                          className="bg-background px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-neumorphic border-none focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="call">Call</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="email">Email</option>
                          <option value="visit">Visit</option>
                        </select>
                        <input 
                          type="text"
                          value={commNote}
                          onChange={(e) => setCommNote(e.target.value)}
                          placeholder="What was discussed?"
                          className="flex-1 bg-background px-4 py-2 rounded-xl text-sm font-bold shadow-neumorphic border-none focus:ring-2 focus:ring-primary outline-none"
                        />
                        <button 
                          onClick={handleLogCommunication}
                          className="px-6 py-2 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                        >
                          Log
                        </button>
                      </div>
                    </div>

                    {/* Log List */}
                    <div className="space-y-4">
                      {selectedClient.communications?.map((comm, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white/30 rounded-2xl shadow-sm">
                          <div className="p-3 bg-background rounded-xl shadow-neumorphic text-primary h-fit">
                            {comm.type === 'call' ? <Phone size={16} /> : 
                             comm.type === 'whatsapp' ? <MessageSquare size={16} /> :
                             comm.type === 'email' ? <Mail size={16} /> : 
                             comm.type === 'sms' ? <Mail size={16} /> : <User size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{comm.type}</span>
                              <span className="text-[10px] font-bold text-gray-400">{new Date(comm.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-700">{comm.summary}</p>
                          </div>
                        </div>
                      ))}
                      {(!selectedClient.communications || selectedClient.communications.length === 0) && (
                        <div className="py-12 text-center text-gray-400 italic">
                          No communications logged yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Notes' && (
                  <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-primary uppercase tracking-tight">Client Notes</h3>
                      <p className="text-[10px] font-bold text-text-secondary italic">Auto-saves on blur</p>
                    </div>
                    <textarea 
                      className="w-full h-[300px] p-6 rounded-3xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary resize-none"
                      placeholder="Enter private notes about this client..."
                      defaultValue={selectedClient.notes}
                      onBlur={(e) => updateClient(selectedClient.id, { notes: e.target.value })}
                    />
                  </div>
                )}

                {activeTab === 'Info' && (
                  <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-8">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">Edit Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="text"
                            defaultValue={selectedClient.name}
                            onBlur={(e) => updateClient(selectedClient.id, { name: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="tel"
                            defaultValue={selectedClient.phone}
                            onBlur={(e) => updateClient(selectedClient.id, { phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="email"
                            defaultValue={selectedClient.email}
                            onBlur={(e) => updateClient(selectedClient.id, { email: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Company</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="text"
                            defaultValue={selectedClient.company}
                            onBlur={(e) => updateClient(selectedClient.id, { company: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="text"
                            defaultValue={selectedClient.address}
                            onBlur={(e) => updateClient(selectedClient.id, { address: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Birthday</label>
                        <div className="relative">
                          <Cake className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="date"
                            defaultValue={selectedClient.birthday}
                            onBlur={(e) => updateClient(selectedClient.id, { birthday: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">Anniversary</label>
                        <div className="relative">
                          <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                          <input 
                            type="date"
                            defaultValue={selectedClient.anniversary}
                            onBlur={(e) => updateClient(selectedClient.id, { anniversary: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background shadow-neumorphic-inset focus:outline-none font-bold text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-30">
              <div className="w-32 h-32 rounded-full bg-background shadow-neumorphic flex items-center justify-center mb-6">
                <User size={64} />
              </div>
              <p className="text-2xl font-black uppercase tracking-tight">Select a client to view details</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} />
      )}
      {showPaymentModal && selectedClient && (
        <RecordPaymentModal 
          client={selectedClient} 
          onConfirm={handleRecordPayment} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}
      {showAdvanceModal && selectedClient && (
        <NewAdvanceModal 
          onClose={() => setShowAdvanceModal(false)}
          prefillClient={{
            id: selectedClient.id,
            name: selectedClient.name,
            phone: selectedClient.phone
          }}
        />
      )}
      {showDebtAgingModal && (
        <DebtAgingModal 
          clients={clients}
          onClose={() => setShowDebtAgingModal(false)}
        />
      )}
      {viewingOrder && (
        <OrderDetailModal 
          order={viewingOrder} 
          onClose={() => setViewingOrder(null)} 
        />
      )}
      {viewingAdvance && (
        <AdvanceDetailModal 
          advance={viewingAdvance} 
          onClose={() => setViewingAdvance(null)} 
        />
      )}
    </div>
  );
};

export default CRMPage;

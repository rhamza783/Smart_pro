import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, TrendingUp, Activity, Archive, 
  Search, X, Calendar, Filter, ChevronLeft, ChevronRight,
  Eye, Printer, Trash2, Download, Trash, AlertTriangle,
  User, CreditCard, Banknote, Wallet, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistoryStore } from '../store/historyStore';
import { useTableStore } from '../store/tableStore';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { HistoryOrder } from '../types';
import PermissionGuard from '../components/ui/PermissionGuard';
import OrderDetailModal from '../components/modals/OrderDetailModal';
import { usePrinter } from '../context/PrinterContext';
import { usePrompt } from '../hooks/usePrompt';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import HighlightText from '../components/ui/HighlightText';

const HistoryPage: React.FC = () => {
  const { history, deleteFromHistory, deleteMultipleFromHistory, wipeHistory } = useHistoryStore();
  const { orders: activeOrders } = useTableStore();
  const { askConfirm } = usePrompt();
  const { printBill, printKOT } = usePrinter();
  
  const {
    searchTerm, setSearchTerm,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    waiterFilter, setWaiterFilter,
    paymentFilter, setPaymentFilter,
    sortColumn, setSortColumn,
    sortDirection, setSortDirection,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    filteredOrders,
    totalCount,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetDates
  } = useHistoryFilters(history);

  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeRange, setWipeRange] = useState({ from: '', to: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = history.filter(o => new Date(o.closedAt).toISOString().split('T')[0] === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const activeCount = Object.keys(activeOrders).length;
    
    return [
      { label: "Today's Orders", value: todayOrders.length, icon: ClipboardList, color: 'text-blue-600' },
      { label: "Today's Revenue", value: `PKR ${todayRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
      { label: "Active Orders", value: activeCount, icon: Activity, color: 'text-orange-600' },
      { label: "Total Closed", value: history.length, icon: Archive, color: 'text-green-600' }
    ];
  }, [history, activeOrders]);

  const waiters = useMemo(() => {
    const uniqueWaiters = Array.from(new Set(history.map(o => o.waiter)));
    return uniqueWaiters.sort();
  }, [history]);

  const paymentMethods = ['Cash', 'Card', 'Udhaar', 'Split'];

  const handleSort = (col: keyof HistoryOrder | 'itemsCount') => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    const confirmed = await askConfirm(
      'Delete Multiple Orders',
      `Are you sure you want to delete ${selectedIds.length} orders? This action cannot be undone.`
    );
    if (confirmed) {
      deleteMultipleFromHistory(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleWipe = () => {
    if (wipeRange.from && wipeRange.to) {
      const from = new Date(wipeRange.from).getTime();
      const to = new Date(wipeRange.to).getTime() + 86399999; // End of day
      wipeHistory(from, to);
      setIsWipeModalOpen(false);
    }
  };

  const wipeCount = useMemo(() => {
    if (!wipeRange.from || !wipeRange.to) return 0;
    const from = new Date(wipeRange.from).getTime();
    const to = new Date(wipeRange.to).getTime() + 86399999;
    return history.filter(o => {
      const time = o.closedAt || o.startTime;
      return time >= from && time <= to;
    }).length;
  }, [history, wipeRange]);

  const exportCSV = () => {
    const headers = ['Order ID', 'Table', 'Date', 'Time', 'Items', 'Waiter', 'Cashier', 'Subtotal', 'Discount', 'Total', 'Payments'];
    const rows = history.map(o => [
      o.id,
      o.table,
      new Date(o.closedAt).toLocaleDateString(),
      new Date(o.closedAt).toLocaleTimeString(),
      o.items.length,
      o.waiter,
      o.cashier || '',
      o.subtotal,
      o.discountVal,
      o.total,
      o.payments?.map(p => `${p.method}:${p.amount}`).join('|') || ''
    ].map(v => `"${v}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `order_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOrderSearchItem = (order: HistoryOrder, query: string, highlightRanges: [number, number][]) => {
    return (
      <div className="p-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-500">
            <Hash size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-700 text-sm">
              Order #<HighlightText text={order.id} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">
              Table: <HighlightText text={order.table} query={query} highlightRanges={highlightRanges} /> • {order.waiter}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-blue-600 text-xs">PKR {order.total.toLocaleString()}</div>
          <div className="text-[8px] font-bold text-gray-400">
            {new Date(order.closedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-[#E0E5EC] p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Order History</h1>
        <div className="flex gap-4">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-primary font-bold transition-all"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
          <PermissionGuard perm="editRoles">
            <button 
              onClick={() => setIsWipeModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-background shadow-neumorphic text-danger hover:shadow-neumorphic-inset font-bold transition-all"
            >
              <Trash size={20} />
              <span>Wipe History</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-background rounded-3xl p-6 shadow-neumorphic flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-background shadow-neumorphic flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-text-primary">{stat.value}</p>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-background rounded-[32px] p-6 shadow-neumorphic space-y-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[300px] space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Search Orders</label>
            <AutocompleteInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSelect={(order) => {
                setSearchTerm(order.id);
                setSelectedOrder(order);
              }}
              items={history}
              searchFields={['id', 'table', 'waiter']}
              renderItem={renderOrderSearchItem}
              placeholder="Order ID, Table, Waiter..."
              icon={<Search size={18} />}
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">From</label>
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3 outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">To</label>
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3 outline-none text-sm"
              />
            </div>
            <button 
              onClick={resetDates}
              className="px-4 py-3 rounded-2xl bg-background shadow-neumorphic text-xs font-bold text-text-secondary hover:text-primary"
            >
              All Time
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Quick Date Filters */}
          <div className="flex gap-2 p-1.5 rounded-2xl bg-background shadow-neumorphic-inset">
            {['Today', 'Yesterday', 'This Week', 'This Month'].map(f => {
              const isActive = false; // Logic for active pill
              return (
                <button 
                  key={f}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="h-8 w-px bg-gray-300/30 mx-2" />

          {/* Dropdowns */}
          <div className="flex gap-4">
            <select 
              value={waiterFilter}
              onChange={(e) => setWaiterFilter(e.target.value)}
              className="bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-xs font-bold text-text-secondary"
            >
              <option value="all">All Waiters</option>
              {waiters.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-xs font-bold text-text-secondary"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-background rounded-[32px] shadow-neumorphic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-gray-300/30">
                <PermissionGuard perm="editRoles">
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      className="w-4 h-4 accent-primary"
                    />
                  </th>
                </PermissionGuard>
                <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">#</th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('id')}
                >
                  Order ID {sortColumn === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('table')}
                >
                  Table {sortColumn === 'table' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('closedAt')}
                >
                  Date & Time {sortColumn === 'closedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('itemsCount')}
                >
                  Items {sortColumn === 'itemsCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('waiter')}
                >
                  Waiter {sortColumn === 'waiter' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Payment</th>
                <th 
                  className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest cursor-pointer hover:text-primary"
                  onClick={() => handleSort('total')}
                >
                  Total {sortColumn === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filteredOrders.map((order, idx) => (
                <tr 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="group hover:bg-primary/5 transition-all cursor-pointer relative"
                >
                  <PermissionGuard perm="editRoles">
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(order.id)}
                        onChange={() => handleSelectOne(order.id)}
                        className="w-4 h-4 accent-primary"
                      />
                    </td>
                  </PermissionGuard>
                  <td className="p-4 text-xs font-bold text-text-secondary">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="p-4 font-mono text-xs text-text-secondary">#{order.id}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-text-primary">{order.table}</span>
                      <span className="w-fit px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-text-secondary">
                        Dine In
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">
                        {new Date(order.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(order.closedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="group/items relative">
                      <span className="text-sm font-bold text-text-secondary">{order.items.length} items</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/items:block z-10 bg-background shadow-2xl rounded-xl p-3 w-48 border border-gray-300/30">
                        <ul className="text-[10px] space-y-1">
                          {order.items.map((it, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{it.qty}x {it.name}</span>
                              <span className="font-bold">{it.total}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                      <User size={14} className="text-primary" />
                      {order.waiter}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {order.payments?.map((p, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.method === 'Cash' ? 'bg-green-100 text-green-600' :
                          p.method === 'Card' ? 'bg-blue-100 text-blue-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {p.method}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-black text-primary">PKR {order.total.toLocaleString()}</td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-xl bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => printBill(order)}
                        className="p-2 rounded-xl bg-background shadow-neumorphic text-blue-600 hover:shadow-neumorphic-inset transition-all"
                      >
                        <Printer size={16} />
                      </button>
                      <PermissionGuard perm="editRoles">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmed = await askConfirm(
                              'Delete Order',
                              'Are you sure you want to delete this order? This action cannot be undone.'
                            );
                            if (confirmed) {
                              deleteFromHistory(order.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-danger hover:shadow-neumorphic-inset transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-300/30 flex justify-between items-center">
          <p className="text-xs font-bold text-text-secondary">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} orders
          </p>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button 
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary disabled:opacity-30 disabled:shadow-none transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button 
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === p ? 'bg-primary text-white shadow-lg' : 'bg-background text-text-secondary shadow-neumorphic'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="flex items-end pb-1 text-text-secondary">...</span>}
              </div>

              <button 
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary disabled:opacity-30 disabled:shadow-none transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-xs font-bold text-text-secondary"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-background shadow-2xl rounded-3xl p-4 flex items-center gap-8 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold text-text-primary">Orders Selected</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleBulkDelete}
                className="px-6 py-2 rounded-xl bg-danger text-white font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Delete Selected
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-6 py-2 rounded-xl bg-background shadow-neumorphic text-text-secondary font-bold hover:text-primary transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReprint={() => printBill(selectedOrder)}
          onReprintKOT={() => printKOT(selectedOrder, true)}
        />
      )}

      {/* Wipe History Modal */}
      <AnimatePresence>
        {isWipeModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background w-full max-w-md rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-danger">Wipe Order History</h3>
                  <p className="text-xs text-text-secondary">This action cannot be undone</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">From Date</label>
                    <input 
                      type="date"
                      value={wipeRange.from}
                      onChange={(e) => setWipeRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">To Date</label>
                    <input 
                      type="date"
                      value={wipeRange.to}
                      onChange={(e) => setWipeRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                    />
                  </div>
                </div>

                {wipeRange.from && wipeRange.to && (
                  <div className="p-4 rounded-2xl bg-danger/5 border border-danger/10">
                    <p className="text-sm font-bold text-danger text-center">
                      This will delete {wipeCount} orders between {wipeRange.from} and {wipeRange.to}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsWipeModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-text-secondary bg-background shadow-neumorphic hover:text-primary transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!wipeRange.from || !wipeRange.to || wipeCount === 0}
                  onClick={handleWipe}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-danger shadow-lg hover:opacity-90 disabled:opacity-30 transition-all"
                >
                  Delete {wipeCount} Orders
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;

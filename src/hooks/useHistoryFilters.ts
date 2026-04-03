import { useState, useMemo } from 'react';
import { HistoryOrder } from '../types';

export const useHistoryFilters = (history: HistoryOrder[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [waiterFilter, setWaiterFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState<keyof HistoryOrder | 'itemsCount'>('closedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const filteredOrders = useMemo(() => {
    return history.filter(order => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        order.table.toLowerCase().includes(searchLower) ||
        order.waiter.toLowerCase().includes(searchLower) ||
        order.cashier?.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower));

      // Date filter
      const orderDate = new Date(order.closedAt || order.startTime).toISOString().split('T')[0];
      const matchesDate = (!dateFrom || orderDate >= dateFrom) && (!dateTo || orderDate <= dateTo);

      // Waiter filter
      const matchesWaiter = waiterFilter === 'all' || order.waiter === waiterFilter;

      // Payment filter
      const matchesPayment = paymentFilter === 'all' || order.payments?.some(p => p.method === paymentFilter);

      return matchesSearch && matchesDate && matchesWaiter && matchesPayment;
    }).sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === 'itemsCount') {
        valA = a.items.length;
        valB = b.items.length;
      } else {
        valA = a[sortColumn];
        valB = b[sortColumn];
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [history, searchTerm, dateFrom, dateTo, waiterFilter, paymentFilter, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const resetDates = () => {
    setDateFrom('');
    setDateTo('');
  };

  return {
    searchTerm, setSearchTerm,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    waiterFilter, setWaiterFilter,
    paymentFilter, setPaymentFilter,
    sortColumn, setSortColumn,
    sortDirection, setSortDirection,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    filteredOrders: paginatedOrders,
    totalCount: filteredOrders.length,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetDates
  };
};

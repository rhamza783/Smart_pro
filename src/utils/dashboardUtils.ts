import { HistoryOrder, MenuItem } from '../types';

export const getTodayOrders = (history: HistoryOrder[]): HistoryOrder[] => {
  const today = new Date().toISOString().split('T')[0];
  return history.filter(o => {
    const orderDate = new Date(o.closedAt || o.startTime).toISOString().split('T')[0];
    return orderDate === today;
  });
};

export const getYesterdayOrders = (history: HistoryOrder[]): HistoryOrder[] => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return history.filter(o => {
    const orderDate = new Date(o.closedAt || o.startTime).toISOString().split('T')[0];
    return orderDate === yesterdayStr;
  });
};

export const getHourlySales = (orders: HistoryOrder[]): { hour: string, revenue: number, count: number }[] => {
  const hourlyData: Record<number, { revenue: number, count: number }> = {};
  
  // Initialize last 12 hours
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(d.getHours() - i);
    hourlyData[d.getHours()] = { revenue: 0, count: 0 };
  }

  orders.forEach(o => {
    const hour = new Date(o.closedAt || o.startTime).getHours();
    if (hourlyData[hour] !== undefined) {
      hourlyData[hour].revenue += o.total;
      hourlyData[hour].count += 1;
    }
  });

  return Object.entries(hourlyData).map(([hour, data]) => {
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return {
      hour: `${displayHour} ${ampm}`,
      revenue: data.revenue,
      count: data.count
    };
  });
};

export const getSalesByCategory = (orders: HistoryOrder[], menuItems: MenuItem[]): { category: string, revenue: number, percentage: number }[] => {
  const categoryRevenue: Record<string, number> = {};
  let totalRevenue = 0;

  orders.forEach(o => {
    o.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.id);
      const category = menuItem?.category || 'Uncategorized';
      categoryRevenue[category] = (categoryRevenue[category] || 0) + item.total;
      totalRevenue += item.total;
    });
  });

  return Object.entries(categoryRevenue).map(([category, revenue]) => ({
    category,
    revenue,
    percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue);
};

export const getTopItems = (orders: HistoryOrder[]): { name: string, qty: number, revenue: number, percentage: number }[] => {
  const itemStats: Record<string, { qty: number, revenue: number }> = {};
  let totalRevenue = 0;

  orders.forEach(o => {
    o.items.forEach(item => {
      if (!itemStats[item.name]) {
        itemStats[item.name] = { qty: 0, revenue: 0 };
      }
      itemStats[item.name].qty += item.qty;
      itemStats[item.name].revenue += item.total;
      totalRevenue += item.total;
    });
  });

  return Object.entries(itemStats).map(([name, stats]) => ({
    name,
    qty: stats.qty,
    revenue: stats.revenue,
    percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
};

export const getSalesByPaymentMethod = (orders: HistoryOrder[]): { method: string, total: number, count: number, percentage: number }[] => {
  const paymentStats: Record<string, { total: number, count: number }> = {};
  let grandTotal = 0;

  orders.forEach(o => {
    o.payments?.forEach(p => {
      if (!paymentStats[p.method]) {
        paymentStats[p.method] = { total: 0, count: 0 };
      }
      paymentStats[p.method].total += p.amount;
      paymentStats[p.method].count += 1;
      grandTotal += p.amount;
    });
  });

  return Object.entries(paymentStats).map(([method, stats]) => ({
    method,
    total: stats.total,
    count: stats.count,
    percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0
  })).sort((a, b) => b.total - a.total);
};

export const getWaiterPerformance = (orders: HistoryOrder[]): { waiter: string, orders: number, revenue: number, avgOrder: number, itemsSold: number }[] => {
  const waiterStats: Record<string, { orders: number, revenue: number, itemsSold: number }> = {};

  orders.forEach(o => {
    if (!waiterStats[o.waiter]) {
      waiterStats[o.waiter] = { orders: 0, revenue: 0, itemsSold: 0 };
    }
    waiterStats[o.waiter].orders += 1;
    waiterStats[o.waiter].revenue += o.total;
    waiterStats[o.waiter].itemsSold += o.items.reduce((sum, i) => sum + i.qty, 0);
  });

  return Object.entries(waiterStats).map(([waiter, stats]) => ({
    waiter,
    orders: stats.orders,
    revenue: stats.revenue,
    avgOrder: stats.orders > 0 ? stats.revenue / stats.orders : 0,
    itemsSold: stats.itemsSold
  })).sort((a, b) => b.revenue - a.revenue);
};

export const getTrend = (todayValue: number, yesterdayValue: number): { percentage: number, isUp: boolean } => {
  if (yesterdayValue === 0) return { percentage: todayValue > 0 ? 100 : 0, isUp: true };
  const diff = todayValue - yesterdayValue;
  const percentage = Math.abs((diff / yesterdayValue) * 100);
  return { percentage, isUp: diff >= 0 };
};

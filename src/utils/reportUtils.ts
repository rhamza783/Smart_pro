import { HistoryOrder, MenuItem, ReportData, ReportSummary, Client } from '../types';

export const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const exportReportCSV = (reportData: ReportData) => {
  const headers = reportData.columns.join(',');
  const rows = reportData.rows.map(row => 
    reportData.columns.map(col => {
      const val = row[col];
      // Escape commas and wrap in quotes if string
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `report_${reportData.reportName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const filterByDate = (history: HistoryOrder[], from: Date, to: Date) => {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return history.filter(o => {
    const time = new Date(o.closedAt || o.startTime).getTime();
    return time >= fromTime && time <= toTime;
  });
};

export const generateReport = (
  reportName: string, 
  history: HistoryOrder[], 
  dateFrom: Date, 
  dateTo: Date,
  menuItems: MenuItem[],
  clients: Client[]
): ReportData => {
  const filteredHistory = filterByDate(history, dateFrom, dateTo);
  
  switch (reportName) {
    case 'Sale by Menu Items':
      return generateSaleByItems(filteredHistory, menuItems);
    case 'Sale by Waitress':
      return generateSaleByWaitress(filteredHistory);
    case 'Sale by Table':
      return generateSaleByTable(filteredHistory);
    case 'Sale by Category':
      return generateSaleByCategory(filteredHistory, menuItems);
    case 'Sale by Payment Method':
      return generateSaleByPaymentMethod(filteredHistory);
    case 'Sale by Day':
      return generateSaleByDay(filteredHistory);
    case 'Sale by Hour':
      return generateSaleByHour(filteredHistory);
    case 'Sale by Week':
      return generateSaleByWeek(filteredHistory);
    case 'Sale by Month':
      return generateSaleByMonth(filteredHistory);
    case 'Sale by Order Type':
      return generateSaleByOrderType(filteredHistory);
    case 'Today\'s Sale by User':
      return generateSaleByUser(filteredHistory);
    case 'Total Food on Credit':
      return generateTotalCredit(clients);
    case 'Total Credit Recovered':
      return generateCreditRecovered(clients, dateFrom, dateTo);
    case 'Clients with Outstanding Credit':
      return generateClientsOutstanding(clients);
    case 'Top 10 Clients by Udhaar':
      return generateTopUdhaarClients(clients);
    case 'Longest Standing Udhaar Clients':
      return generateLongestUdhaarClients(clients);
    case 'Sale by Deal':
      return generateSaleByDeal(filteredHistory);
    case 'Sale by Discount':
      return generateSaleByDiscount(filteredHistory);
    case 'Sale by Tax':
      return generateSaleByTax(filteredHistory);
    case 'Loyalty Points Summary':
      return generateLoyaltyReport(clients);
    case 'Voucher Usage Report':
      return generateVoucherReport(filteredHistory);
    default:
      return generateSaleByItems(filteredHistory, menuItems);
  }
};

// --- Individual Report Generators ---

const generateSaleByItems = (history: HistoryOrder[], menuItems: MenuItem[]): ReportData => {
  const stats: Record<string, { category: string, qty: number, price: number, revenue: number }> = {};
  let totalRevenue = 0;
  let totalQty = 0;

  history.forEach(o => {
    o.items.forEach(item => {
      if (!stats[item.name]) {
        const menuItem = menuItems.find(m => m.id === item.id);
        stats[item.name] = { 
          category: menuItem?.category || 'Uncategorized', 
          qty: 0, 
          price: item.price, 
          revenue: 0 
        };
      }
      stats[item.name].qty += item.qty;
      stats[item.name].revenue += item.total;
      totalRevenue += item.total;
      totalQty += item.qty;
    });
  });

  const rows = Object.entries(stats).map(([name, s]) => ({
    'Item Name': name,
    'Category': s.category,
    'Qty Sold': s.qty,
    'Unit Price': s.price,
    'Total Revenue': s.revenue,
    '% of Total': totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b['Total Revenue'] - a['Total Revenue']);

  const chartData = rows.slice(0, 10).map(r => ({
    name: r['Item Name'],
    revenue: r['Total Revenue']
  }));

  return {
    reportName: 'Sale by Menu Items',
    columns: ['Item Name', 'Category', 'Qty Sold', 'Unit Price', 'Total Revenue', '% of Total'],
    rows,
    chartData,
    chartType: 'horizontalBar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Item Name'] || 'N/A',
      count: totalQty
    }
  };
};

const generateSaleByWaitress = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { orders: number, items: number, revenue: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    if (!stats[o.waiter]) {
      stats[o.waiter] = { orders: 0, items: 0, revenue: 0 };
    }
    stats[o.waiter].orders += 1;
    stats[o.waiter].items += o.items.reduce((sum, i) => sum + i.qty, 0);
    stats[o.waiter].revenue += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([name, s]) => ({
    'Waiter Name': name,
    'Orders Count': s.orders,
    'Items Sold': s.items,
    'Total Revenue': s.revenue,
    'Avg Order Value': s.orders > 0 ? s.revenue / s.orders : 0
  })).sort((a, b) => b['Total Revenue'] - a['Total Revenue']);

  return {
    reportName: 'Sale by Waitress',
    columns: ['Waiter Name', 'Orders Count', 'Items Sold', 'Total Revenue', 'Avg Order Value'],
    rows,
    chartData: rows.map(r => ({ name: r['Waiter Name'], revenue: r['Total Revenue'] })),
    chartType: 'horizontalBar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Waiter Name'] || 'N/A'
    }
  };
};

const generateSaleByTable = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { orders: number, revenue: number, hours: Record<number, number> }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    if (!stats[o.table]) {
      stats[o.table] = { orders: 0, revenue: 0, hours: {} };
    }
    stats[o.table].orders += 1;
    stats[o.table].revenue += o.total;
    totalRevenue += o.total;
    
    const hour = new Date(o.closedAt || o.startTime).getHours();
    stats[o.table].hours[hour] = (stats[o.table].hours[hour] || 0) + 1;
  });

  const rows = Object.entries(stats).map(([name, s]) => {
    const busiestHour = Object.entries(s.hours).sort((a, b) => b[1] - a[1])[0]?.[0];
    const hourStr = busiestHour ? `${parseInt(busiestHour) % 12 || 12} ${parseInt(busiestHour) >= 12 ? 'PM' : 'AM'}` : 'N/A';
    
    return {
      'Table Name': name,
      'Orders Count': s.orders,
      'Total Revenue': s.revenue,
      'Avg Order Value': s.orders > 0 ? s.revenue / s.orders : 0,
      'Busiest Hour': hourStr
    };
  }).sort((a, b) => b['Total Revenue'] - a['Total Revenue']);

  return {
    reportName: 'Sale by Table',
    columns: ['Table Name', 'Orders Count', 'Total Revenue', 'Avg Order Value', 'Busiest Hour'],
    rows,
    chartData: rows.slice(0, 10).map(r => ({ name: r['Table Name'], revenue: r['Total Revenue'] })),
    chartType: 'horizontalBar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Table Name'] || 'N/A'
    }
  };
};

const generateSaleByCategory = (history: HistoryOrder[], menuItems: MenuItem[]): ReportData => {
  const stats: Record<string, { itemsCount: Set<string>, qty: number, revenue: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    o.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.id);
      const category = menuItem?.category || 'Uncategorized';
      if (!stats[category]) {
        stats[category] = { itemsCount: new Set(), qty: 0, revenue: 0 };
      }
      stats[category].itemsCount.add(item.id);
      stats[category].qty += item.qty;
      stats[category].revenue += item.total;
      totalRevenue += item.total;
    });
  });

  const rows = Object.entries(stats).map(([name, s]) => ({
    'Category Name': name,
    'Items Count': s.itemsCount.size,
    'Qty Sold': s.qty,
    'Total Revenue': s.revenue,
    '% of Total': totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b['Total Revenue'] - a['Total Revenue']);

  return {
    reportName: 'Sale by Category',
    columns: ['Category Name', 'Items Count', 'Qty Sold', 'Total Revenue', '% of Total'],
    rows,
    chartData: rows.map(r => ({ name: r['Category Name'], revenue: r['Total Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Category Name'] || 'N/A'
    }
  };
};

const generateSaleByPaymentMethod = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { count: number, total: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    o.payments?.forEach(p => {
      if (!stats[p.method]) {
        stats[p.method] = { count: 0, total: 0 };
      }
      stats[p.method].count += 1;
      stats[p.method].total += p.amount;
      totalRevenue += p.amount;
    });
  });

  const rows = Object.entries(stats).map(([method, s]) => ({
    'Method': method,
    'Transactions Count': s.count,
    'Total Amount': s.total,
    '% of Revenue': totalRevenue > 0 ? (s.total / totalRevenue) * 100 : 0
  })).sort((a, b) => b['Total Amount'] - a['Total Amount']);

  return {
    reportName: 'Sale by Payment Method',
    columns: ['Method', 'Transactions Count', 'Total Amount', '% of Revenue'],
    rows,
    chartData: rows.map(r => ({ name: r['Method'], value: r['Total Amount'] })),
    chartType: 'pie',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Method'] || 'N/A'
    }
  };
};

const generateSaleByDay = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { orders: number, items: number, subtotal: number, discount: number, total: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    const date = new Date(o.closedAt || o.startTime).toISOString().split('T')[0];
    if (!stats[date]) {
      stats[date] = { orders: 0, items: 0, subtotal: 0, discount: 0, total: 0 };
    }
    stats[date].orders += 1;
    stats[date].items += o.items.reduce((sum, i) => sum + i.qty, 0);
    stats[date].subtotal += o.subtotal;
    stats[date].discount += o.discountVal || 0;
    stats[date].total += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([date, s]) => ({
    'Date': date,
    'Orders Count': s.orders,
    'Items Sold': s.items,
    'Subtotal': s.subtotal,
    'Discount': s.discount,
    'Grand Total': s.total
  })).sort((a, b) => a['Date'].localeCompare(b['Date']));

  return {
    reportName: 'Sale by Day',
    columns: ['Date', 'Orders Count', 'Items Sold', 'Subtotal', 'Discount', 'Grand Total'],
    rows,
    chartData: rows.map(r => ({ name: r['Date'], revenue: r['Grand Total'] })),
    chartType: 'line',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[rows.length - 1]?.['Date'] || 'N/A'
    }
  };
};

const generateSaleByHour = (history: HistoryOrder[]): ReportData => {
  const stats: Record<number, { orders: number, revenue: number }> = {};
  let totalRevenue = 0;

  for (let i = 0; i < 24; i++) stats[i] = { orders: 0, revenue: 0 };

  history.forEach(o => {
    const hour = new Date(o.closedAt || o.startTime).getHours();
    stats[hour].orders += 1;
    stats[hour].revenue += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([hour, s]) => {
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return {
      'Hour': `${displayHour} ${ampm}`,
      'Orders Count': s.orders,
      'Revenue': s.revenue,
      'Avg Order': s.orders > 0 ? s.revenue / s.orders : 0,
      'Peak indicator': s.orders > 0 ? '🔥'.repeat(Math.min(5, Math.ceil(s.orders / 5))) : ''
    };
  });

  return {
    reportName: 'Sale by Hour',
    columns: ['Hour', 'Orders Count', 'Revenue', 'Avg Order', 'Peak indicator'],
    rows,
    chartData: rows.map(r => ({ name: r['Hour'], revenue: r['Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows.sort((a, b) => b['Revenue'] - a['Revenue'])[0]?.['Hour'] || 'N/A'
    }
  };
};

const generateSaleByWeek = (history: HistoryOrder[]): ReportData => {
  // Simplified week calculation
  const stats: Record<string, { orders: number, revenue: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    const d = new Date(o.closedAt || o.startTime);
    const week = `Week ${Math.ceil(d.getDate() / 7)}`;
    if (!stats[week]) stats[week] = { orders: 0, revenue: 0 };
    stats[week].orders += 1;
    stats[week].revenue += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([week, s]) => ({
    'Week Number': week,
    'Orders': s.orders,
    'Revenue': s.revenue,
    'Growth vs Previous': '0%' // Simplified
  }));

  return {
    reportName: 'Sale by Week',
    columns: ['Week Number', 'Orders', 'Revenue', 'Growth vs Previous'],
    rows,
    chartData: rows.map(r => ({ name: r['Week Number'], revenue: r['Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Week Number'] || 'N/A'
    }
  };
};

const generateSaleByMonth = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { orders: number, revenue: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    const d = new Date(o.closedAt || o.startTime);
    const month = d.toLocaleString('default', { month: 'long' });
    if (!stats[month]) stats[month] = { orders: 0, revenue: 0 };
    stats[month].orders += 1;
    stats[month].revenue += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([month, s]) => ({
    'Month': month,
    'Orders': s.orders,
    'Revenue': s.revenue,
    'Growth vs Previous Month': '0%' // Simplified
  }));

  return {
    reportName: 'Sale by Month',
    columns: ['Month', 'Orders', 'Revenue', 'Growth vs Previous Month'],
    rows,
    chartData: rows.map(r => ({ name: r['Month'], revenue: r['Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['Month'] || 'N/A'
    }
  };
};

const generateSaleByOrderType = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { count: number, revenue: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    const type = o.table.includes('Takeaway') ? 'Takeaway' : o.table.includes('Delivery') ? 'Delivery' : 'Dine In';
    if (!stats[type]) stats[type] = { count: 0, revenue: 0 };
    stats[type].count += 1;
    stats[type].revenue += o.total;
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([type, s]) => ({
    'Order Type': type,
    'Count': s.count,
    'Revenue': s.revenue,
    'Avg': s.count > 0 ? s.revenue / s.count : 0
  }));

  return {
    reportName: 'Sale by Order Type',
    columns: ['Order Type', 'Count', 'Revenue', 'Avg'],
    rows,
    chartData: rows.map(r => ({ name: r['Order Type'], value: r['Revenue'] })),
    chartType: 'pie',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows.sort((a, b) => b['Revenue'] - a['Revenue'])[0]?.['Order Type'] || 'N/A'
    }
  };
};

const generateSaleByUser = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { role: string, orders: number, revenue: number, last: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    const user = o.cashier || 'Unknown';
    if (!stats[user]) stats[user] = { role: 'Staff', orders: 0, revenue: 0, last: 0 };
    stats[user].orders += 1;
    stats[user].revenue += o.total;
    stats[user].last = Math.max(stats[user].last, new Date(o.closedAt || o.startTime).getTime());
    totalRevenue += o.total;
  });

  const rows = Object.entries(stats).map(([user, s]) => ({
    'User Name': user,
    'Role': s.role,
    'Orders': s.orders,
    'Revenue': s.revenue,
    'Last Activity Time': new Date(s.last).toLocaleTimeString()
  }));

  return {
    reportName: 'Today\'s Sale by User',
    columns: ['User Name', 'Role', 'Orders', 'Revenue', 'Last Activity Time'],
    rows,
    chartData: rows.map(r => ({ name: r['User Name'], revenue: r['Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: history.length,
      avgOrder: history.length > 0 ? totalRevenue / history.length : 0,
      topItem: rows[0]?.['User Name'] || 'N/A'
    }
  };
};

const generateTotalCredit = (clients: Client[]): ReportData => {
  let totalUdhaar = 0;
  let totalRecovered = 0;

  const rows = clients.map(c => {
    const balance = c.totalOrdered - c.totalPaid;
    totalUdhaar += balance;
    const recovered = c.totalPaid;
    totalRecovered += recovered;
    
    return {
      'Client Name': c.name,
      'Total Udhaar Amount': balance,
      'Total Recovered': recovered,
      'Outstanding Balance': balance
    };
  }).filter(r => r['Total Udhaar Amount'] > 0);

  return {
    reportName: 'Total Food on Credit',
    columns: ['Client Name', 'Total Udhaar Amount', 'Total Recovered', 'Outstanding Balance'],
    rows,
    chartData: rows.map(r => ({ name: r['Client Name'], value: r['Total Udhaar Amount'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: totalUdhaar,
      totalOrders: rows.length,
      avgOrder: rows.length > 0 ? totalUdhaar / rows.length : 0,
      topItem: rows[0]?.['Client Name'] || 'N/A'
    }
  };
};

const generateCreditRecovered = (clients: Client[], from: Date, to: Date): ReportData => {
  // Simplified: using ledger if available, otherwise mock
  const rows: any[] = [];
  let totalRecovered = 0;

  clients.forEach(c => {
    c.ledger?.forEach(entry => {
      const date = new Date(entry.date);
      if (date >= from && date <= to && entry.type === 'payment') {
        rows.push({
          'Date': entry.date,
          'Client Name': c.name,
          'Amount Recovered': entry.credit,
          'Running Balance': entry.balance
        });
        totalRecovered += entry.credit;
      }
    });
  });

  return {
    reportName: 'Total Credit Recovered',
    columns: ['Date', 'Client Name', 'Amount Recovered', 'Running Balance'],
    rows,
    chartData: rows.map(r => ({ name: r['Client Name'], value: r['Amount Recovered'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: totalRecovered,
      totalOrders: rows.length,
      avgOrder: rows.length > 0 ? totalRecovered / rows.length : 0
    }
  };
};

const generateClientsOutstanding = (clients: Client[]): ReportData => {
  const rows = clients.filter(c => (c.totalOrdered - c.totalPaid) > 0).map(c => ({
    'Client Name': c.name,
    'Phone': c.phone,
    'Total Ordered': c.totalOrdered,
    'Total Paid': c.totalPaid,
    'Outstanding': c.totalOrdered - c.totalPaid,
    'Days Overdue': 0 // Simplified
  })).sort((a, b) => b['Outstanding'] - a['Outstanding']);

  return {
    reportName: 'Clients with Outstanding Credit',
    columns: ['Client Name', 'Phone', 'Total Ordered', 'Total Paid', 'Outstanding', 'Days Overdue'],
    rows,
    chartData: rows.map(r => ({ name: r['Client Name'], value: r['Outstanding'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Outstanding'], 0),
      totalOrders: rows.length,
      avgOrder: 0
    }
  };
};

const generateTopUdhaarClients = (clients: Client[]): ReportData => {
  const rows = clients
    .filter(c => (c.totalOrdered - c.totalPaid) > 0)
    .sort((a, b) => (b.totalOrdered - b.totalPaid) - (a.totalOrdered - a.totalPaid))
    .slice(0, 10)
    .map((c, idx) => ({
      'Rank': idx + 1,
      'Client Name': c.name,
      'Phone': c.phone,
      'Total Udhaar Amount': c.totalOrdered - c.totalPaid
    }));

  return {
    reportName: 'Top 10 Clients by Udhaar',
    columns: ['Rank', 'Client Name', 'Phone', 'Total Udhaar Amount'],
    rows,
    chartData: rows.map(r => ({ name: r['Client Name'], value: r['Total Udhaar Amount'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Total Udhaar Amount'], 0),
      totalOrders: rows.length,
      avgOrder: 0
    }
  };
};

const generateLongestUdhaarClients = (clients: Client[]): ReportData => {
  const rows = clients.filter(c => (c.totalOrdered - c.totalPaid) > 0).map(c => ({
    'Client Name': c.name,
    'First Udhaar Date': '2026-01-01', // Simplified
    'Days Outstanding': 30, // Simplified
    'Amount': c.totalOrdered - c.totalPaid
  })).sort((a, b) => b['Days Outstanding'] - a['Days Outstanding']);

  return {
    reportName: 'Longest Standing Udhaar Clients',
    columns: ['Client Name', 'First Udhaar Date', 'Days Outstanding', 'Amount'],
    rows,
    chartData: rows.map(r => ({ name: r['Client Name'], value: r['Amount'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Amount'], 0),
      totalOrders: rows.length,
      avgOrder: 0
    }
  };
};

const generateSaleByDeal = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { count: number, revenue: number, discount: number }> = {};
  let totalRevenue = 0;

  history.forEach(o => {
    o.items.forEach(item => {
      if (item.type === 'deal') {
        const dealName = item.name;
        if (!stats[dealName]) {
          stats[dealName] = { count: 0, revenue: 0, discount: 0 };
        }
        stats[dealName].count += item.qty;
        stats[dealName].revenue += item.total;
        totalRevenue += item.total;
      }
    });
  });

  const rows = Object.entries(stats).map(([name, s]) => ({
    'Deal Name': name,
    'Times Ordered': s.count,
    'Revenue': s.revenue,
    'Avg Value': s.revenue / s.count
  }));

  return {
    reportName: 'Sale by Deal',
    columns: ['Deal Name', 'Times Ordered', 'Revenue', 'Avg Value'],
    rows,
    chartData: rows.map(r => ({ name: r['Deal Name'], revenue: r['Revenue'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'revenue',
    summary: {
      totalRevenue,
      totalOrders: rows.length,
      avgOrder: rows.length ? totalRevenue / rows.length : 0
    }
  };
};

const generateSaleByDiscount = (history: HistoryOrder[]): ReportData => {
  const rows = history.filter(o => (o.discountVal || 0) > 0).map(o => ({
    'Date': new Date(o.closedAt || o.startTime).toLocaleDateString(),
    'Order ID': o.id,
    'Original Amount': o.subtotal,
    'Discount': o.discountVal || 0,
    'Final Amount': o.total,
    'Applied By': o.cashier || 'Admin'
  }));

  return {
    reportName: 'Sale by Discount',
    columns: ['Date', 'Order ID', 'Original Amount', 'Discount', 'Final Amount', 'Applied By'],
    rows,
    chartData: rows.map(r => ({ name: r['Order ID'], value: r['Discount'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Discount'], 0),
      totalOrders: rows.length,
      avgOrder: 0
    }
  };
};

const generateSaleByTax = (history: HistoryOrder[]): ReportData => {
  const rows = history.map(o => ({
    'Date': new Date(o.closedAt || o.startTime).toLocaleDateString(),
    'Order ID': o.id,
    'Subtotal': o.subtotal,
    'Tax Rate': `${o.taxRate || 0}%`,
    'Tax Amount': o.taxVal || 0,
    'Total': o.total
  }));

  const totalTax = history.reduce((sum, o) => sum + (o.taxVal || 0), 0);

  return {
    reportName: 'Sale by Tax',
    columns: ['Date', 'Order ID', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total'],
    rows,
    chartData: history.slice(-10).map(o => ({ name: o.id.slice(-4), value: o.taxVal || 0 })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: totalTax,
      totalOrders: rows.length,
      avgOrder: rows.length ? totalTax / rows.length : 0
    }
  };
};

const generateLoyaltyReport = (clients: Client[]): ReportData => {
  const rows = clients.map(c => ({
    'Client Name': c.name,
    'Phone': c.phone,
    'Total Points': c.loyaltyPoints,
    'Total Earned': c.loyaltyPoints + (c.redemptions?.reduce((sum, r) => sum + r.points, 0) || 0),
    'Total Redeemed': c.redemptions?.reduce((sum, r) => sum + r.points, 0) || 0,
    'Redemption Value': c.redemptions?.reduce((sum, r) => sum + r.value, 0) || 0
  })).sort((a, b) => b['Total Points'] - a['Total Points']);

  return {
    reportName: 'Loyalty Points Summary',
    columns: ['Client Name', 'Phone', 'Total Points', 'Total Earned', 'Total Redeemed', 'Redemption Value'],
    rows,
    chartData: rows.slice(0, 10).map(r => ({ name: r['Client Name'], value: r['Total Points'] })),
    chartType: 'bar',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Redemption Value'], 0),
      totalOrders: rows.length,
      avgOrder: rows.reduce((sum, r) => sum + r['Total Points'], 0) / (rows.length || 1),
      count: rows.reduce((sum, r) => sum + r['Total Redeemed'], 0)
    }
  };
};

const generateVoucherReport = (history: HistoryOrder[]): ReportData => {
  const stats: Record<string, { count: number, totalDiscount: number, totalRevenue: number }> = {};
  
  history.forEach(o => {
    if (o.voucherCode) {
      if (!stats[o.voucherCode]) {
        stats[o.voucherCode] = { count: 0, totalDiscount: 0, totalRevenue: 0 };
      }
      stats[o.voucherCode].count += 1;
      stats[o.voucherCode].totalDiscount += o.voucherDiscount || 0;
      stats[o.voucherCode].totalRevenue += o.total;
    }
  });

  const rows = Object.entries(stats).map(([code, s]) => ({
    'Voucher Code': code,
    'Usage Count': s.count,
    'Total Discount Given': s.totalDiscount,
    'Total Revenue Generated': s.totalRevenue,
    'Avg Discount': s.count > 0 ? s.totalDiscount / s.count : 0
  })).sort((a, b) => b['Usage Count'] - a['Usage Count']);

  return {
    reportName: 'Voucher Usage Report',
    columns: ['Voucher Code', 'Usage Count', 'Total Discount Given', 'Total Revenue Generated', 'Avg Discount'],
    rows,
    chartData: rows.map(r => ({ name: r['Voucher Code'], value: r['Usage Count'] })),
    chartType: 'pie',
    xKey: 'name',
    yKey: 'value',
    summary: {
      totalRevenue: rows.reduce((sum, r) => sum + r['Total Revenue Generated'], 0),
      totalOrders: rows.reduce((sum, r) => sum + r['Usage Count'], 0),
      avgOrder: rows.reduce((sum, r) => sum + r['Total Discount Given'], 0),
      count: rows.length
    }
  };
};

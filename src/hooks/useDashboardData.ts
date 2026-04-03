import { useState, useEffect, useMemo } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useTableStore } from '../store/tableStore';
import { useMenuStore } from '../store/menuStore';
import { 
  getTodayOrders, 
  getYesterdayOrders, 
  getHourlySales, 
  getSalesByCategory, 
  getTopItems, 
  getSalesByPaymentMethod, 
  getWaiterPerformance, 
  getTrend 
} from '../utils/dashboardUtils';
import { TrendingUp, ClipboardList, Activity, BarChart2, ShoppingBag, Tag } from 'lucide-react';

export const useDashboardData = () => {
  const { history } = useHistoryStore();
  const { orders: activeOrders } = useTableStore();
  const { menuItems } = useMenuStore();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = () => setLastRefresh(new Date());

  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = useMemo(() => {
    const todayOrders = getTodayOrders(history);
    const yesterdayOrders = getYesterdayOrders(history);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueTrend = getTrend(todayRevenue, yesterdayRevenue);

    const todayCount = todayOrders.length;
    const yesterdayCount = yesterdayOrders.length;
    const countTrend = getTrend(todayCount, yesterdayCount);

    const activeCount = Object.keys(activeOrders).length;
    
    const todayAvg = todayCount > 0 ? todayRevenue / todayCount : 0;
    const yesterdayAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;
    const avgTrend = getTrend(todayAvg, yesterdayAvg);

    const todayItems = todayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
    const yesterdayItems = yesterdayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
    const itemsTrend = getTrend(todayItems, yesterdayItems);

    const todayDiscounts = todayOrders.reduce((sum, o) => sum + (o.discountVal || 0), 0);
    const yesterdayDiscounts = yesterdayOrders.reduce((sum, o) => sum + (o.discountVal || 0), 0);
    const discountsTrend = getTrend(todayDiscounts, yesterdayDiscounts);

    const kpiCards = [
      { 
        label: "Today's Revenue", 
        value: `PKR ${todayRevenue.toLocaleString()}`, 
        icon: TrendingUp, 
        color: 'text-purple-600', 
        trend: revenueTrend 
      },
      { 
        label: "Orders Today", 
        value: todayCount, 
        icon: ClipboardList, 
        color: 'text-blue-600', 
        trend: countTrend 
      },
      { 
        label: "Active Orders", 
        value: activeCount, 
        icon: Activity, 
        color: 'text-green-600', 
        trend: { percentage: 0, isUp: true } 
      },
      { 
        label: "Avg Order Value", 
        value: `PKR ${todayAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
        icon: BarChart2, 
        color: 'text-orange-600', 
        trend: avgTrend 
      },
      { 
        label: "Items Sold", 
        value: todayItems, 
        icon: ShoppingBag, 
        color: 'text-teal-600', 
        trend: itemsTrend 
      },
      { 
        label: "Discounts Given", 
        value: `PKR ${todayDiscounts.toLocaleString()}`, 
        icon: Tag, 
        color: 'text-red-600', 
        trend: discountsTrend 
      }
    ];

    const activeOrderTiles = Object.entries(activeOrders).map(([tableName, order]) => {
      const minutesOpen = Math.floor((Date.now() - order.startTime) / 60000);
      return {
        tableName,
        zone: 'Dine In', // In a real app, this would come from the order or table info
        minutesOpen,
        total: order.total
      };
    });

    return {
      kpiCards,
      activeOrderTiles,
      hourlySales: getHourlySales(todayOrders),
      categoryData: getSalesByCategory(todayOrders, menuItems),
      topItems: getTopItems(todayOrders),
      paymentBreakdown: getSalesByPaymentMethod(todayOrders),
      waiterPerformance: getWaiterPerformance(todayOrders),
      lastRefresh
    };
  }, [history, activeOrders, menuItems, lastRefresh]);

  return data;
};

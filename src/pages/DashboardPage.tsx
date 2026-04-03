import React, { useMemo } from 'react';
import { 
  RefreshCw, 
  Sun, 
  Clock, 
  PieChart as PieChartIcon, 
  Trophy, 
  CreditCard, 
  Users,
  Coffee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar as CalendarIcon,
  Star,
  Cake,
  Heart,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import { useLayoutStore } from '../store/layoutStore';
import { useClientStore } from '../store/clientStore';
import { useReservations } from '../hooks/useReservations';
import { formatCurrency } from '../utils/reportUtils';
import HourlySalesChart from '../components/charts/HourlySalesChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import PermissionGuard from '../components/ui/PermissionGuard';

const DashboardPage: React.FC = () => {
  const { 
    kpiCards, 
    activeOrderTiles, 
    hourlySales, 
    categoryData, 
    topItems, 
    paymentBreakdown, 
    waiterPerformance,
    lastRefresh
  } = useDashboardData();

  const setActiveSection = useLayoutStore(state => state.setActiveSection);
  const { clients, getClientTier } = useClientStore();
  const { todayReservations, upcomingReservations } = useReservations();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const topDebtors = useMemo(() => {
    return clients
      .filter(c => (c.totalOrdered - c.totalPaid) > 0)
      .sort((a, b) => (b.totalOrdered - b.totalPaid) - (a.totalOrdered - a.totalPaid))
      .slice(0, 5);
  }, [clients]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    return clients.filter(c => {
      if (!c.birthday && !c.anniversary) return false;
      
      const checkDate = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setFullYear(today.getFullYear());
        return d >= today && d <= next7Days;
      };

      return (c.birthday && checkDate(c.birthday)) || (c.anniversary && checkDate(c.anniversary));
    }).map(c => {
      const bday = c.birthday ? new Date(c.birthday) : null;
      const anniv = c.anniversary ? new Date(c.anniversary) : null;
      
      if (bday) bday.setFullYear(today.getFullYear());
      if (anniv) anniv.setFullYear(today.getFullYear());

      const isBday = bday && bday >= today && bday <= next7Days;
      return {
        id: c.id,
        name: c.name,
        type: isBday ? 'Birthday' : 'Anniversary',
        date: isBday ? bday! : anniv!
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [clients]);

  const loyaltyLeaderboard = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
      .slice(0, 5);
  }, [clients]);

  return (
    <div className="min-h-full bg-[#E0E5EC] p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Live Dashboard</h1>
          <p className="text-sm font-bold text-text-secondary">{formatDate(lastRefresh)}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-primary font-bold transition-all"
          >
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold shadow-lg hover:opacity-90 transition-all">
            <Sun size={20} />
            <span>Day End</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-background rounded-3xl p-6 shadow-neumorphic flex flex-col gap-4 border-l-4 border-primary/20">
            <div className={`w-10 h-10 rounded-2xl bg-background shadow-neumorphic flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-text-primary">{card.value}</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{card.label}</p>
            </div>
            {card.trend.percentage > 0 && (
              <div className={`flex items-center gap-1 text-[10px] font-bold ${card.trend.isUp ? 'text-green-600' : 'text-danger'}`}>
                {card.trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{card.trend.percentage.toFixed(1)}% vs yesterday</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Active Orders</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
            {activeOrderTiles.length}
          </span>
        </div>
        
        {activeOrderTiles.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {activeOrderTiles.map((tile, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveSection('dinein')} // Simplified navigation
                className="flex-shrink-0 w-[140px] h-[100px] bg-background rounded-2xl p-4 shadow-neumorphic hover:shadow-neumorphic-inset transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <p className="font-black text-primary text-sm">{tile.tableName}</p>
                  <span className="text-[10px] font-bold text-text-secondary uppercase">{tile.zone}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-green-600">{tile.minutesOpen} min</span>
                  <span className="text-[10px] font-bold text-text-secondary">PKR {tile.total}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-background rounded-3xl p-12 shadow-neumorphic flex flex-col items-center justify-center text-text-secondary gap-4">
            <Coffee size={48} className="opacity-20" />
            <p className="font-bold text-sm">No active orders right now</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Hourly Sales */}
        <div className="lg:col-span-6 bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-primary" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Sales by Hour</h2>
          </div>
          <HourlySalesChart data={hourlySales} />
        </div>

        {/* Category Sales */}
        <div className="lg:col-span-4 bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <PieChartIcon size={20} className="text-primary" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">By Category</h2>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Bottom Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {/* Today's Reservations Widget */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-[#6750A4]" />
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">Bookings</h2>
            </div>
            <button 
              onClick={() => setActiveSection('reservations')}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#6750A4]/5 border border-[#6750A4]/10">
            <div className="text-3xl font-black text-[#6750A4]">{todayReservations.length}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase leading-tight">
              Today's<br/>Reservations
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Upcoming Next</p>
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map(res => (
                <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic-inset">
                  <div>
                    <p className="text-xs font-black text-primary">{res.clientName}</p>
                    <p className="text-[10px] font-bold text-text-secondary">{res.tableName} • {res.startTime}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
                    <Users size={14} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-secondary italic">No upcoming bookings</p>
            )}
          </div>
        </div>

        {/* Upcoming Events Widget */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <Cake size={20} className="text-pink-500" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Events</h2>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Next 7 Days</p>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background shadow-neumorphic-inset">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.type === 'Birthday' ? 'bg-pink-100 text-pink-600' : 'bg-red-100 text-red-600'}`}>
                    {event.type === 'Birthday' ? <Cake size={14} /> : <Heart size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary">{event.name}</p>
                    <p className="text-[10px] font-bold text-text-secondary">
                      {event.type} • {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-secondary italic">No upcoming birthdays or anniversaries</p>
            )}
          </div>
        </div>

        {/* Loyalty Leaderboard */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-yellow-600" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">VIPs</h2>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Top Points</p>
            {loyaltyLeaderboard.map((client, idx) => {
              const tier = getClientTier(client.loyaltyPoints);
              return (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic-inset">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{tier.badge}</span>
                    <div>
                      <p className="text-xs font-black text-primary">{client.name}</p>
                      <p className="text-[10px] font-bold text-text-secondary">{client.loyaltyPoints.toLocaleString()} pts</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black" style={{ color: tier.color }}>{tier.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Debtors Widget */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">Debtors</h2>
            </div>
            <button 
              onClick={() => setActiveSection('clients')}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Highest Balance</p>
            {topDebtors.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic-inset">
                <div>
                  <p className="text-xs font-black text-primary">{client.name}</p>
                  <p className="text-[10px] font-bold text-text-secondary">{formatCurrency(client.totalOrdered - client.totalPaid)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <TrendingDown size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-primary" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Top Items</h2>
          </div>
          <div className="space-y-4">
            {topItems.slice(0, 4).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-primary truncate max-w-[100px]">{item.name}</p>
                  <p className="text-[10px] font-black text-primary">{item.qty} sold</p>
                </div>
                <div className="h-1.5 bg-background shadow-neumorphic-inset rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary shadow-lg" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-primary" />
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Payment Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentBreakdown.map((payment, idx) => (
            <div key={idx} className="bg-background rounded-3xl p-6 shadow-neumorphic flex flex-col gap-2 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full opacity-5 ${
                payment.method === 'Cash' ? 'bg-green-600' :
                payment.method === 'Card' ? 'bg-blue-600' :
                payment.method === 'Udhaar' ? 'bg-orange-600' : 'bg-purple-600'
              }`} />
              <div className="flex justify-between items-start">
                <p className="font-black text-text-primary">{payment.method}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  payment.method === 'Cash' ? 'bg-green-100 text-green-600' :
                  payment.method === 'Card' ? 'bg-blue-100 text-blue-600' :
                  payment.method === 'Udhaar' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {payment.percentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-black text-primary">PKR {payment.total.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{payment.count} Transactions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

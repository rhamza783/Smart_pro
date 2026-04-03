import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike, 
  List, 
  Menu as MenuIcon, 
  Package, 
  LayoutDashboard, 
  History, 
  Users, 
  BarChart, 
  Settings, 
  Calculator, 
  Database, 
  LogOut,
  X,
  RotateCcw,
  Calendar as CalendarIcon,
  Clock,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePrompt } from '../hooks/usePrompt';

import CartPanel from '../components/cart/CartPanel';
import { useCartStore } from '../store/cartStore';
import MenuSection from './MenuSection';
import TableSection from './TableSection';
import HistoryPage from './HistoryPage';
import DashboardPage from './DashboardPage';
import ReportsPage from './ReportsPage';
import CRMPage from './CRMPage';
import ReservationPage from './ReservationPage';
import AdvancePaymentPage from './AdvancePaymentPage';
import InventoryPage from './InventoryPage';
import StaffHubPage from './StaffHubPage';
import Toast from '../components/ui/Toast';
import PermissionGuard from '../components/ui/PermissionGuard';
import { ShieldAlert } from 'lucide-react';
import { useHistoryStore } from '../store/historyStore';
import { useClientStore } from '../store/clientStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useStaffStore } from '../store/staffStore';
import { useAdvancePaymentStore } from '../store/advancePaymentStore';
import { getStockStatus } from '../utils/inventoryUtils';
import { toast as hotToast } from 'react-hot-toast';

import ConfigPage from './ConfigPage';
import ActiveOrdersPage from './ActiveOrdersPage';
import DayEndPage from './DayEndPage';
import ReconciliationHistoryPage from './ReconciliationHistoryPage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { backupSystem, restoreSystem } from '../utils/backupUtils';
import { usePWA } from '../hooks/usePWA';
import { useTabSync } from '../hooks/useTabSync';
import { APP_VERSION } from '../utils/constants';
import ActiveTabsIndicator from '../components/ui/ActiveTabsIndicator';
import SyncStatusIndicator from '../components/ui/SyncStatusIndicator';

const POSLayout: React.FC = () => {
  useTabSync();
  useKeyboardShortcuts();
  const { isOnline, swUpdateAvailable } = usePWA();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  
  const activeSection = useLayoutStore(state => state.activeSection);
  const setActiveSection = useLayoutStore(state => state.setActiveSection);
  const tableLayout = useLayoutStore(state => state.tableLayout);

  const currentTable = useCartStore(state => state.currentTable);
  const history = useHistoryStore(state => state.history);
  const clients = useClientStore(state => state.clients);
  const { getActiveIngredients, getStockQty } = useInventoryStore();
  const { employees, schedules, timeEntries, getTodaySchedule } = useStaffStore();
  const { markExpired, getExpiringAdvances } = useAdvancePaymentStore();
  const { askConfirm } = usePrompt();
  
  const [lastViewedHistoryCount, setLastViewedHistoryCount] = useState(history.length);

  const unreadHistoryCount = Math.max(0, history.length - lastViewedHistoryCount);

  const lowStockCount = getActiveIngredients().filter(ing => {
    const qty = getStockQty(ing.id);
    const status = getStockStatus(qty, ing.minThreshold);
    return status !== 'ok';
  }).length;

  useEffect(() => {
    const checkAdvances = () => {
      markExpired();
      const expiring = getExpiringAdvances(1); // Check for today
      if (expiring.length > 0 && currentUser?.role === 'Admin') {
        hotToast.error(`${expiring.length} advance payments have expired today`, { id: 'advances-expired' });
      }
    };
    checkAdvances();
    const interval = setInterval(checkAdvances, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [markExpired, getExpiringAdvances, currentUser]);

  useEffect(() => {
    const checkStaffEvents = () => {
      if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Manager') return;

      const now = new Date();
      const today = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayDate = now.toISOString().split('T')[0];

      employees.filter(e => e.isActive).forEach(emp => {
        const sched = schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === today);
        if (sched && !sched.isOff) {
          // Upcoming shift (within 15 min)
          const [h, m] = sched.startTime.split(':').map(Number);
          const schedDate = new Date();
          schedDate.setHours(h, m, 0, 0);
          const diffMin = (schedDate.getTime() - now.getTime()) / (1000 * 60);
          
          if (diffMin > 0 && diffMin <= 15) {
            hotToast.success(`${emp.name} scheduled to start in ${Math.round(diffMin)} min`, { id: `start-${emp.id}` });
          }

          // Overdue clock-out (10+ hours)
          const entry = timeEntries.find(t => t.employeeId === emp.id && t.date === todayDate);
          if (entry?.clockIn && !entry?.clockOut) {
            const [ch, cm] = entry.clockIn.split(':').map(Number);
            const clockInDate = new Date();
            clockInDate.setHours(ch, cm, 0, 0);
            const workedHours = (now.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);
            if (workedHours >= 10) {
              hotToast.error(`${emp.name} has been on shift for ${workedHours.toFixed(1)} hours!`, { id: `overdue-${emp.id}` });
            }
          }
        }
      });
    };

    const interval = setInterval(checkStaffEvents, 5 * 60 * 1000); // Every 5 min
    checkStaffEvents();
    return () => clearInterval(interval);
  }, [employees, schedules, timeEntries, currentUser]);

  const activeZone = tableLayout.find(z => z.id === activeSection);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await askConfirm(
      'Restore System?',
      'All current data will be overwritten with the backup file. This action cannot be undone. Continue?'
    );

    if (confirmed) {
      try {
        await restoreSystem(file);
      } catch (err) {
        hotToast.error(err instanceof Error ? err.message : 'Failed to restore system');
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const AdminRequired = () => (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary p-10 text-center bg-[#E0E5EC] rounded-[32px] shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff]">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
        <ShieldAlert size={40} />
      </div>
      <h3 className="text-xl font-bold text-red-600 mb-2 uppercase tracking-tight">Access Denied</h3>
      <p className="text-sm max-w-md font-medium text-gray-500">
        You do not have permission to view this section. Please contact your system administrator.
      </p>
    </div>
  );

  const navItems: { id: string; label: string; icon: any; badge?: number; perm?: string }[] = [
    ...tableLayout.map(zone => ({
      id: zone.id,
      label: zone.name,
      icon: zone.id === 'dinein' ? UtensilsCrossed : zone.id === 'takeaway' ? ShoppingBag : Bike
    })),
    { id: 'active_orders', label: 'Active Orders', icon: List },
    { id: 'day_end', label: 'Day End', icon: Calculator, perm: 'viewReports' },
    { id: 'menu', label: 'Menu', icon: MenuIcon },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
  ];

  const drawerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'viewDashboard' },
    { 
      id: 'history', 
      label: 'Order History', 
      icon: History,
      badge: unreadHistoryCount > 0 ? unreadHistoryCount : undefined
    },
    { 
      id: 'clients', 
      label: 'Clients Ledger', 
      icon: Users, 
      perm: 'manageClients',
      badge: clients.length > 0 ? clients.length : undefined,
      indicator: clients.some(c => (c.totalOrdered - c.totalPaid) > 0) ? 'red' : undefined
    },
    { id: 'reservations', label: 'Reservations', icon: CalendarIcon, perm: 'viewReservations' },
    { id: 'advances', label: 'Advance Payments', icon: Wallet, perm: 'manageAccounts' },
    { id: 'staffhub', label: 'StaffHub Pro', icon: Users, perm: 'editRoles' },
    { id: 'reports', label: 'Reports', icon: BarChart, perm: 'viewReports' },
    { id: 'day_end', label: 'Day End (Z-Read)', icon: Calculator, perm: 'viewReports' },
    { id: 'reconciliation_history', label: 'Z-Reading History', icon: History, perm: 'viewReports' },
    { id: 'database', label: 'Database', icon: Database, perm: 'manageDatabase' },
    { id: 'config', label: 'Configuration', icon: Settings, perm: 'manageSettings' },
  ];

  const renderContent = () => {
    if (activeZone) {
      return <TableSection zone={activeZone} />;
    }

    if (activeSection === 'menu' || activeSection === 'items') {
      return <MenuSection />;
    }

    if (activeSection === 'config') {
      return <ConfigPage />;
    }

    if (activeSection === 'history') {
      return (
        <PermissionGuard perm="viewHistory" fallback={<AdminRequired />}>
          <HistoryPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'dashboard') {
      return (
        <PermissionGuard perm="viewDashboard" fallback={<AdminRequired />}>
          <DashboardPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'reports') {
      return (
        <PermissionGuard perm="viewReports" fallback={<AdminRequired />}>
          <ReportsPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'clients') {
      return (
        <PermissionGuard perm="manageClients" fallback={<AdminRequired />}>
          <CRMPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'reservations') {
      return (
        <PermissionGuard perm="viewReservations" fallback={<AdminRequired />}>
          <ReservationPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'advances') {
      return (
        <PermissionGuard perm="manageAccounts" fallback={<AdminRequired />}>
          <AdvancePaymentPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'active_orders') {
      return <ActiveOrdersPage />;
    }

    if (activeSection === 'day_end') {
      return (
        <PermissionGuard perm="viewReports" fallback={<AdminRequired />}>
          <DayEndPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'reconciliation_history') {
      return (
        <PermissionGuard perm="viewReports" fallback={<AdminRequired />}>
          <ReconciliationHistoryPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'inventory') {
      return (
        <PermissionGuard perm="manageInventory" fallback={<AdminRequired />}>
          <InventoryPage />
        </PermissionGuard>
      );
    }

    if (activeSection === 'staffhub') {
      return (
        <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
          <StaffHubPage />
        </PermissionGuard>
      );
    }

    const placeholders: Record<string, string> = {
      'active_orders': 'Active Orders Section',
      'inventory': 'Inventory Section',
      'dashboard': 'Dashboard Section',
      'history': 'Order History Section',
      'clients': 'Clients Section',
      'reports': 'Reports Section',
      'calculator': 'Calculator Section',
      'database': 'Database Section',
    };

    return (
      <div className="neumorphic-card min-h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2 capitalize">
            {activeSection.replace('_', ' ')}
          </h2>
          <p className="text-text-secondary">{placeholders[activeSection] || 'Content for this section will be built soon.'}</p>
        </div>
      </div>
    );
  };

  const isConfigMode = activeSection === 'config';
  const isFullWidthSection = isConfigMode || 
    activeSection === 'history' || 
    activeSection === 'dashboard' || 
    activeSection === 'reports' || 
    activeSection === 'clients' || 
    activeSection === 'reservations' ||
    activeSection === 'advances' ||
    activeSection === 'inventory' ||
    activeSection === 'staffhub' ||
    activeSection === 'active_orders' ||
    activeSection === 'day_end' ||
    activeSection === 'reconciliation_history';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Top Navigation Bar */}
      <header className="h-[56px] bg-primary flex items-center px-4 shadow-lg z-30 flex-shrink-0">
        <div className="flex-shrink-0 mr-4">
          <h1 className="text-white font-bold text-sm uppercase tracking-wider">
            AL-MADINA SHINWARI POS
          </h1>
        </div>

        {/* Middle Nav Buttons - Scrollable on mobile */}
        <nav className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition-all text-sm font-medium relative ${
                  isActive 
                    ? 'bg-white text-primary shadow-md' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sync Indicators */}
        <div className="hidden md:flex items-center gap-3 mr-4">
          <ActiveTabsIndicator />
          <SyncStatusIndicator />
        </div>

        {/* Right Side - Hamburger */}
        <div className="flex-shrink-0 ml-4">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <MenuIcon size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <main 
          className={`
            flex-1 overflow-auto transition-all duration-300
            ${isFullWidthSection ? 'p-0' : 'p-6'}
            ${(currentTable && !isFullWidthSection) ? 'mr-0 sm:mr-[320px]' : 'mr-0'}
          `}
        >
          {renderContent()}
        </main>

        {!isFullWidthSection && <CartPanel />}
      </div>

      <Toast />


      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-primary text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{currentUser?.name}</h3>
                  <p className="text-white/70 text-sm">{currentUser?.role}</p>
                </div>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto py-4">
                {/* Today's Staff Mini Section */}
                <div className="px-6 mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    <Clock size={12} />
                    Today's Staff
                  </div>
                  <div className="space-y-2">
                    {getTodaySchedule().slice(0, 3).map(({ employee, schedule }) => {
                      const entry = timeEntries.find(t => t.employeeId === employee.id && t.date === new Date().toISOString().split('T')[0]);
                      const isClockedIn = entry?.clockIn && !entry?.clockOut;
                      const isOverdue = !entry && !schedule.isOff && new Date().getHours() > parseInt(schedule.startTime.split(':')[0]);
                      
                      return (
                        <div key={employee.id} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-gray-600">{employee.name}</span>
                          <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-gray-300'}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {drawerLinks.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveSection(link.id);
                        if (link.id === 'history') {
                          setLastViewedHistoryCount(history.length);
                        }
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-6 py-3 transition-colors relative ${
                        activeSection === link.id ? 'bg-primary/10 text-primary' : 'text-text-primary hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} className={activeSection === link.id ? 'text-primary' : 'text-primary'} />
                      <span className="font-medium">{link.label}</span>
                      {link.badge && (
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {link.badge}
                        </span>
                      )}
                      {link.id === 'history' && unreadHistoryCount > 0 && (
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadHistoryCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={backupSystem}
                    className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                  >
                    <Database size={14} />
                    Backup
                  </button>
                  <button
                    onClick={() => document.getElementById('restore-input')?.click()}
                    className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <input 
                    id="restore-input"
                    type="file" 
                    accept=".json"
                    className="hidden" 
                    onChange={handleRestore}
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 text-danger hover:bg-red-50 rounded-xl transition-colors font-bold"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    AL-MADINA SHINWARI POS v{APP_VERSION}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {isOnline ? 'Offline Ready ✓' : 'Online Mode'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSLayout;

import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import ConfigSidebar from '../components/config/ConfigSidebar';
import PropertySettings from './config/PropertySettings';
import PreferencesSettings from './config/PreferencesSettings';
import TableDisplaySettings from './config/TableDisplaySettings';
import ActiveOrdersDisplaySettings from './config/ActiveOrdersDisplaySettings';
import ShortcutsSettings from './config/ShortcutsSettings';
import PaymentMethodsSettings from './config/PaymentMethodsSettings';
import BillConfiguration from './config/BillConfiguration';
import PrinterSettings from './config/PrinterSettings';
import KOTSettings from './config/KOTSettings';
import MenuManager from './config/MenuManager';
import CategoryManager from './config/CategoryManager';
import WorkersManagement from './config/WorkersManagement';
import SecurityRoles from './config/SecurityRoles';
import ReservationSettings from './config/ReservationSettings';
import DealManager from './config/DealManager';
import PermissionGuard from '../components/ui/PermissionGuard';
import { ShieldAlert } from 'lucide-react';

const ConfigPage: React.FC = () => {
  const { activeConfigTab, setActiveConfigTab } = useSettingsStore();

  const AdminRequired = () => (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary p-10 text-center bg-[#E0E5EC] rounded-[32px] shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff]">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
        <ShieldAlert size={40} />
      </div>
      <h3 className="text-xl font-bold text-red-600 mb-2 uppercase tracking-tight">Admin Access Required</h3>
      <p className="text-sm max-w-md font-medium text-gray-500">
        You do not have permission to access the "{activeConfigTab}" settings. Please contact your system administrator.
      </p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeConfigTab) {
      case 'property':
        return <PropertySettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'table':
        return <TableDisplaySettings />;
      case 'active-orders':
        return <ActiveOrdersDisplaySettings />;
      case 'shortcuts':
        return <ShortcutsSettings />;
      case 'payments':
        return <PaymentMethodsSettings />;
      case 'bill':
        return <BillConfiguration />;
      case 'printers':
        return <PrinterSettings />;
      case 'kot':
        return <KOTSettings />;
      case 'menu':
        return (
          <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
            <div className="space-y-8">
              <MenuManager />
              <CategoryManager />
            </div>
          </PermissionGuard>
        );
      case 'workers':
        return (
          <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
            <WorkersManagement />
          </PermissionGuard>
        );
      case 'roles':
        return (
          <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
            <SecurityRoles />
          </PermissionGuard>
        );
      case 'reservations':
        return (
          <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
            <ReservationSettings />
          </PermissionGuard>
        );
      case 'deals':
        return (
          <PermissionGuard perm="editRoles" fallback={<AdminRequired />}>
            <DealManager />
          </PermissionGuard>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-4xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Tab Under Construction</h3>
            <p className="text-sm max-w-md">
              The "{activeConfigTab}" settings tab is currently being developed. Please check back soon!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#E0E5EC] overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden p-4 bg-background border-b border-gray-300/30 flex justify-between items-center shrink-0">
        <h2 className="font-bold text-xl text-primary">Configuration</h2>
        <select 
          value={activeConfigTab}
          onChange={(e) => setActiveConfigTab(e.target.value)}
          className="p-2 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm border-none"
        >
          <option value="property">Property Settings</option>
          <option value="preferences">Preferences</option>
          <option value="table">Table Display Settings</option>
          <option value="active-orders">Active Orders Display</option>
          <option value="shortcuts">Shortcuts Settings</option>
          <option value="payments">Payment Methods</option>
          <option value="bill">Bill Configuration</option>
          <option value="printers">Printer Config</option>
          <option value="kot">KOT Print Settings</option>
          <option value="menu">Menu Manager</option>
          <option value="workers">Workers Management</option>
          <option value="roles">Security Roles</option>
          <option value="reservations">Reservation Settings</option>
          <option value="deals">Deal Manager</option>
        </select>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[280px] h-full overflow-y-auto custom-scrollbar border-r border-gray-300/30 shrink-0">
        <div className="p-6 pb-2">
          <h2 className="font-bold text-2xl text-primary">Configuration</h2>
          <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-medium">System Settings</p>
        </div>
        <ConfigSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;

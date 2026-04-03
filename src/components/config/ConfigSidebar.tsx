import React from 'react';
import {
  Building2,
  Palette,
  ShoppingCart,
  UtensilsCrossed,
  LayoutGrid,
  List,
  Calendar,
  Star,
  Printer,
  FileText,
  Users,
  Shield,
  CreditCard,
  Keyboard,
  Package,
  Tag
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

const tabs = [
  { id: 'property', label: 'Property Settings', icon: Building2 },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'cart', label: 'Cart Settings', icon: ShoppingCart },
  { id: 'menu', label: 'Menu Manager', icon: UtensilsCrossed },
  { id: 'table', label: 'Table Display Settings', icon: LayoutGrid },
  { id: 'active-orders', label: 'Active Orders Display', icon: List },
  { id: 'reservations', label: 'Reservation Settings', icon: Calendar },
  { id: 'loyalty', label: 'Loyalty Settings', icon: Star },
  { id: 'bill', label: 'Bill Configuration', icon: Printer },
  { id: 'printers', label: 'Printer Config', icon: Printer },
  { id: 'kot', label: 'KOT Print Settings', icon: FileText },
  { id: 'workers', label: 'Workers Management', icon: Users },
  { id: 'roles', label: 'Security Roles', icon: Shield },
  { id: 'deals', label: 'Deal Manager', icon: Tag },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'inventory', label: 'Inventory Settings', icon: Package },
];

const ConfigSidebar: React.FC = () => {
  const { activeConfigTab, setActiveConfigTab } = useSettingsStore();

  return (
    <div className="flex flex-col gap-3 p-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeConfigTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveConfigTab(tab.id)}
            className={`
              flex items-center gap-3 w-full p-4 rounded-2xl text-sm font-bold transition-all
              ${
                isActive
                  ? 'bg-background text-primary border-l-4 border-primary shadow-neumorphic-inset'
                  : 'bg-background text-text-secondary shadow-neumorphic hover:shadow-neumorphic-inset'
              }
            `}
          >
            <Icon size={18} className={isActive ? 'text-primary' : 'text-text-secondary'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ConfigSidebar;

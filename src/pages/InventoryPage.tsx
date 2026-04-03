import React, { useState } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import PermissionGuard from '../components/ui/PermissionGuard';
import InventoryDashboard from './inventory/InventoryDashboard';
import StockRegister from './inventory/StockRegister';
import RecipesTab from './inventory/RecipesTab';
import PurchasesTab from './inventory/PurchasesTab';
import WastageTab from './inventory/WastageTab';
import SuppliersTab from './inventory/SuppliersTab';
import PhysicalCountTab from './inventory/PhysicalCountTab';
import VarianceTab from './inventory/VarianceTab';
import ReorderTab from './inventory/ReorderTab';
import AuditLogTab from './inventory/AuditLogTab';
import InventorySettingsTab from './inventory/InventorySettingsTab';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  ShoppingCart, 
  Trash2, 
  Truck, 
  ClipboardList, 
  BarChart3, 
  RefreshCcw, 
  History, 
  Settings 
} from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: '📦 Stock Register', icon: Package },
  { id: 'recipes', label: '🍳 Recipes (BOM)', icon: ChefHat },
  { id: 'purchases', label: '🛒 Purchases', icon: ShoppingCart },
  { id: 'wastage', label: '🗑️ Wastage', icon: Trash2 },
  { id: 'suppliers', label: '🚚 Suppliers', icon: Truck },
  { id: 'count', label: '📋 Physical Count', icon: ClipboardList },
  { id: 'variance', label: '📈 Variance', icon: BarChart3 },
  { id: 'reorder', label: '🔄 Reorder', icon: RefreshCcw },
  { id: 'audit', label: '📜 Audit Log', icon: History },
  { id: 'settings', label: '⚙️ Settings', icon: Settings },
];

const InventoryPage: React.FC = () => {
  const { activeTab, setActiveTab } = useInventoryStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InventoryDashboard />;
      case 'stock':
        return <StockRegister />;
      case 'recipes':
        return <RecipesTab />;
      case 'purchases':
        return <PurchasesTab />;
      case 'wastage':
        return <WastageTab />;
      case 'suppliers':
        return <SuppliersTab />;
      case 'count':
        return <PhysicalCountTab />;
      case 'variance':
        return <VarianceTab />;
      case 'reorder':
        return <ReorderTab />;
      case 'audit':
        return <AuditLogTab />;
      case 'settings':
        return <InventorySettingsTab />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-text-secondary p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-4xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Tab Under Construction</h3>
            <p className="text-sm max-w-md">
              The "{tabs.find(t => t.id === activeTab)?.label}" tab is currently being developed.
            </p>
          </div>
        );
    }
  };

  return (
    <PermissionGuard perm="manageInventory">
      <div className="min-h-full bg-[#E0E5EC] p-4 md:p-8 space-y-6">
        {/* Tab Bar */}
        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-3 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg scale-105' 
                      : 'bg-[#E0E5EC] text-text-secondary shadow-neumorphic hover:shadow-neumorphic-inset'}
                  `}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderTabContent()}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default InventoryPage;

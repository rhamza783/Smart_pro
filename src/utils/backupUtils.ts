import { useLayoutStore } from '../store/layoutStore';
import { useMenuStore } from '../store/menuStore';
import { useHistoryStore } from '../store/historyStore';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useReconciliationStore } from '../store/reconciliationStore';
import { useReservationStore } from '../store/reservationStore';

export const backupSystem = () => {
  const data = {
    tableLayout: useLayoutStore.getState().tableLayout,
    menuItems: useMenuStore.getState().menuItems,
    menuCategories: useMenuStore.getState().menuCategories,
    orderHistory: useHistoryStore.getState().history,
    clients: useClientStore.getState().clients,
    appSettings: useSettingsStore.getState().propertySettings,
    billConfig: useSettingsStore.getState().billConfig,
    kotConfig: useSettingsStore.getState().kotConfig,
    preferences: useSettingsStore.getState().preferences,
    tableDisplaySettings: useSettingsStore.getState().tableDisplaySettings,
    activeOrdersDisplay: useSettingsStore.getState().activeOrdersDisplay,
    shortcuts: useSettingsStore.getState().shortcuts,
    paymentMethods: useSettingsStore.getState().paymentMethods,
    appWorkers: useAuthStore.getState().appWorkers,
    appRoles: useAuthStore.getState().appRoles,
    reconciliationHistory: useReconciliationStore.getState().reconciliationHistory,
    reservations: useReservationStore.getState().reservations,
    backupDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `pos_backup_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreSystem = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!data.menuItems || !data.orderHistory) {
          throw new Error('Invalid backup file structure');
        }

        // Restore to localStorage
        if (data.tableLayout) localStorage.setItem('pos_layout_v2', JSON.stringify(data.tableLayout));
        if (data.menuItems) localStorage.setItem('pos_menu_items', JSON.stringify(data.menuItems));
        if (data.menuCategories) localStorage.setItem('pos_menu_cats', JSON.stringify(data.menuCategories));
        if (data.orderHistory) localStorage.setItem('orderHistory', JSON.stringify(data.orderHistory));
        if (data.clients) localStorage.setItem('pos_clients', JSON.stringify(data.clients));
        if (data.appSettings) localStorage.setItem('pos_app_settings', JSON.stringify(data.appSettings));
        if (data.billConfig) localStorage.setItem('pos_bill_config', JSON.stringify(data.billConfig));
        if (data.kotConfig) localStorage.setItem('pos_kot_config', JSON.stringify(data.kotConfig));
        if (data.preferences) localStorage.setItem('pos_preferences', JSON.stringify(data.preferences));
        if (data.tableDisplaySettings) localStorage.setItem('pos_table_display', JSON.stringify(data.tableDisplaySettings));
        if (data.activeOrdersDisplay) localStorage.setItem('pos_active_orders_display', JSON.stringify(data.activeOrdersDisplay));
        if (data.shortcuts) localStorage.setItem('pos_shortcuts', JSON.stringify(data.shortcuts));
        if (data.paymentMethods) localStorage.setItem('pos_payment_methods', JSON.stringify(data.paymentMethods));
        if (data.appWorkers) localStorage.setItem('pos_workers', JSON.stringify(data.appWorkers));
        if (data.appRoles) localStorage.setItem('pos_roles', JSON.stringify(data.appRoles));
        if (data.reconciliationHistory) localStorage.setItem('pos_reconciliationHistory', JSON.stringify(data.reconciliationHistory));
        if (data.reservations) localStorage.setItem('pos_reservations', JSON.stringify(data.reservations));

        window.location.reload();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

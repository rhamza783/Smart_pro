import { create } from 'zustand';
import { PropertySettings, BillConfig, KOTConfig, PrintStyles, PrintStyle, ActiveOrdersDisplaySettings, ActiveOrdersZoneSettings } from '../types';
import { useSyncStore } from './syncStore';

export interface ZoneDisplaySettings {
  autoSize: boolean;
  askCustomer: boolean;
  askWaiter: boolean;
  width: number;
  height: number;
  minWidth: number;
  vGap: number;
  hGap: number;
  groupLineStyle: 'none' | 'solid' | 'dashed' | 'dotted';
  groupLineThickness: number;
  groupLineColor: string;
  borderRadius: number;
  tableFontSize: string;
  tableFontFamily: string;
  tableFontStyle: string;
  headerFontSize: string;
  headerFontFamily: string;
  headerFontStyle: string;
}

export interface Preferences {
  theme: string;
  cartPosition: 'left' | 'right';
  fontFamily: string;
  fontStyle: string;
}

export interface Shortcut {
  id: string;
  name: string;
  key: string;
  defaultKey: string;
  action: string;
}

interface SettingsState {
  propertySettings: PropertySettings;
  billConfig: BillConfig;
  kotConfig: KOTConfig;
  paymentMethods: string[];
  preferences: Preferences;
  tableDisplaySettings: Record<string, ZoneDisplaySettings>;
  activeOrdersDisplay: ActiveOrdersDisplaySettings;
  shortcuts: Shortcut[];
  activeConfigTab: string;
  
  saveSettings: () => void;
  loadSettings: () => void;
  setActiveConfigTab: (tab: string) => void;
  updatePropertySettings: (settings: Partial<PropertySettings>) => void;
  updateBillConfig: (config: Partial<BillConfig>) => void;
  updateKOTConfig: (config: Partial<KOTConfig>) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  updateTableDisplaySettings: (zoneId: string, settings: Partial<ZoneDisplaySettings>) => void;
  updateActiveOrdersDisplay: (settings: Partial<ActiveOrdersDisplaySettings>) => void;
  updateActiveOrdersZoneSettings: (zone: 'dinein' | 'takeaway' | 'delivery', settings: Partial<ActiveOrdersZoneSettings>) => void;
  updateShortcuts: (shortcuts: Shortcut[]) => void;
  updatePaymentMethods: (methods: string[]) => void;
  resetAllData: () => void;
  getBillConfig: () => BillConfig;
  getKOTConfig: () => KOTConfig;
}

const defaultPrintStyle: PrintStyle = {
  fontSize: '14px',
  fontFamily: 'Inter',
  fontStyle: 'Normal',
};

const defaultPrintStyles: PrintStyles = {
  restaurantName: { ...defaultPrintStyle, fontSize: '20px', fontStyle: 'Bold' },
  restaurantAddr: { ...defaultPrintStyle, fontSize: '12px' },
  restaurantPhone: { ...defaultPrintStyle, fontSize: '12px' },
  itemName: { ...defaultPrintStyle },
  itemPrice: { ...defaultPrintStyle },
  itemQty: { ...defaultPrintStyle },
  subtotal: { ...defaultPrintStyle },
  discount: { ...defaultPrintStyle },
  grandTotal: { ...defaultPrintStyle, fontSize: '18px', fontStyle: 'Bold' },
  footer: { ...defaultPrintStyle, fontSize: '12px' },
  dateHeading: { ...defaultPrintStyle, fontSize: '12px' },
  dateValue: { ...defaultPrintStyle, fontSize: '12px' },
  timeHeading: { ...defaultPrintStyle, fontSize: '12px' },
  timeValue: { ...defaultPrintStyle, fontSize: '12px' },
  orderHeading: { ...defaultPrintStyle, fontSize: '12px' },
  orderValue: { ...defaultPrintStyle, fontSize: '12px' },
  tableHeading: { ...defaultPrintStyle, fontSize: '12px' },
  tableValue: { ...defaultPrintStyle, fontSize: '12px' },
  cashierHeading: { ...defaultPrintStyle, fontSize: '12px' },
  cashierValue: { ...defaultPrintStyle, fontSize: '12px' },
  serverHeading: { ...defaultPrintStyle, fontSize: '12px' },
  serverValue: { ...defaultPrintStyle, fontSize: '12px' },
};

const defaultBillConfig: BillConfig = {
  printLogo: true,
  printPropInfo: true,
  printInvoiceNo: true,
  printStartTime: true,
  printPrintTime: true,
  printWaiter: true,
  printCashier: true,
  printCustomer: true,
  printBreakdown: true,
  printPayments: true,
  printNameLang: 'en',
  customFooter: '*** Thank You ***\nSoftware by: Hamza Younas',
  logoWidth: 150,
  printStyles: defaultPrintStyles,
  receiptSections: [
    { id: 'header', type: 'header', isVisible: true, sortOrder: 0 },
    { id: 'sep1', type: 'divider', isVisible: true, sortOrder: 1, customContent: '---' },
    { id: 'meta', type: 'header', isVisible: true, sortOrder: 2 },
    { id: 'sep2', type: 'divider', isVisible: true, sortOrder: 3, customContent: '---' },
    { id: 'items', type: 'items', isVisible: true, sortOrder: 4 },
    { id: 'sep3', type: 'divider', isVisible: true, sortOrder: 5, customContent: '---' },
    { id: 'totals', type: 'totals', isVisible: true, sortOrder: 6 },
    { id: 'payments', type: 'totals', isVisible: true, sortOrder: 7 },
    { id: 'sep4', type: 'divider', isVisible: true, sortOrder: 8, customContent: '---' },
    { id: 'footer', type: 'footer', isVisible: true, sortOrder: 9 },
  ],
};

const defaultKOTConfig: KOTConfig = {
  ...defaultBillConfig,
  printLogo: false,
  printPropInfo: false,
  printCashier: false,
  printBreakdown: false,
  printPayments: false,
  customFooter: 'Kitchen Copy',
};

const defaultProperty: PropertySettings = {
  name: 'AL-MADINA SHINWARI',
  phone: '0300-1234567',
  address: 'Main Boulevard, Gulberg III, Lahore',
  currency: 'PKR',
  logo: '',
  branch: 'Main Branch',
  logoWidth: 150,
  taxRate: 5, // Default 5% tax
};

const defaultPreferences: Preferences = {
  theme: 'default-light',
  cartPosition: 'right',
  fontFamily: 'Inter',
  fontStyle: 'normal',
};

const defaultZoneSettings: ZoneDisplaySettings = {
  autoSize: true,
  askCustomer: false,
  askWaiter: true,
  width: 100,
  height: 70,
  minWidth: 80,
  vGap: 15,
  hGap: 15,
  groupLineStyle: 'solid',
  groupLineThickness: 1,
  groupLineColor: '#cccccc',
  borderRadius: 8,
  tableFontSize: '14px',
  tableFontFamily: 'Inter',
  tableFontStyle: 'normal',
  headerFontSize: '16px',
  headerFontFamily: 'Inter',
  headerFontStyle: 'bold',
};

const defaultTableDisplay: Record<string, ZoneDisplaySettings> = {
  zone_dinein: { ...defaultZoneSettings },
  zone_takeaway: { ...defaultZoneSettings, askWaiter: false },
  zone_delivery: { ...defaultZoneSettings, askWaiter: false, askCustomer: true },
};

const defaultActiveOrdersZone: ActiveOrdersZoneSettings = {
  tileAutoSize: true,
  tileWidth: '100px',
  tileHeight: '70px',
  tileMinItemWidth: '80px',
  tileGap: '15px',
  tileColumnGap: '15px',
  groupLineStyle: 'Solid',
  groupLineThickness: '1px',
  groupLineColor: '#cccccc',
  tileBorderRadius: '8px',
  partitionGapTop: '10px',
  partitionGapBottom: '10px',
  groupHPadding: '10px',
  tableNameFontSize: '14px',
  timerFontSize: '12px',
  groupHeaderFontSize: '16px',
  uiFont: {
    tableNameFamily: 'Inter',
    tableNameStyle: 'Bold',
    timerFamily: 'Inter',
    timerStyle: 'Normal',
    groupHeaderFamily: 'Inter',
    groupHeaderStyle: 'Bold',
  }
};

const defaultActiveOrdersDisplay: ActiveOrdersDisplaySettings = {
  groupByZone: true,
  dinein: { ...defaultActiveOrdersZone },
  takeaway: { ...defaultActiveOrdersZone },
  delivery: { ...defaultActiveOrdersZone },
};

const defaultShortcuts: Shortcut[] = [
  { id: 'toggle-drawer', name: 'Toggle Drawer', key: 'F1', defaultKey: 'F1', action: 'TOGGLE_DRAWER' },
  { id: 'focus-search', name: 'Focus Search', key: 'F2', defaultKey: 'F2', action: 'FOCUS_SEARCH' },
  { id: 'customer-info', name: 'Customer Info', key: 'F4', defaultKey: 'F4', action: 'OPEN_CUSTOMER' },
  { id: 'discount', name: 'Discount', key: 'F5', defaultKey: 'F5', action: 'OPEN_DISCOUNT' },
  { id: 'print-kot', name: 'Print KOT', key: 'F7', defaultKey: 'F7', action: 'PRINT_KOT' },
  { id: 'print-bill', name: 'Print Bill', key: 'F8', defaultKey: 'F8', action: 'PRINT_BILL' },
  { id: 'payment', name: 'Payment', key: 'F9', defaultKey: 'F9', action: 'OPEN_PAYMENT' },
  { id: 'logout', name: 'Logout', key: 'F10', defaultKey: 'F10', action: 'LOGOUT' },
];

const loadSettings = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    const parsed = JSON.parse(stored);
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      return { ...defaultValue, ...parsed };
    }
    return parsed;
  } catch (e) {
    return defaultValue;
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  propertySettings: loadSettings('pos_app_settings', defaultProperty),
  billConfig: loadSettings('pos_bill_config', defaultBillConfig),
  kotConfig: loadSettings('pos_kot_config', defaultKOTConfig),
  preferences: loadSettings('pos_preferences', defaultPreferences),
  tableDisplaySettings: loadSettings('pos_table_display', defaultTableDisplay),
  activeOrdersDisplay: loadSettings('pos_active_orders_display', defaultActiveOrdersDisplay),
  shortcuts: loadSettings('pos_shortcuts', defaultShortcuts),
  paymentMethods: loadSettings('pos_payment_methods', ['Cash', 'Udhaar', 'Account', 'Advance']),
  activeConfigTab: 'property',

  saveSettings: () => {
    localStorage.setItem('pos_app_settings', JSON.stringify(get().propertySettings));
    localStorage.setItem('pos_bill_config', JSON.stringify(get().billConfig));
    localStorage.setItem('pos_kot_config', JSON.stringify(get().kotConfig));
    localStorage.setItem('pos_preferences', JSON.stringify(get().preferences));
    localStorage.setItem('pos_table_display', JSON.stringify(get().tableDisplaySettings));
    localStorage.setItem('pos_active_orders_display', JSON.stringify(get().activeOrdersDisplay));
    localStorage.setItem('pos_shortcuts', JSON.stringify(get().shortcuts));
    localStorage.setItem('pos_payment_methods', JSON.stringify(get().paymentMethods));
    useSyncStore.getState().broadcast('SETTINGS_CHANGED', null);
  },

  loadSettings: () => {
    set({
      propertySettings: loadSettings('pos_app_settings', defaultProperty),
      billConfig: loadSettings('pos_bill_config', defaultBillConfig),
      kotConfig: loadSettings('pos_kot_config', defaultKOTConfig),
      preferences: loadSettings('pos_preferences', defaultPreferences),
      tableDisplaySettings: loadSettings('pos_table_display', defaultTableDisplay),
      activeOrdersDisplay: loadSettings('pos_active_orders_display', defaultActiveOrdersDisplay),
      shortcuts: loadSettings('pos_shortcuts', defaultShortcuts),
      paymentMethods: loadSettings('pos_payment_methods', ['Cash', 'Udhaar', 'Account', 'Advance']),
    });
  },

  setActiveConfigTab: (tab) => set({ activeConfigTab: tab }),

  updatePropertySettings: (settings) => {
    set((state) => ({ propertySettings: { ...state.propertySettings, ...settings } }));
    get().saveSettings();
  },

  updateBillConfig: (config) => {
    set((state) => ({ billConfig: { ...state.billConfig, ...config } }));
    get().saveSettings();
  },

  updateKOTConfig: (config) => {
    set((state) => ({ kotConfig: { ...state.kotConfig, ...config } }));
    get().saveSettings();
  },

  updatePreferences: (prefs) => {
    set((state) => ({ preferences: { ...state.preferences, ...prefs } }));
    get().saveSettings();
  },

  updateTableDisplaySettings: (zoneId, settings) => {
    set((state) => ({
      tableDisplaySettings: {
        ...state.tableDisplaySettings,
        [zoneId]: { ...state.tableDisplaySettings[zoneId], ...settings }
      }
    }));
    get().saveSettings();
  },

  updateActiveOrdersDisplay: (settings) => {
    set((state) => ({ activeOrdersDisplay: { ...state.activeOrdersDisplay, ...settings } }));
    get().saveSettings();
  },

  updateActiveOrdersZoneSettings: (zone, settings) => {
    set((state) => ({
      activeOrdersDisplay: {
        ...state.activeOrdersDisplay,
        [zone]: { ...state.activeOrdersDisplay[zone], ...settings }
      }
    }));
    get().saveSettings();
  },

  updateShortcuts: (shortcuts) => {
    set({ shortcuts });
    get().saveSettings();
  },

  updatePaymentMethods: (methods) => {
    set({ paymentMethods: methods });
    get().saveSettings();
  },

  resetAllData: () => {
    localStorage.clear();
    window.location.reload();
  },

  getBillConfig: () => get().billConfig,
  getKOTConfig: () => get().kotConfig,
}));

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Category,
  MenuItem,
  Zone,
  AppSettings,
  User,
  Role,
  Client,
  Reservation,
  Deal,
  PrintConfig,
  PrintStyles,
  PrintStyle
} from '../types';

export const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Karahi', sortOrder: 1 },
  { id: 'cat_2', name: 'BBQ', sortOrder: 2 },
  { id: 'cat_3', name: 'Burgers', sortOrder: 3 },
  { id: 'cat_4', name: 'Pizza', sortOrder: 4 },
  { id: 'cat_5', name: 'Fries', sortOrder: 5 },
  { id: 'cat_6', name: 'Other', sortOrder: 6 },
  { id: 'cat_7', name: 'MenuItems', sortOrder: 7 }
];

export const defaultMenu: MenuItem[] = [
  {
    id: 'item_1',
    name: 'Chicken Karahi',
    price: 1200,
    category: 'cat_1',
    status: 'available',
    sortOrder: 1,
    variants: [
      { vName: 'Half', vPrice: 1200 },
      { vName: 'Full', vPrice: 2200 }
    ]
  },
  {
    id: 'item_2',
    name: 'Seekh Kabab',
    price: 150,
    category: 'cat_2',
    status: 'available',
    sortOrder: 2,
    modifiers: [
      {
        groupName: 'Spiciness',
        maxSelect: 1,
        options: [
          { name: 'Mild', price: 0 },
          { name: 'Medium', price: 0 },
          { name: 'Hot', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'item_3',
    name: 'Zinger Burger',
    price: 450,
    category: 'cat_3',
    status: 'available',
    sortOrder: 3,
    modifiers: [
      {
        groupName: 'Add-ons',
        maxSelect: 3,
        options: [
          { name: 'Cheese Slice', price: 50 },
          { name: 'Extra Patty', price: 150 },
          { name: 'Egg', price: 40 }
        ]
      }
    ]
  },
  {
    id: 'item_4',
    name: 'Pepperoni Pizza',
    price: 800,
    category: 'cat_4',
    status: 'available',
    sortOrder: 4,
    variants: [
      { vName: 'Small', vPrice: 800 },
      { vName: 'Medium', vPrice: 1200 },
      { vName: 'Large', vPrice: 1600 }
    ]
  },
  {
    id: 'item_5',
    name: 'Masala Fries',
    price: 200,
    category: 'cat_5',
    status: 'available',
    sortOrder: 5
  }
];

export const defaultZones: Zone[] = [
  {
    id: 'zone_dinein',
    name: 'Dine-in',
    sections: [
      {
        name: 'Indoor',
        prefix: 'I',
        tables: [
          { name: '1', sortOrder: 1 },
          { name: '2', sortOrder: 2 },
          { name: '3', sortOrder: 3 }
        ]
      },
      {
        name: 'Outdoor',
        prefix: 'O',
        tables: [
          { name: '10', sortOrder: 1 },
          { name: '11', sortOrder: 2 }
        ]
      }
    ]
  },
  {
    id: 'zone_takeaway',
    name: 'Takeaway',
    sections: [
      {
        name: 'Counter',
        tables: [{ name: 'T1', sortOrder: 1 }, { name: 'T2', sortOrder: 2 }]
      }
    ]
  },
  {
    id: 'zone_delivery',
    name: 'Delivery',
    sections: [
      {
        name: 'Dispatch',
        tables: [{ name: 'D1', sortOrder: 1 }, { name: 'D2', sortOrder: 2 }]
      }
    ]
  }
];

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

const defaultPrintConfig: PrintConfig = {
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
  customFooter: 'Thank you for your visit!',
  logoWidth: 150,
  printStyles: defaultPrintStyles
};

export const defaultSettings: AppSettings = {
  property: {
    name: 'Modern POS',
    phone: '123-456-7890',
    address: '123 Main St, Food City',
    currency: 'Rs.',
    logo: '',
    branch: 'Main Branch',
    openingTime: '09:00',
    closingTime: '23:00'
  },
  preferences: {
    theme: 'light',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    cartPosition: 'right',
    menuLang: 'en',
    cartItemLang: 'en',
    tableFontSize: 14,
    paymentFontSize: 16,
    itemFontSize: 14,
    priceFontSize: 14,
    catFontSize: 14,
    dashNumFontSize: 24,
    menuBtnWidth: 120,
    menuBtnHeight: 80,
    menuBtnAutoSize: true,
    menuBtnGap: 8,
    menuBtnColumnGap: 8,
    menuBtnMinItemWidth: 100,
    showPricesOnMenu: true,
    uiFont: {
      tableFamily: 'Inter', tableStyle: 'normal',
      tableHeaderFamily: 'Inter', tableHeaderStyle: 'bold',
      itemFamily: 'Inter', itemStyle: 'normal',
      priceFamily: 'Inter', priceStyle: 'medium',
      catFamily: 'Inter', catStyle: 'bold',
      cartHeadFamily: 'Inter', cartHeadStyle: 'bold',
      cartItemFamily: 'Inter', cartItemStyle: 'normal',
      paymentFamily: 'Inter', paymentStyle: 'bold',
      dashNumFamily: 'Inter', dashNumStyle: 'bold'
    },
    cartHeadNameSize: 12, cartHeadPriceSize: 12, cartHeadQtySize: 12, cartHeadTotalSize: 12,
    cartItemNameSize: 12, cartItemPriceSize: 12, cartItemQtySize: 12, cartItemTotalSize: 12
  },
  tableDisplay: {
    dinein: {
      tableBtnAutoSize: true, tableBtnWidth: 80, tableBtnHeight: 80, tableBtnMinItemWidth: 60,
      tableBtnGap: 10, tableBtnColumnGap: 10, tableGroupLineStyle: 'solid', tableGroupLineThickness: 1,
      tableGroupLineColor: '#ccc', tableGroupHGap: 20, tableButtonBorderRadius: 8,
      tableGroupContentPadding: 10, tablePartitionGapTop: 10, tablePartitionGapBottom: 10,
      tableGroupHPadding: 10, tableFontSize: 14, tableGroupHeaderFontSize: 16,
      askForClient: false, askForWaiter: true,
      uiFont: {
        tableFamily: 'Inter', tableStyle: 'normal',
        tableHeaderFamily: 'Inter', tableHeaderStyle: 'bold'
      }
    }
  },
  activeOrdersDisplay: {
    groupByZone: true,
    zones: {}
  },
  reservation: {
    defaultDuration: 60,
    beforeMargin: 15,
    afterMargin: 15,
    allowOverbooking: false
  },
  loyalty: {
    pointsPerCurrency: 1,
    redeemRate: 0.1,
    minRedeem: 100
  },
  receiptTemplate: {
    header: 'Welcome to Modern POS',
    items: '{qty} x {name} @ {price} = {total}',
    footer: 'Please come again!'
  },
  kotConfig: defaultPrintConfig,
  billConfig: defaultPrintConfig,
  paymentMethods: ['Cash', 'Card', 'Online'],
  shortcuts: [],
  inventory: {
    lowStockThreshold: 10,
    varianceWarningPct: 5,
    varianceCriticalPct: 10,
    priceAnomalyPct: 20,
    autoReorder: false
  }
};

export const defaultWorkers: User[] = [
  { name: 'Admin', role: 'Admin', login: 'admin', pass: 'admin' },
  { name: 'Manager', role: 'Manager', login: 'manager', pass: 'manager123' },
  { name: 'Cashier', role: 'Cashier', login: 'cashier', pass: 'cashier123' },
  { name: 'Waiter', role: 'Waiter', login: 'waiter', pass: 'waiter123' }
];

export const defaultRoles: Role[] = [
  {
    name: 'Admin',
    perms: {
      editRoles: true, createOrder: true, transferTable: true, transferWaiter: true,
      splitOrder: true, applyDiscount: true, applyTax: true, refund: true,
      deleteActiveOrder: true, wipeHistory: true, manageClients: true, manageAccounts: true,
      manageVouchers: true, viewDashboard: true, viewReports: true, viewHistory: true,
      reprintOrder: true, editMenu: true, modifyPrinted: true, manageInventory: true,
      approvePurchase: true, approveWastage: true, manageSuppliers: true, viewVariance: true,
      editRecipe: true
    }
  },
  {
    name: 'Manager',
    perms: {
      editRoles: false, createOrder: true, transferTable: true, transferWaiter: true,
      splitOrder: true, applyDiscount: true, applyTax: true, refund: true,
      deleteActiveOrder: true, wipeHistory: false, manageClients: true, manageAccounts: true,
      manageVouchers: true, viewDashboard: true, viewReports: true, viewHistory: true,
      reprintOrder: true, editMenu: true, modifyPrinted: true, manageInventory: true,
      approvePurchase: true, approveWastage: true, manageSuppliers: true, viewVariance: true,
      editRecipe: true
    }
  },
  {
    name: 'Cashier',
    perms: {
      editRoles: false, createOrder: true, transferTable: true, transferWaiter: true,
      splitOrder: false, applyDiscount: false, applyTax: false, refund: false,
      deleteActiveOrder: false, wipeHistory: false, manageClients: true, manageAccounts: false,
      manageVouchers: false, viewDashboard: false, viewReports: false, viewHistory: true,
      reprintOrder: true, editMenu: false, modifyPrinted: false, manageInventory: false,
      approvePurchase: false, approveWastage: false, manageSuppliers: false, viewVariance: false,
      editRecipe: false
    }
  },
  {
    name: 'Waiter',
    perms: {
      editRoles: false, createOrder: true, transferTable: true, transferWaiter: false,
      splitOrder: false, applyDiscount: false, applyTax: false, refund: false,
      deleteActiveOrder: false, wipeHistory: false, manageClients: false, manageAccounts: false,
      manageVouchers: false, viewDashboard: false, viewReports: false, viewHistory: false,
      reprintOrder: false, editMenu: false, modifyPrinted: false, manageInventory: false,
      approvePurchase: false, approveWastage: false, manageSuppliers: false, viewVariance: false,
      editRecipe: false
    }
  }
];

export const defaultClients: Client[] = [
  {
    id: 'client_1', name: 'John Doe', phone: '555-0101', email: 'john@example.com',
    address: '123 Main St', company: 'Tech Corp', notes: '',
    isBlocked: false, totalOrdered: 8000, totalPaid: 6800, loyaltyPoints: 150,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    ledger: [
      {
        id: 'L1', date: Date.now() - 10 * 24 * 60 * 60 * 1000, type: 'order',
        description: 'Initial Order', debit: 8000, credit: 0, balance: 8000
      },
      {
        id: 'L2', date: Date.now() - 5 * 24 * 60 * 60 * 1000, type: 'payment',
        description: 'Cash Payment', debit: 0, credit: 6800, balance: 1200
      }
    ]
  },
  {
    id: 'client_2', name: 'Jane Smith', phone: '555-0102', email: 'jane@example.com',
    address: '456 Oak Ave', company: 'Design Studio', notes: '',
    isBlocked: false, totalOrdered: 1500, totalPaid: 1500, loyaltyPoints: 20,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    ledger: [
      {
        id: 'L3', date: Date.now() - 10 * 24 * 60 * 60 * 1000, type: 'order',
        description: 'Order #123', debit: 1500, credit: 0, balance: 1500
      },
      {
        id: 'L4', date: Date.now() - 2 * 24 * 60 * 60 * 1000, type: 'payment',
        description: 'Card Payment', debit: 0, credit: 1500, balance: 0
      }
    ]
  }
];

export const defaultReservations: Reservation[] = [
  {
    id: 'res_1', date: '2026-03-28', startTime: '19:00', endTime: '21:00',
    tableName: 'I-1', people: 4, clientName: 'Alice Brown', clientPhone: '555-0202',
    notes: 'Birthday celebration', status: 'confirmed', createdAt: Date.now()
  }
];

export const defaultDeals: Deal[] = [
  {
    id: 'deal_1',
    name: 'Family Combo',
    description: '1 Large Pizza, 1 Family Salad, 2 Drinks',
    price: 2500,
    status: 'available',
    sortOrder: 1,
    createdAt: Date.now(),
    items: [
      { menuItemId: 'item_1', menuItemName: 'Large Pizza', qty: 1, price: 1500 },
      { menuItemId: 'item_4', menuItemName: 'Family Salad', qty: 1, price: 600 },
      { menuItemId: 'item_5', menuItemName: 'Soft Drink', qty: 2, price: 200 }
    ]
  }
];

/**
 * Seeds missing data in localStorage with defaults.
 */
export function initializeData() {
  const keys = {
    categories: 'pos_categories',
    menu: 'pos_menu',
    zones: 'pos_layout_v2',
    settings: 'pos_app_settings',
    billConfig: 'pos_bill_config',
    kotConfig: 'pos_kot_config',
    workers: 'pos_workers',
    roles: 'pos_roles',
    clients: 'pos_clients',
    reservations: 'pos_reservations',
    deals: 'pos_deals',
    history: 'orderHistory'
  };

  const now = Date.now();
  const sampleHistory = [
    {
      id: '1001',
      table: 'I-1',
      waiter: 'Waiter',
      cashier: 'Admin',
      customer: { name: 'John Doe', phone: '555-0101' },
      items: [
        { id: 'item_1', name: 'Chicken Karahi', price: 1200, qty: 1, total: 1200 },
        { id: 'item_5', name: 'Masala Fries', price: 200, qty: 2, total: 400 }
      ],
      subtotal: 1600,
      discount: 0,
      discountVal: 0,
      discType: 'fixed',
      total: 1600,
      status: 'completed',
      startTime: now - 3600000,
      closedAt: now - 1800000,
      payments: [{ method: 'Cash', amount: 1600 }]
    },
    {
      id: '1002',
      table: 'I-2',
      waiter: 'Waiter',
      cashier: 'Admin',
      items: [
        { id: 'item_4', name: 'Pepperoni Pizza', price: 1600, qty: 1, total: 1600 }
      ],
      subtotal: 1600,
      discount: 10,
      discountVal: 160,
      discType: 'percent',
      total: 1440,
      status: 'completed',
      startTime: now - 7200000,
      closedAt: now - 5400000,
      payments: [{ method: 'Card', amount: 1440 }]
    },
    {
      id: '1003',
      table: 'Takeaway',
      waiter: 'Cashier',
      cashier: 'Cashier',
      items: [
        { id: 'item_3', name: 'Zinger Burger', price: 450, qty: 3, total: 1350 }
      ],
      subtotal: 1350,
      discount: 0,
      discountVal: 0,
      discType: 'fixed',
      total: 1350,
      status: 'completed',
      startTime: now - 10800000,
      closedAt: now - 9000000,
      payments: [{ method: 'Cash', amount: 1350 }]
    }
  ];

  const defaults = {
    categories: defaultCategories,
    menu: defaultMenu,
    zones: defaultZones,
    settings: defaultSettings,
    billConfig: defaultPrintConfig,
    kotConfig: defaultPrintConfig,
    workers: defaultWorkers,
    roles: defaultRoles,
    clients: defaultClients,
    reservations: defaultReservations,
    deals: defaultDeals,
    history: sampleHistory
  };

  Object.entries(keys).forEach(([key, storageKey]) => {
    if (localStorage.getItem(storageKey) === null) {
      localStorage.setItem(storageKey, JSON.stringify(defaults[key as keyof typeof defaults]));
    }
  });
}

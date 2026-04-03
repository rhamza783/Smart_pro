/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Variant {
  vName: string;
  vPrice: number;
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  groupName: string;
  maxSelect?: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  altName?: string;
  price: number;
  category: string;
  status: 'available' | 'hidden';
  variants?: Variant[];
  modifiers?: ModifierGroup[];
  sortOrder: number;
  code?: string;
  imgData?: string;
  askPrice?: boolean;
  askQty?: boolean;
  isWeightBased?: boolean;
  showPriceOnButton?: boolean;
  lastCustomPrice?: number;
  lastCustomQty?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SelectedModifier {
  groupName: string;
  optionName: string;
  price: number;
  qty: number;
}

export interface Payment {
  method: string;
  amount: number;
}

export interface OrderItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  basePrice: number;
  qty: number;
  total: number;
  modifiers?: SelectedModifier[];
  itemNote?: string;
  printedQty?: number;
  tempId?: string;
  type?: 'item' | 'deal';
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
}

export interface ZoneSettings {
  askForWaiter: boolean;
  askForClient: boolean;
  tableBtnWidth: string;
  tableBtnHeight: string;
  tableBtnAutoSize: boolean;
}

export interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  discount: number;
  discType: 'fixed' | 'percent';
  waiter: string;
  customer: Customer;
  payments?: Payment[];
  startTime: number;
  lastModified?: number;
  status: 'active' | 'completed' | 'cancelled';
  total: number;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  voucherCode?: string;
  voucherDiscount?: number;
  splitBillConfig?: SplitBillConfig;
}

export interface SplitBillConfig {
  type: 'equal' | 'byItem' | 'custom';
  partyCount?: number;
  splits: SplitPortion[];
}

export interface SplitPortion {
  id: string;
  label: string;
  items: SplitItem[];
  customAmount?: number;
  isPaid: boolean;
  payments: Payment[];
}

export interface SplitItem {
  orderItemIndex: number;
  itemName: string;
  itemTotal: number;
  qty: number;
  assignedQty: number;
}

export interface HistoryOrder extends Order {
  cashier: string;
  closedAt: number;
  discountVal: number;
  taxVal?: number;
  status: 'completed' | 'cancelled';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  splitBillConfig?: SplitBillConfig;
}

export interface AdvancePayment {
  id: string;
  type: 'reservation' | 'catering' | 'general';
  clientId?: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  paymentMethod: string;
  referenceNote: string;
  reservationId?: string;
  orderId?: string;
  status: 'active' | 'consumed' | 'refunded' | 'expired';
  createdAt: number;
  createdBy: string;
  consumedAt?: number;
  consumedOrderId?: string;
  refundedAt?: number;
  refundReason?: string;
  expiryDate?: string;
}

export interface AdvancePaymentSummary {
  totalCollected: number;
  totalConsumed: number;
  totalRefunded: number;
  totalActive: number;
  activeCount: number;
}

export interface Table {
  name: string;
  sortOrder: number;
}

export interface Section {
  name: string;
  tables: Table[];
  prefix?: string;
}

export interface Zone {
  id: string;
  name: string;
  sections: Section[];
  settings?: ZoneSettings;
}

export interface AppUser {
  name: string;
  role: string;
  login: string;
  pass: string;
  phone?: string;
}

export interface Role {
  name: string;
  perms: Record<string, boolean>;
}

export type AppRole = Role;

export interface PropertySettings {
  name: string;
  phone: string;
  address: string;
  currency: string;
  logo: string;
  branch: string;
  logoWidth: number;
  taxRate?: number;
}

export interface PrintStyle {
  fontSize: string;
  fontFamily: string;
  fontStyle: string;
}

export interface PrintStyles {
  restaurantName: PrintStyle;
  restaurantAddr: PrintStyle;
  restaurantPhone: PrintStyle;
  itemName: PrintStyle;
  itemPrice: PrintStyle;
  itemQty: PrintStyle;
  subtotal: PrintStyle;
  discount: PrintStyle;
  grandTotal: PrintStyle;
  footer: PrintStyle;
  
  // Meta Rows
  dateHeading: PrintStyle;
  dateValue: PrintStyle;
  timeHeading: PrintStyle;
  timeValue: PrintStyle;
  orderHeading: PrintStyle;
  orderValue: PrintStyle;
  tableHeading: PrintStyle;
  tableValue: PrintStyle;
  cashierHeading: PrintStyle;
  cashierValue: PrintStyle;
  serverHeading: PrintStyle;
  serverValue: PrintStyle;
}

export interface BillConfig {
  printLogo: boolean;
  printPropInfo: boolean;
  printInvoiceNo: boolean;
  printStartTime: boolean;
  printPrintTime: boolean;
  printWaiter: boolean;
  printCashier: boolean;
  printCustomer: boolean;
  printBreakdown: boolean;
  printPayments: boolean;
  printNameLang: 'en' | 'ur' | 'both';
  customFooter: string;
  logoWidth: number;
  printStyles: PrintStyles;
  receiptSections?: ReceiptSection[];
}

export type KOTConfig = BillConfig;

export type Category = MenuCategory;
export type AppSettings = any;
export type User = AppUser;
export interface LedgerEntry {
  id: string;
  date: number;
  type: 'order' | 'payment' | 'adjustment';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  orderId?: string;
}

export interface RedemptionEntry {
  id: string;
  date: number;
  points: number;
  value: number;
  orderId: string;
}

export interface CommunicationEntry {
  id: string;
  type: 'call' | 'whatsapp' | 'sms' | 'note' | 'visit' | 'email';
  direction: 'inbound' | 'outbound';
  summary: string;
  createdAt: number;
  createdBy: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  isBlocked: boolean;
  totalOrdered: number;
  totalPaid: number;
  loyaltyPoints: number;
  createdAt: number;
  ledger: LedgerEntry[];
  redemptions?: RedemptionEntry[];
  communications?: CommunicationEntry[];
  birthday?: string;
  anniversary?: string;
}
export interface Reservation {
  id: string;
  tableName: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  date: string;
  startTime: string;
  endTime: string;
  people: number;
  notes: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: number;
  depositAmount?: number;
  advanceId?: string;
}

export interface ReservationSettings {
  defaultDuration: number;
  beforeMargin: number;
  afterMargin: number;
  allowOverbooking: boolean;
}

export type PrintConfig = BillConfig;

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  topItem?: string;
  count?: number;
  [key: string]: any;
}

export interface ReportData {
  reportName: string;
  columns: string[];
  rows: Record<string, any>[];
  chartData: any[];
  chartType: 'bar' | 'horizontalBar' | 'pie' | 'line';
  summary: ReportSummary;
  xKey: string;
  yKey: string;
}

export interface Ingredient {
  id: string;
  name: string;
  altName?: string;
  unit: string;
  category: string;
  minThreshold: number;
  costPerUnit: number;
  barcode?: string;
  notes?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StockEntry {
  ingredientId: string;
  currentQty: number;
  lastUpdated: number;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: 'PURCHASE' | 'SALE' | 'WASTAGE' | 'ADJUSTMENT' | 'COUNT' | 'MANUAL';
  delta: number;
  prevQty: number;
  newQty: number;
  reason: string;
  userId: string;
  timestamp: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: number;
}

export interface Recipe {
  menuItemId: string;
  ingredients: RecipeIngredient[];
  updatedAt: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  status: 'pending' | 'approved' | 'rejected';
  totalCost: number;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectedReason?: string;
  notes: string;
}

export interface ActiveOrdersDisplaySettings {
  groupByZone: boolean;
  dinein: ActiveOrdersZoneSettings;
  takeaway: ActiveOrdersZoneSettings;
  delivery: ActiveOrdersZoneSettings;
}

export interface ActiveOrdersZoneSettings {
  tileAutoSize: boolean;
  tileWidth: string;
  tileHeight: string;
  tileMinItemWidth: string;
  tileGap: string;
  tileColumnGap: string;
  groupLineStyle: 'None' | 'Solid' | 'Dashed' | 'Dotted';
  groupLineThickness: string;
  groupLineColor: string;
  tileBorderRadius: string;
  partitionGapTop: string;
  partitionGapBottom: string;
  groupHPadding: string;
  tableNameFontSize: string;
  timerFontSize: string;
  groupHeaderFontSize: string;
  uiFont: {
    tableNameFamily: string;
    tableNameStyle: string;
    timerFamily: string;
    timerStyle: string;
    groupHeaderFamily: string;
    groupHeaderStyle: string;
  };
}

export interface ZReading {
  id: string;
  shiftStart: number;
  shiftEnd: number;
  cashier: string;
  expectedCash: number;
  countedCash: number;
  difference: number;
  totalOrders: number;
  grossRevenue: number;
  netRevenue: number;
  totalDiscounts: number;
  paymentBreakdown: Record<string, number>;
  notes: string;
  createdAt: number;
}

export interface PurchaseItem {
  ingredientId: string;
  ingredientName: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface WastageEntry {
  id: string;
  ingredientId: string;
  ingredientName: string;
  qty: number;
  unit: string;
  reason: string;
  declaredBy: string;
  declaredAt: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  archived: boolean;
  createdAt: number;
}

export interface PhysicalCount {
  id: string;
  startedAt: number;
  completedAt?: number;
  status: 'in_progress' | 'completed';
  entries: CountEntry[];
  startedBy: string;
}

export interface CountEntry {
  ingredientId: string;
  systemQty: number;
  countedQty: number;
  variance: number;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  loginId: string;
  salary: number;
  salaryType: 'monthly' | 'daily' | 'hourly';
  joiningDate: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  avatar?: string;
  createdAt: number;
}

export interface DutySchedule {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isOff: boolean;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut?: string; // HH:mm
  scheduledIn?: string;
  scheduledOut?: string;
  hoursWorked?: number;
  overtimeHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'off';
  notes?: string;
  approvedBy?: string;
}

export interface ShiftConflict {
  employeeId: string;
  date: string;
  message: string;
}

export interface Deal {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: 'available' | 'disabled';
  sortOrder: number;
  items: DealComponent[];
  createdAt: number;
}

export interface DealComponent {
  menuItemId: string;
  menuItemName: string;
  qty: number;
  price: number;
}

export interface DealChild {
  id: string;
  name: string;
  qty: number;
  price: number;
  itemNote?: string;
}

export interface DealOrderItem extends OrderItem {
  type: 'deal';
  dealId: string;
  children: DealChild[];
}

export interface Voucher {
  id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  appliesTo: 'all' | 'category' | 'item';
  targetIds: string[];
  createdAt: number;
  createdBy: string;
}

export interface VoucherUsage {
  voucherId: string;
  orderId: string;
  clientId?: string;
  discountApplied: number;
  usedAt: number;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: Voucher;
  discountAmount?: number;
  errorMessage?: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  color: string;
  badge: string;
  perks: string[];
}

export interface LoyaltySettings {
  pointsPerCurrency: number;
  redeemRate: number;
  minRedeem: number;
  tiers: LoyaltyTier[];
}

export interface PromptResult {
  price: number | null;
  qty: number | null;
  text: string | null;
}

export interface DynamicPromptProps {
  title: string;
  message?: string;
  mode: 'price' | 'qty' | 'both' | 'text' | 'password' | 'weight' | 'confirm';
  currentPrice?: number;
  currentQty?: number;
  currentText?: string;
  itemName?: string;
  onConfirm: (result: PromptResult) => void;
  onClose: () => void;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'browser';
  destination: 'bill' | 'kot' | 'advance' | 'report';
  paperWidth: '58mm' | '80mm' | '112mm';
  isDefault: boolean;
  isActive: boolean;
  connectionType: 'usb' | 'network' | 'bluetooth' | 'browser';
  ipAddress?: string;
  port?: number;
  copies: number;
  autocut: boolean;
  beepOnPrint: boolean;
  encoding: 'UTF-8' | 'Windows-1252';
}

export interface PrintJob {
  id: string;
  printerId: string;
  type: 'bill' | 'kot' | 'advance' | 'split';
  orderId: string;
  status: 'pending' | 'printing' | 'done' | 'failed';
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
  copies: number;
}

export interface ReceiptSection {
  id: string;
  type: 'header' | 'divider' | 'items' | 'totals' | 'footer' | 'barcode' | 'qr' | 'custom';
  isVisible: boolean;
  sortOrder: number;
  customContent?: string;
  styles?: Record<string, string>;
}

export interface SearchOptions {
  threshold?: number;
  keys?: string[];
  includeMatches?: boolean;
  maxResults?: number;
  minScore?: number;
  caseSensitive?: boolean;
  exactMatchBoost?: number;
  prefixMatchBoost?: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedField: string;
  matchedValue: string;
  highlightRanges: [number, number][];
}

export type SyncMessageType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_DELETED'
  | 'ORDER_FINALIZED'
  | 'TABLE_STATUS_CHANGED'
  | 'MENU_UPDATED'
  | 'SETTINGS_CHANGED'
  | 'STOCK_UPDATED'
  | 'STOCK_BATCH_UPDATED'
  | 'CLIENT_UPDATED'
  | 'ADVANCE_UPDATED'
  | 'RESERVATION_UPDATED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'SECTION_CHANGED'
  | 'HEARTBEAT'
  | 'TAB_OPENED'
  | 'TAB_CLOSED';

export interface SyncError {
  timestamp: number;
  error: string;
}

export interface SyncMessage {
  type: SyncMessageType;
  payload: any;
  senderId: string;
  timestamp: number;
  tabId: string;
}

export interface TabInfo {
  tabId: string;
  openedAt: number;
  lastHeartbeat: number;
  currentTable: string | null;
  currentUser: string | null;
  activeSection: string;
}

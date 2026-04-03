import React, { useState } from 'react';
import { X, Clock, User, Minus, Plus, ChevronRight, Trash2, Ticket, Award, Star, Scissors, ArrowRightLeft, GitMerge, UserCog, History, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useTableStore } from '../../store/tableStore';
import { useHistoryStore } from '../../store/historyStore';
import { useClientStore } from '../../store/clientStore';
import { useVoucherStore } from '../../store/voucherStore';
import { useAdvancePaymentStore } from '../../store/advancePaymentStore';
import { useToastStore } from '../../store/toastStore';
import { finalizeOrder, formatCurrency } from '../../utils/orderUtils';
import { deductStockForOrder } from '../../utils/inventoryUtils';
import { Payment, HistoryOrder, LedgerEntry, DealOrderItem } from '../../types';
import { usePrinter } from '../../context/PrinterContext';
import { generateBillPreviewHTML } from '../../utils/receiptPreviewUtils';
import { useSettingsStore } from '../../store/settingsStore';
import { useSyncStore } from '../../store/syncStore';
import { usePrompt } from '../../hooks/usePrompt';

import PaymentModal from '../modals/PaymentModal';
import DiscountModal from '../modals/DiscountModal';
import PrintPreviewModal from '../modals/PrintPreviewModal';
import SplitBillModal from '../modals/SplitBillModal';
import SplitPaymentFlow from '../modals/SplitPaymentFlow';
import TransferTableModal from '../modals/TransferTableModal';
import MergeOrderModal from '../modals/MergeOrderModal';
import TransferWaiterModal from '../modals/TransferWaiterModal';
import ReadOnlyBanner from './ReadOnlyBanner';
import { usePermission } from '../../hooks/usePermission';
import { Lock, ShieldAlert, Edit2, StickyNote } from 'lucide-react';

const CartPanel: React.FC = () => {
  const { 
    currentOrder, 
    currentTable, 
    orderId, 
    startTime,
    discount,
    discountType,
    setTable,
    changeQty,
    removeItem,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    lastAddedId,
    clearCart,
    setDiscount,
    appliedAdvanceId,
    appliedAdvanceAmount,
    applyAdvance,
    removeAdvance,
    markAsPrinted,
    customerId,
    customerName,
    customerPhone,
    voucherCode,
    voucherDiscount,
    setVoucher,
    updateItem,
    isReadOnly,
    setReadOnly
  } = useCartStore();

  const currentUser = useAuthStore(state => state.currentUser);
  const setActiveSection = useLayoutStore(state => state.setActiveSection);
  const tableLayout = useLayoutStore(state => state.tableLayout);
  const updateOrder = useTableStore(state => state.updateOrder);
  const removeOrder = useTableStore(state => state.removeOrder);
  const orders = useTableStore(state => state.orders);
  const addToHistory = useHistoryStore(state => state.addToHistory);
  const { clients, updateClient, awardPoints, redeemPoints, getClientTier, getPointsValue, loyaltySettings } = useClientStore();
  const { validateVoucher } = useVoucherStore();
  const showToast = useToastStore(state => state.showToast);
  const { hasPerm } = usePermission();
  const { askBoth, askText, askPIN, askConfirm, askQty, askPrice } = usePrompt();
  const { printBill, printKOT } = usePrinter();
  
  const { propertySettings, billConfig, kotConfig } = useSettingsStore();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [splitConfig, setSplitConfig] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [vCode, setVCode] = useState('');

  const activeClient = clients.find(c => c.id === customerId);
  const clientTier = activeClient ? getClientTier(activeClient.loyaltyPoints) : null;

  const handleApplyVoucher = () => {
    if (!vCode.trim()) return;
    const categoryIds = currentOrder.map(i => i.category).filter(Boolean) as string[];
    const itemIds = currentOrder.map(i => i.id);
    const result = validateVoucher(vCode.trim(), getSubtotal(), categoryIds, itemIds);
    if (result.valid && result.discountAmount) {
      setVoucher(vCode.trim(), result.discountAmount);
      showToast('Voucher Applied!', 'success');
      setVCode('');
    } else {
      showToast(result.errorMessage || 'Invalid Voucher', 'error');
    }
  };

  const handleRedeemPoints = async () => {
    if (!activeClient) return;
    if (activeClient.loyaltyPoints < loyaltySettings.minRedeem) {
      showToast(`Min ${loyaltySettings.minRedeem} points required`, 'error');
      return;
    }

    const maxRedeemable = activeClient.loyaltyPoints;
    const pointsToRedeem = await askQty(
      'Redeem Loyalty Points',
      maxRedeemable,
      activeClient.name
    );

    if (pointsToRedeem && pointsToRedeem > 0) {
      if (pointsToRedeem > maxRedeemable) {
        showToast('Insufficient points', 'error');
        return;
      }
      const discountVal = getPointsValue(pointsToRedeem);
      setVoucher(`LOYALTY-${pointsToRedeem}`, discountVal);
      showToast(`Redeemed ${pointsToRedeem} points for PKR ${discountVal} discount`, 'success');
    }
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { getActiveAdvances } = useAdvancePaymentStore();

  const activeAdvances = customerId ? getActiveAdvances().filter(a => a.clientId === customerId) : [];

  const handleClose = () => {
    if (currentTable) {
      const existingOrder = orders[currentTable];
      if (existingOrder) {
        updateOrder(currentTable, {
          ...existingOrder,
          items: currentOrder,
          subtotal: getSubtotal(),
          total: getTotal(),
          discount,
          discType: discountType
        });
      }
    }
    setTable(null);
    clearCart();
    setReadOnly(false);
    const firstZoneId = tableLayout[0]?.id || 'dinein';
    setActiveSection(firstZoneId);
  };

  const handleSplitComplete = (splits: any[]) => {
    setSplitConfig(splits);
    setIsSplitModalOpen(false);
    setIsSplitPaymentOpen(true);
  };

  const handleSplitAllPaid = (splits: any[]) => {
    if (!currentTable || !currentUser) return;
    
    const existingOrder = orders[currentTable];
    if (!existingOrder) return;

    // Finalize the order as a split bill
    const finalized: HistoryOrder = {
      ...existingOrder,
      items: currentOrder,
      discount,
      discType: discountType,
      total: getTotal(),
      subtotal: getSubtotal(),
      tax: getTaxAmount(),
      taxRate: propertySettings.taxRate,
      cashier: currentUser.name,
      closedAt: Date.now(),
      discountVal: getDiscountAmount(),
      taxVal: getTaxAmount(),
      status: 'completed',
      payments: splits.flatMap(s => s.payments),
      splitBillConfig: {
        type: 'custom', // Simplified for history
        splits: splits
      }
    };

    addToHistory(finalized);
    removeOrder(currentTable);
    useSyncStore.getState().broadcast('ORDER_FINALIZED', { tableName: currentTable, order: finalized });
    handleClose();
    showToast('Split Bill Completed', 'success');
  };

  const handleMinusClick = async (index: number) => {
    const item = currentOrder[index];
    if (!item) return;

    const isPrinted = (item.printedQty || 0) > 0;
    const isReducingPrinted = isPrinted && item.qty <= (item.printedQty || 0);

    const performAction = async () => {
      if (item.qty === 1) {
        const confirmed = await askConfirm(
          'Remove Item?',
          `Are you sure you want to remove "${item.name}" from the order?`
        );
        if (confirmed) {
          removeItem(index);
        }
      } else {
        changeQty(index, -1);
      }
    };

    if (isReducingPrinted) {
      const approved = await askPIN('Manager Approval Required');
      if (approved) {
        performAction();
      }
    } else {
      performAction();
    }
  };

  const handleEditItem = async (index: number) => {
    const item = currentOrder[index];
    if (!item) return;

    const result = await askBoth(`Edit ${item.name}`, item.price, item.qty, item.name);
    if (result) {
      updateItem(index, {
        price: result.price,
        qty: result.qty,
        total: result.price * result.qty
      });
    }
  };

  const handleAddNote = async (index: number) => {
    const item = currentOrder[index];
    if (!item) return;

    const note = await askText(`Note for ${item.name}`, item.itemNote || '', item.name);
    if (note !== null) {
      updateItem(index, { itemNote: note });
    }
  };

  const handleClearOrder = async () => {
    if (!hasPerm('deleteActiveOrder')) {
      setAccessDenied('delete this active order');
      return;
    }
    
    const confirmed = await askConfirm(
      'Clear Order?',
      'This will remove all items and reset the order. This action cannot be undone.'
    );

    if (confirmed) {
      clearCart();
    }
  };

  const handlePrintKOT = () => {
    if (!currentTable || currentOrder.length === 0) return;
    
    const orderData = orders[currentTable];
    if (!orderData) return;

    printKOT({ ...orderData, items: currentOrder });
    
    markAsPrinted();
    showToast('KOT Printed Successfully', 'success');
  };

  const handlePrintBill = () => {
    if (!currentTable || !currentUser) return;
    
    const existingOrder = orders[currentTable];
    if (!existingOrder) return;

    const orderToPrint: HistoryOrder = {
      ...existingOrder,
      items: currentOrder,
      discount,
      discType: discountType,
      total: getTotal(),
      subtotal: getSubtotal(),
      cashier: currentUser.name,
      closedAt: Date.now(),
      discountVal: getDiscountAmount(),
      status: 'completed'
    };

    printBill(orderToPrint);
    showToast('Bill Printed Successfully', 'success');
  };

  const handlePaymentComplete = (payments: Payment[]) => {
    if (!currentTable || !currentUser) return;
    
    const existingOrder = orders[currentTable];
    if (!existingOrder) return;

    const finalized = finalizeOrder(
      {
        ...existingOrder,
        items: currentOrder,
        discount,
        discType: discountType,
        tax: getTaxAmount(),
        taxRate: propertySettings.taxRate,
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined
      },
      payments,
      currentUser
    );

    // Handle Udhaar logic
    const udhaarPayment = payments.find(p => p.method === 'Udhaar');
    if (udhaarPayment && customerId) {
      const client = clients.find(c => c.id === customerId);
      if (client) {
        const outstanding = client.totalOrdered - client.totalPaid;
        const newBalance = outstanding + udhaarPayment.amount;
        
        const newLedgerEntry: LedgerEntry = {
          id: `LED-${Date.now()}`,
          date: Date.now(),
          type: 'order',
          description: `Udhaar Order #${finalized.id}`,
          debit: udhaarPayment.amount,
          credit: 0,
          balance: newBalance,
          orderId: finalized.id
        };
        
        updateClient(customerId, {
          totalOrdered: client.totalOrdered + udhaarPayment.amount,
          ledger: [newLedgerEntry, ...client.ledger]
        });
      }
    }

    // Award Loyalty Points
    if (customerId) {
      awardPoints(customerId, finalized.total);
      
      // If points were redeemed in this order
      if (voucherCode?.startsWith('LOYALTY-')) {
        const points = parseInt(voucherCode.split('-')[1]);
        redeemPoints(customerId, points, finalized.id);
      }
    }

    addToHistory(finalized);
    deductStockForOrder(finalized);
    removeOrder(currentTable);
    
    useSyncStore.getState().broadcast('ORDER_FINALIZED', { tableName: currentTable, order: finalized });

    // Automatically print bill on completion
    printBill(finalized);
    
    showToast(`Order Completed! ${formatCurrency(finalized.total)}`, 'success');
    
    setIsPaymentModalOpen(false);
    setTable(null);
    clearCart();
    const firstZoneId = tableLayout[0]?.id || 'dinein';
    setActiveSection(firstZoneId);
  };

  const isOpen = !!currentTable;

  const previewBillHTML = currentTable ? generateBillPreviewHTML(
    billConfig,
    propertySettings,
    {
      id: orders[currentTable]?.id || 'TEMP',
      table: currentTable,
      items: currentOrder,
      subtotal: getSubtotal(),
      discount: getDiscountAmount(),
      tax: getTaxAmount(),
      taxRate: propertySettings.taxRate,
      total: getTotal(),
      status: 'completed',
      paymentMethod: 'Cash',
      cashier: currentUser?.name || 'Staff',
      createdAt: orders[currentTable]?.startTime || Date.now(),
      closedAt: Date.now(),
      waiter: orders[currentTable]?.waiter || 'Staff'
    }
  ) : '';

  return (
    <>
      <div 
        className={`
          fixed top-[56px] right-0 h-[calc(100vh-56px)] bg-background shadow-2xl z-20
          w-full sm:w-[320px] transition-transform duration-300 ease-in-out
          flex flex-col border-l border-gray-300/50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header Bar */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black">{currentTable?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{isReadOnly ? 'History' : (currentTable || 'No Table')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-80 uppercase tracking-widest">{orderId || 'Ord #------'}</span>
                {customerName && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                      {customerName}
                    </span>
                    {clientTier && (
                      <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded">
                        <span className="text-[10px]">{clientTier.badge}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter" style={{ color: clientTier.color }}>{clientTier.name}</span>
                      </div>
                    )}
                    <button 
                      onClick={handleRedeemPoints}
                      className="text-[8px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded hover:bg-purple-600 transition-all uppercase tracking-tighter"
                    >
                      Redeem {activeClient?.loyaltyPoints || 0} pts
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isReadOnly && (
          <ReadOnlyBanner 
            orderId={orderId || ''} 
            onExit={handleClose} 
          />
        )}

        {/* Action Buttons Row */}
        {!isReadOnly && currentTable && (
          <div className="px-4 py-2 flex gap-2 bg-white/50 border-b border-gray-300/30 shrink-0">
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              disabled={currentOrder.length === 0}
              className="flex-1 py-2 bg-white rounded-xl shadow-neumorphic hover:shadow-neumorphic-inset flex flex-col items-center gap-1 transition-all disabled:opacity-50"
            >
              <ArrowRightLeft size={14} className="text-purple-600" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Transfer</span>
            </button>
            <button 
              onClick={() => setIsMergeModalOpen(true)}
              disabled={currentOrder.length === 0}
              className="flex-1 py-2 bg-white rounded-xl shadow-neumorphic hover:shadow-neumorphic-inset flex flex-col items-center gap-1 transition-all disabled:opacity-50"
            >
              <GitMerge size={14} className="text-blue-600" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Merge</span>
            </button>
            <button 
              onClick={() => setIsSplitModalOpen(true)}
              disabled={currentOrder.length === 0}
              className="flex-1 py-2 bg-white rounded-xl shadow-neumorphic hover:shadow-neumorphic-inset flex flex-col items-center gap-1 transition-all disabled:opacity-50"
            >
              <Scissors size={14} className="text-orange-600" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Split</span>
            </button>
            <button 
              onClick={handleClearOrder}
              disabled={currentOrder.length === 0}
              className="flex-1 py-2 bg-white rounded-xl shadow-neumorphic hover:shadow-neumorphic-inset flex flex-col items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 size={14} className="text-red-600" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Clear</span>
            </button>
          </div>
        )}

        {/* Order Meta Row */}
        <div className="px-4 py-2 flex gap-4 bg-white/30 border-b border-gray-300/30 shrink-0">
          <div className="flex items-center gap-1.5 text-text-secondary text-[10px] font-medium uppercase">
            <Clock size={12} className="text-primary" />
            <span>{formatTime(startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary text-[10px] font-medium uppercase">
            <User size={12} className="text-primary" />
            <button 
              onClick={() => !isReadOnly && setIsWaiterModalOpen(true)}
              className={`hover:text-primary transition-colors flex items-center gap-1 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span>{currentUser?.name || 'Waiter'}</span>
              {!isReadOnly && <UserCog size={10} />}
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="px-4 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-gray-300/30 shrink-0">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-3 text-center">Qty</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {!currentTable ? (
            <div className="h-full flex items-center justify-center text-text-secondary italic text-sm">
              Select a table to start
            </div>
          ) : currentOrder.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary text-sm text-center p-6">
              <p className="italic mb-2 opacity-60">Cart is empty</p>
              <p className="text-xs">Add items from the menu section</p>
            </div>
          ) : (
            currentOrder.map((item, idx) => {
              const isNew = item.tempId === lastAddedId;
              const isPrinted = (item.printedQty || 0) > 0;
              const isDeal = item.type === 'deal';
              const dealItem = isDeal ? item as DealOrderItem : null;

              return (
                <div 
                  key={item.tempId || `${item.id}-${idx}`} 
                  className={`space-y-1 rounded-lg transition-all ${isNew ? 'animate-pulse-green' : ''}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center text-sm p-1 group">
                  <div className={`col-span-5 font-medium leading-tight break-words flex items-start gap-1 ${isDeal ? 'text-purple-600 italic' : ''}`}>
                    {isPrinted && <Lock size={10} className="text-primary shrink-0 mt-1" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isDeal && <span className="mr-1">🔥</span>}
                        <span 
                          className={`transition-colors ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:text-primary'}`}
                          onClick={() => !isReadOnly && handleEditItem(idx)}
                        >
                          {item.name}
                        </span>
                        {!isReadOnly && (
                          <button 
                            onClick={() => handleAddNote(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-purple-600"
                            title="Add Note"
                          >
                            <StickyNote size={12} />
                          </button>
                        )}
                      </div>
                      {item.itemNote && (
                        <div className="text-[10px] text-text-secondary italic font-normal mt-0.5">
                          "{item.itemNote}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-xs text-text-secondary">
                    {!isDeal && item.price}
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-2">
                    {!isReadOnly && (
                      <button 
                        onClick={() => handleMinusClick(idx)}
                        className="w-6 h-6 rounded-full shadow-neumorphic flex items-center justify-center bg-background active:shadow-neumorphic-inset transition-all"
                      >
                        <Minus size={12} />
                      </button>
                    )}
                    <span className="font-bold min-w-[12px] text-center">{item.qty}</span>
                    {!isReadOnly && (
                      <button 
                        onClick={() => changeQty(idx, 1)}
                        className="w-6 h-6 rounded-full shadow-neumorphic flex items-center justify-center bg-background active:shadow-neumorphic-inset transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  <div className="col-span-2 text-right font-bold text-primary">
                    {item.total}
                  </div>
                </div>

                {/* Deal Children */}
                {dealItem?.children.map((child, cIdx) => (
                  <div key={cIdx} className="grid grid-cols-12 gap-2 items-center text-[10px] pl-6 italic text-gray-500 py-0.5">
                    <div className="col-span-12 flex items-center gap-1">
                      <span>↳</span>
                      <span>{child.name} x{child.qty}</span>
                    </div>
                  </div>
                ))}

                {/* Modifiers */}
                {!isDeal && item.modifiers?.map((mod, mIdx) => (
                  <div key={mIdx} className="grid grid-cols-12 gap-2 items-center text-[10px] pl-4 border-l-2 border-primary-light ml-1 py-0.5">
                    <div className="col-span-5 flex items-center gap-1 text-text-secondary">
                      <ChevronRight size={10} className="text-primary" />
                      <span>{mod.optionName}</span>
                    </div>
                    <div className="col-span-2 text-right text-success font-medium">
                      +{mod.price}
                    </div>
                    <div className="col-span-3 text-center opacity-60">
                      x{mod.qty || 1}
                    </div>
                    <div className="col-span-2 text-right opacity-60">
                      {mod.price * (mod.qty || 1)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

        {/* Advance Section */}
        {customerId && activeAdvances.length > 0 && !isReadOnly && (
          <div className="px-4 py-3 bg-purple-50/50 border-t border-purple-100 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={14} className="text-purple-600" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-700">Available Advances</h4>
            </div>
            <div className="space-y-2">
              {activeAdvances.map(adv => (
                <div key={adv.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                  <div>
                    <div className="text-[10px] font-bold text-gray-700">{adv.type.toUpperCase()} DEPOSIT</div>
                    <div className="text-[12px] font-black text-purple-600">Rs. {adv.amount}</div>
                  </div>
                  {appliedAdvanceId === adv.id ? (
                    <button 
                      onClick={() => removeAdvance()}
                      className="text-[10px] font-black text-red-500 uppercase tracking-tighter hover:underline"
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      onClick={() => applyAdvance(adv.id, adv.amount)}
                      disabled={!!appliedAdvanceId}
                      className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-all uppercase tracking-tighter"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Totals Section */}
        <div className="p-4 bg-white/50 border-t border-gray-300/50 space-y-3 shrink-0">
          {/* Voucher Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={vCode}
                onChange={(e) => setVCode(e.target.value.toUpperCase())}
                placeholder="VOUCHER CODE"
                className="w-full bg-white/50 border-none rounded-xl py-2 pl-9 pr-3 text-[10px] font-black focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <button 
              onClick={handleApplyVoucher}
              className="bg-purple-600 text-white px-3 rounded-xl hover:bg-purple-700 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-medium">Rs. {getSubtotal()}</span>
            </div>
            {(getDiscountAmount() > 0) && (
              <div className="flex justify-between text-text-secondary">
                <div className="flex items-center gap-1">
                  <span>Discount</span>
                  {voucherCode && <span className="text-[8px] bg-purple-100 text-purple-600 px-1 rounded font-black uppercase">{voucherCode}</span>}
                </div>
                <span className="font-medium text-danger">- Rs. {getDiscountAmount()}</span>
              </div>
            )}
            {getTaxAmount() > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Tax ({propertySettings.taxRate}%)</span>
                <span className="font-medium">Rs. {getTaxAmount()}</span>
              </div>
            )}
            {appliedAdvanceAmount > 0 && (
              <div className="flex justify-between text-purple-600 font-bold">
                <span>Advance Applied</span>
                <span>- Rs. {appliedAdvanceAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-1">
              <span className="font-bold text-text-primary">Total</span>
              <span className="text-2xl font-black text-primary leading-none">
                Rs. {getTotal()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handlePrintKOT}
              disabled={isReadOnly}
              className="bg-orange-500 text-white font-bold py-2 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              KOT
            </button>
            <div className="relative group">
              <button 
                onClick={handlePrintBill}
                className="w-full bg-blue-500 text-white font-bold py-2 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                Bill
              </button>
              <button 
                onClick={() => setIsPreviewModalOpen(true)}
                className="absolute -top-2 -right-1 bg-white text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md border border-primary/20 hover:bg-primary hover:text-white transition-all"
              >
                Preview
              </button>
            </div>
            <button 
              onClick={() => {
                if (!hasPerm('applyDiscount')) {
                  setAccessDenied('apply discounts');
                  return;
                }
                setIsDiscountModalOpen(true);
              }}
              disabled={isReadOnly}
              className="bg-gray-500 text-white font-bold py-2 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              Discount
            </button>
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={isReadOnly}
              className="bg-success text-white font-bold py-2 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              Pay
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isSplitModalOpen && currentTable && orders[currentTable] && (
          <SplitBillModal 
            order={{ ...orders[currentTable], items: currentOrder }}
            onComplete={handleSplitComplete}
            onClose={() => setIsSplitModalOpen(false)}
          />
        )}

        {isSplitPaymentOpen && currentTable && orders[currentTable] && splitConfig && (
          <SplitPaymentFlow 
            order={{ ...orders[currentTable], items: currentOrder }}
            splits={splitConfig}
            onAllPaid={handleSplitAllPaid}
            onClose={() => setIsSplitPaymentOpen(false)}
          />
        )}

        {isTransferModalOpen && currentTable && (
          <TransferTableModal 
            currentTable={currentTable}
            onTransfer={(newTable) => setTable(newTable)}
            onClose={() => setIsTransferModalOpen(false)}
          />
        )}

        {isMergeModalOpen && currentTable && (
          <MergeOrderModal 
            currentTable={currentTable}
            onMerge={(targetTable) => setTable(targetTable)}
            onClose={() => setIsMergeModalOpen(false)}
          />
        )}

        {isWaiterModalOpen && currentTable && orders[currentTable] && (
          <TransferWaiterModal 
            currentTable={currentTable}
            currentWaiter={orders[currentTable].waiter}
            onTransfer={() => {}}
            onClose={() => setIsWaiterModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Access Denied Modal */}
      {accessDenied && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#E0E5EC] rounded-[32px] p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-2">Access Denied</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              You do not have permission to {accessDenied}.
            </p>
            <button
              onClick={() => setAccessDenied(null)}
              className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-neumorphic hover:bg-purple-700 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {isPaymentModalOpen && currentTable && orders[currentTable] && (
        <PaymentModal 
          order={{
            ...orders[currentTable],
            items: currentOrder,
            discount,
            discType: discountType,
            total: getTotal(),
            subtotal: getSubtotal()
          }}
          onComplete={handlePaymentComplete}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {isDiscountModalOpen && (
        <DiscountModal 
          subtotal={getSubtotal()}
          currentDiscount={discount}
          currentDiscType={discountType}
          onApply={(amt, type) => {
            setDiscount(amt, type);
            setIsDiscountModalOpen(false);
          }}
          onClose={() => setIsDiscountModalOpen(false)}
        />
      )}

      {isPreviewModalOpen && (
        <PrintPreviewModal 
          html={previewBillHTML}
          onPrint={() => {
            handlePrintBill();
            setIsPreviewModalOpen(false);
          }}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </>
  );
};

export default CartPanel;

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Printer, ChevronRight, Banknote, CreditCard, Wallet, User, Search, AlertCircle } from 'lucide-react';
import { Order, SplitPortion, Payment, Client, PropertySettings } from '../../types';
import { formatCurrency } from '../../utils/reportUtils';
import { usePaymentStore } from '../../store/paymentStore';
import { useClientStore } from '../../store/clientStore';
import { useToastStore } from '../../store/toastStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { printSplitBillPortion } from '../../utils/printUtils';

interface SplitPaymentFlowProps {
  order: Order;
  splits: SplitPortion[];
  property: PropertySettings;
  onAllPaid: (updatedSplits: SplitPortion[]) => void;
  onClose: () => void;
}

const SplitPaymentFlow: React.FC<SplitPaymentFlowProps> = ({ order, splits, property, onAllPaid, onClose }) => {
  const { billConfig, propertySettings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSplits, setLocalSplits] = useState<SplitPortion[]>(splits);
  const currentPortion = localSplits[currentIndex];
  
  const { 
    tempPayments, 
    addPayment, 
    removePayment, 
    getTotalPaid, 
    getBalance, 
    clearPayments 
  } = usePaymentStore();

  const { clients, searchClients } = useClientStore();
  const showToast = useToastStore(state => state.showToast);

  const [activeMethod, setActiveMethod] = useState<string>('Cash');
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Cash', 'Udhaar', 'Account', 'Advance']);
  
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const portionTotal = currentPortion.customAmount || currentPortion.items.reduce((acc, i) => acc + i.itemTotal, 0);

  const cashierName = currentUser?.name || 'Cashier';

  useEffect(() => {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.paymentMethods && Array.isArray(parsed.paymentMethods)) {
          setPaymentMethods(parsed.paymentMethods);
        }
      } catch (e) {
        console.error('Failed to load payment methods');
      }
    }
    
    setAmountInput(portionTotal.toString());
    return () => clearPayments();
  }, [portionTotal, clearPayments]);

  useEffect(() => {
    if (clientSearch.length >= 2) {
      setSearchResults(searchClients(clientSearch));
    } else {
      setSearchResults([]);
    }
  }, [clientSearch, searchClients]);

  const handleAddPayment = () => {
    const amount = parseFloat(amountInput) || 0;
    if (amount > 0) {
      if (activeMethod === 'Udhaar') {
        if (!selectedClient) {
          showToast('Must link a Client Profile for Udhaar', 'error');
          return;
        }
        if (selectedClient.isBlocked) {
          showToast('This client is BLOCKED', 'error');
          return;
        }
      }
      addPayment({ method: activeMethod, amount });
      setAmountInput(getBalance(portionTotal).toString());
    }
  };

  const handleMarkAsPaid = () => {
    const balance = getBalance(portionTotal);
    if (balance > 0) {
      showToast(`Remaining balance: ${formatCurrency(balance)}`, 'error');
      return;
    }

    const updatedSplits = [...localSplits];
    updatedSplits[currentIndex] = {
      ...currentPortion,
      isPaid: true,
      payments: [...tempPayments]
    };
    setLocalSplits(updatedSplits);

    if (currentIndex < localSplits.length - 1) {
      setCurrentIndex(currentIndex + 1);
      clearPayments();
      setActiveMethod('Cash');
      setClientSearch('');
      setSelectedClient(null);
    } else {
      onAllPaid(updatedSplits);
    }
  };

  const handlePrintPortion = () => {
    printSplitBillPortion(order, currentPortion, currentIndex + 1, localSplits.length, billConfig, propertySettings);
    showToast('Printing partial receipt...', 'success');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#E4E3E0] rounded-[40px] shadow-2xl w-full max-w-[700px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 border-b border-black/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Split Payment</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Paying {currentIndex + 1} of {localSplits.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
              <X className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2 justify-center">
            {localSplits.map((_, i) => (
              <div 
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentIndex ? 'w-8 bg-green-500' : i < currentIndex ? 'w-2 bg-green-200' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-neumorphic text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{currentPortion.label}</p>
            <p className="text-5xl font-black text-green-600 tracking-tighter">{formatCurrency(portionTotal)}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left: Payment Methods */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method}
                    onClick={() => setActiveMethod(method)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                      activeMethod === method 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {method === 'Cash' && <Banknote className="w-6 h-6" />}
                    {method === 'Udhaar' && <User className="w-6 h-6" />}
                    {method === 'Account' && <CreditCard className="w-6 h-6" />}
                    {method === 'Advance' && <Wallet className="w-6 h-6" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                  </button>
                ))}
              </div>

              {activeMethod === 'Udhaar' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search Client..."
                      className="w-full bg-white border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                      {searchResults.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setClientSearch(client.name);
                            setSearchResults([]);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-none"
                        >
                          <div>
                            <p className="text-sm font-black text-gray-900 uppercase">{client.name}</p>
                            <p className="text-[10px] font-bold text-gray-500">{client.phone}</p>
                          </div>
                          {client.isBlocked && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Linked Client</p>
                        <p className="text-sm font-black text-gray-900 uppercase">{selectedClient.name}</p>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Amount & Payments */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount</h3>
              <div className="space-y-4">
                <input 
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-white shadow-neumorphic-inset border-none rounded-3xl py-6 px-8 text-3xl font-black text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <button 
                  onClick={handleAddPayment}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
                >
                  Add Payment
                </button>
              </div>

              <div className="space-y-2">
                {tempPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-gray-600">{p.method}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-gray-900">{formatCurrency(p.amount)}</span>
                      <button onClick={() => removePayment(i)} className="text-gray-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-black/5 bg-white/30 flex gap-4">
          <button 
            onClick={handlePrintPortion}
            className="flex-1 py-6 bg-blue-500 text-white rounded-[32px] font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Receipt
          </button>
          <button 
            onClick={handleMarkAsPaid}
            className="flex-[2] py-6 bg-green-500 text-white rounded-[32px] font-black uppercase tracking-widest text-xs shadow-lg shadow-green-200 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            Mark as Paid
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SplitPaymentFlow;

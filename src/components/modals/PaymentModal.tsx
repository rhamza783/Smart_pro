import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, CheckCircle2, Banknote, CreditCard, Wallet, History, User, Search, AlertCircle } from 'lucide-react';
import { Order, Payment, Client } from '../../types';
import { usePaymentStore } from '../../store/paymentStore';
import { useClientStore } from '../../store/clientStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/orderUtils';
import { toast } from 'sonner';

interface PaymentModalProps {
  order: Order;
  onComplete: (payments: Payment[]) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onComplete, onClose }) => {
  const { 
    tempPayments, 
    addPayment, 
    removePayment, 
    getTotalPaid, 
    getBalance, 
    clearPayments 
  } = usePaymentStore();

  const { clients, searchClients } = useClientStore();
  const { customerId, appliedAdvanceAmount } = useCartStore();
  const customerName = useCartStore(state => state.customerName);

  const [activeMethod, setActiveMethod] = useState<string>('Cash');
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Cash', 'Udhaar', 'Account', 'Advance']);
  
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (customerId) {
      const client = clients.find(c => c.id === customerId);
      if (client) setSelectedClient(client);
    }
  }, [customerId, clients]);

  useEffect(() => {
    if (clientSearch.length >= 2) {
      setSearchResults(searchClients(clientSearch));
    } else {
      setSearchResults([]);
    }
  }, [clientSearch, searchClients]);
  
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    // Set initial amount to balance
    setAmountInput(getBalance(order.total).toString());
    
    return () => clearPayments();
  }, [order.total, getBalance, clearPayments]);

  const handleQuickAmount = (amount: number) => {
    setAmountInput(amount.toString());
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const handleAddPayment = () => {
    const amount = parseFloat(amountInput) || 0;
    if (amount > 0) {
      if (activeMethod === 'Udhaar') {
        if (!selectedClient) {
          toast.error('Must link a Client Profile for Udhaar');
          return;
        }
        if (selectedClient.isBlocked) {
          toast.error('This client is BLOCKED');
          return;
        }
      }
      addPayment({ method: activeMethod, amount });
      setAmountInput(getBalance(order.total).toString());
    }
  };

  const handleComplete = () => {
    const udhaarPayment = tempPayments.find(p => p.method === 'Udhaar');
    if (udhaarPayment && !selectedClient) {
      toast.error('Must link a Client Profile for Udhaar');
      return;
    }
    onComplete(tempPayments);
  };

  const totalPaid = getTotalPaid();
  const balance = getBalance(order.total);
  const isOverpaid = balance < 0;
  const canComplete = totalPaid >= order.total;

  const quickAmounts = [
    order.total,
    Math.ceil(order.total / 100) * 100,
    Math.ceil(order.total / 500) * 500,
    Math.ceil(order.total / 1000) * 1000
  ].filter((v, i, a) => a.indexOf(v) === i); // Unique values

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-background w-full max-w-[480px] rounded-3xl p-6 shadow-2xl animate-scale-in relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary">Payment</h2>
          <p className="text-sm text-text-secondary">{order.table} — Order #{order.id}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {/* Total Due Box */}
          <div className="bg-background shadow-neumorphic-inset rounded-3xl p-6 text-center relative overflow-hidden">
            {appliedAdvanceAmount > 0 && (
              <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white text-[8px] font-black uppercase tracking-[0.2em] py-1 animate-pulse">
                Advance Credit Applied
              </div>
            )}
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1 block mt-2">Total Due</span>
            <span className="text-4xl font-black text-primary">{formatCurrency(order.total)}</span>
            {appliedAdvanceAmount > 0 && (
              <div className="text-[10px] font-bold text-purple-600 mt-2">
                - Rs. {appliedAdvanceAmount} Advance Credit
              </div>
            )}
          </div>

          {order.total === 0 && appliedAdvanceAmount > 0 && (
            <div className="p-6 rounded-3xl bg-success/10 border-2 border-dashed border-success/30 text-center animate-in zoom-in duration-300">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <h3 className="text-sm font-black text-success uppercase tracking-widest">Order Fully Covered</h3>
              <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase">By Advance Payment Credit</p>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setActiveMethod(method)}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                    activeMethod === method 
                      ? 'bg-primary text-white shadow-lg scale-105' 
                      : 'bg-background shadow-neumorphic text-text-secondary hover:text-primary'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Udhaar Client Selection */}
          {activeMethod === 'Udhaar' && (
            <div className="space-y-4 p-6 rounded-3xl bg-background shadow-neumorphic-inset animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Link Client for Udhaar</label>
                {selectedClient && (
                  <button onClick={() => setSelectedClient(null)} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Change</button>
                )}
              </div>

              {selectedClient ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-neumorphic">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary">{selectedClient.name}</p>
                      <p className="text-[10px] font-bold text-text-secondary">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Outstanding</p>
                    <p className={`text-sm font-black ${selectedClient.isBlocked ? 'text-red-500' : 'text-primary'}`}>
                      {formatCurrency(selectedClient.totalOrdered - selectedClient.totalPaid)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="text"
                    placeholder="Search client by name or phone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background shadow-neumorphic-inset text-sm font-medium focus:outline-none"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-2xl shadow-2xl z-20 max-h-48 overflow-y-auto border border-gray-300/20">
                      {searchResults.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch('');
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-4 hover:bg-primary/5 transition-all flex justify-between items-center border-b border-gray-300/10 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-black text-primary">{c.name}</p>
                            <p className="text-[10px] font-bold text-text-secondary">{c.phone}</p>
                          </div>
                          {c.isBlocked && <span className="text-[8px] font-black text-red-500 uppercase">Blocked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedClient?.isBlocked && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500">
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-black uppercase">This client is BLOCKED. Cannot record Udhaar.</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Amounts */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Quick Amounts</label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    amt === order.total 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-background shadow-neumorphic text-text-secondary'
                  }`}
                >
                  {amt === order.total ? `${amt} (Exact)` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="bg-background shadow-neumorphic-inset rounded-2xl px-4 py-4 flex items-center gap-3">
              <Banknote size={24} className="text-text-secondary" />
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="bg-transparent w-full outline-none text-2xl font-black text-text-primary"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex justify-between px-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isOverpaid ? 'text-success' : 'text-danger'}`}>
                {isOverpaid ? 'Change' : 'Balance'}: {formatCurrency(Math.abs(balance))}
              </span>
              <button 
                onClick={handleAddPayment}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Plus size={14} />
                Add Payment
              </button>
            </div>
          </div>

          {/* Payment Rows */}
          {tempPayments.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-300/30">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Added Payments</label>
              {tempPayments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 shadow-sm border border-gray-300/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary px-2 py-0.5 rounded-full">
                      {p.method}
                    </span>
                    <span className="font-bold text-text-primary">{formatCurrency(p.amount)}</span>
                  </div>
                  <button 
                    onClick={() => removePayment(idx)}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex justify-between px-2 pt-2">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Paid</span>
                <span className="text-sm font-black text-primary">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={!canComplete}
          className={`w-full mt-8 py-5 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
            canComplete ? 'bg-success hover:opacity-90' : 'bg-gray-400 cursor-not-allowed grayscale'
          }`}
        >
          <CheckCircle2 size={24} />
          <span>Complete Order</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;

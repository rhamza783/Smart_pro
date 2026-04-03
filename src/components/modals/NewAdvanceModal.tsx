import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  PlusCircle, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  CreditCard, 
  Banknote, 
  Wallet, 
  Search,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed
} from 'lucide-react';
import { useAdvancePaymentStore } from '../../store/advancePaymentStore';
import { useClientStore } from '../../store/clientStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useReservationStore } from '../../store/reservationStore';
import { formatCurrency } from '../../utils/reportUtils';
import { printAdvanceReceipt } from '../../utils/printUtils';
import { format } from 'date-fns';
import AutocompleteInput from '../ui/AutocompleteInput';
import HighlightText from '../ui/HighlightText';
import { Client } from '../../types';
import { toast } from 'sonner';

interface NewAdvanceModalProps {
  onClose: () => void;
  prefillClient?: Client;
  prefillReservation?: { id: string; tableName: string; date: string; startTime: string };
}

export const NewAdvanceModal: React.FC<NewAdvanceModalProps> = ({ 
  onClose, 
  prefillClient,
  prefillReservation 
}) => {
  const { addAdvance } = useAdvancePaymentStore();
  const { clients, addLedgerEntry } = useClientStore();
  const { currentUser } = useAuthStore();
  const { paymentMethods, propertySettings } = useSettingsStore();
  const { reservations } = useReservationStore();

  const [clientMode, setClientMode] = useState<'search' | 'manual'>(prefillClient ? 'manual' : 'search');
  const [selectedClient, setSelectedClient] = useState<Client | null>(prefillClient || null);
  const [manualName, setManualName] = useState(prefillClient?.name || '');
  const [manualPhone, setManualPhone] = useState(prefillClient?.phone || '');

  const [type, setType] = useState<'reservation' | 'catering' | 'general'>(prefillReservation ? 'reservation' : 'general');
  const [selectedResId, setSelectedResId] = useState<string>(prefillReservation?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || 'Cash');
  const [reference, setReference] = useState(prefillReservation ? `Deposit for Table ${prefillReservation.tableName} on ${prefillReservation.date}` : '');
  const [expiryDate, setExpiryDate] = useState('');

  const clientReservations = useMemo(() => {
    if (!selectedClient?.id) return [];
    return reservations.filter(r => 
      r.clientId === selectedClient.id && 
      r.status === 'confirmed' &&
      new Date(r.date).getTime() >= new Date().setHours(0,0,0,0)
    );
  }, [selectedClient, reservations]);

  const handleSave = () => {
    const finalAmount = parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const clientName = clientMode === 'search' ? selectedClient?.name : manualName;
    const clientPhone = clientMode === 'search' ? selectedClient?.phone : manualPhone;

    if (!clientName || !clientPhone) {
      toast.error('Please provide client name and phone');
      return;
    }

    const advance = addAdvance({
      type,
      clientId: selectedClient?.id,
      clientName,
      clientPhone,
      amount: finalAmount,
      paymentMethod,
      referenceNote: reference,
      reservationId: type === 'reservation' ? selectedResId : undefined,
      status: 'active',
      createdBy: currentUser?.name || 'Staff',
      expiryDate: expiryDate || undefined
    });

    if (selectedClient?.id) {
      addLedgerEntry(selectedClient.id, {
        type: 'payment',
        credit: finalAmount,
        debit: 0,
        description: `Advance Payment — ${reference || type.toUpperCase()}`,
        orderId: advance.id
      });
    }

    toast.success(`Advance of ${formatCurrency(finalAmount)} recorded for ${clientName}`);
    
    // Print receipt
    printAdvanceReceipt(advance, propertySettings);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#E0E5EC] rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Record Advance</h2>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Deposit or Prepayment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
          {/* Client Section */}
          <div className="bg-white p-6 rounded-[32px] shadow-neumorphic space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Client Information
              </h3>
              <button 
                onClick={() => setClientMode(clientMode === 'search' ? 'manual' : 'search')}
                className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline"
              >
                {clientMode === 'search' ? 'Manual Entry' : 'Search CRM'}
              </button>
            </div>

            {clientMode === 'search' ? (
              <AutocompleteInput
                value={selectedClient?.name || ''}
                onChange={(val) => {
                  if (!val) setSelectedClient(null);
                }}
                onSelect={(client) => setSelectedClient(client)}
                items={clients}
                searchFields={['name', 'phone']}
                renderItem={(client, query, highlightRanges) => (
                  <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-500 font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-700">
                          <HighlightText text={client.name} query={query} highlightRanges={highlightRanges} />
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{client.phone}</div>
                      </div>
                    </div>
                  </div>
                )}
                placeholder="Search client by name or phone..."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Name</label>
                  <input 
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Phone</label>
                  <input 
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="bg-white p-6 rounded-[32px] shadow-neumorphic space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Advance Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'reservation', label: 'Reservation', icon: Calendar },
                  { id: 'catering', label: 'Catering', icon: UtensilsCrossed },
                  { id: 'general', label: 'General', icon: Wallet }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      type === t.id 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'bg-[#F0F2F5] text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {type === 'reservation' && selectedClient?.id && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Link Reservation</label>
                <select 
                  value={selectedResId}
                  onChange={(e) => {
                    const res = clientReservations.find(r => r.id === e.target.value);
                    setSelectedResId(e.target.value);
                    if (res) setReference(`Deposit for Table ${res.tableName} on ${res.date}`);
                  }}
                  className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
                >
                  <option value="">Select upcoming reservation...</option>
                  {clientReservations.map(res => (
                    <option key={res.id} value={res.id}>
                      Table {res.tableName} • {res.date} • {res.startTime}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount (PKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">PKR</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 pl-12 pr-4 text-lg font-black shadow-neumorphic-inset text-purple-600"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
                >
                  {paymentMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reference Note</label>
              <input 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Eid party deposit"
                className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Expiry Date (Optional)</label>
              <input 
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[#F0F2F5] border-none rounded-xl py-3 px-4 text-sm font-bold shadow-neumorphic-inset"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 uppercase">
                  {formatCurrency(parseFloat(amount) || 0)} Advance
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Will be deducted from next order
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-black/5">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all"
          >
            Record Advance Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react';
import { Client } from '../../types';
import { formatCurrency } from '../../utils/reportUtils';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  client: Client;
  onConfirm: (amount: number, method: string) => void;
  onClose: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ client, onConfirm, onClose }) => {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('Cash');
  const outstanding = client.totalOrdered - client.totalPaid;

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    onConfirm(numAmount, method);
    onClose();
  };

  const methods = [
    { id: 'Cash', icon: Banknote },
    { id: 'Bank Transfer', icon: Landmark },
    { id: 'Card', icon: CreditCard },
    { id: 'JazzCash', icon: Smartphone },
    { id: 'EasyPaisa', icon: Smartphone },
  ];

  const newBalance = outstanding - (parseFloat(amount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#E0E5EC] w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Record Payment</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="text-center p-6 rounded-3xl bg-[#E0E5EC] shadow-neumorphic-inset">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Client Name</p>
            <p className="text-xl font-black text-primary mb-4">{client.name}</p>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Outstanding Balance</p>
            <p className="text-3xl font-black text-red-500">{formatCurrency(outstanding)}</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black text-text-secondary uppercase tracking-widest px-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    method === m.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-[#E0E5EC] shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset'
                  }`}
                >
                  <m.icon size={18} />
                  <span>{m.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Payment Amount</p>
              <button
                onClick={() => setAmount(outstanding.toString())}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-primary">PKR</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-20 pr-6 py-6 rounded-3xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-black text-3xl text-primary"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary">New Balance after payment:</span>
            <span className={`text-sm font-black ${newBalance <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(Math.max(0, newBalance))}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic font-bold text-text-secondary hover:shadow-neumorphic-inset transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold shadow-lg hover:opacity-90 transition-all"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;

import React, { useState } from 'react';
import { X, User, Phone, MapPin, ShieldAlert } from 'lucide-react';
import { Customer, Client } from '../../types';
import { useClientStore } from '../../store/clientStore';
import AutocompleteInput from '../ui/AutocompleteInput';
import HighlightText from '../ui/HighlightText';

interface CustomerModalProps {
  onConfirm: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ onConfirm, onClose }) => {
  const { clients } = useClientStore();
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    address: ''
  });

  const handleSelectClient = (client: Client) => {
    setFormData({
      id: client.id,
      name: client.name,
      phone: client.phone,
      address: client.address || ''
    });
  };

  const handleConfirm = () => {
    onConfirm(formData);
  };

  const handleSkip = () => {
    onConfirm({ id: '', name: '', phone: '', address: '' });
  };

  const renderClientItem = (client: Client, query: string, highlightRanges: [number, number][]) => {
    const balance = client.totalOrdered - client.totalPaid;
    return (
      <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-500 font-bold">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-700">
              <HighlightText text={client.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-xs text-gray-400">
              <HighlightText text={client.phone} query={query} highlightRanges={highlightRanges} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {balance > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
              PKR {balance} due
            </span>
          )}
          {client.isBlocked && (
            <span className="text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
              <ShieldAlert size={8} /> BLOCKED
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-[420px] rounded-3xl p-6 shadow-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">Customer Info</h2>
          <p className="text-sm text-text-secondary">Fill in customer details (optional)</p>
        </div>

        <div className="space-y-6">
          {/* Phone Input with Autocomplete */}
          <div className="relative">
            <AutocompleteInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              onSelect={handleSelectClient}
              items={clients}
              searchFields={['phone', 'name']}
              renderItem={renderClientItem}
              placeholder="Search by phone or name..."
              icon={<Phone size={18} />}
              autoFocus
            />
          </div>

          {/* Name Input */}
          <div className="flex items-center gap-3 bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3">
            <User size={18} className="text-text-secondary" />
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-transparent w-full outline-none text-text-primary"
            />
          </div>

          {/* Address Input */}
          <div className="flex items-start gap-3 bg-background shadow-neumorphic-inset rounded-2xl px-4 py-3">
            <MapPin size={18} className="text-text-secondary mt-1" />
            <textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="bg-transparent w-full outline-none text-text-primary resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-4 rounded-2xl font-bold text-text-secondary bg-background shadow-neumorphic hover:text-primary transition-all active:shadow-neumorphic-inset"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 rounded-2xl font-bold text-white bg-primary shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;

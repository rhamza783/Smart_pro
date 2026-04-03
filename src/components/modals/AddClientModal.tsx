import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Building, FileText } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import { toast } from 'sonner';

interface AddClientModalProps {
  onClose: () => void;
  onSave?: (client: any) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSave }) => {
  const { clients, addClient } = useClientStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required');
      return;
    }

    // Phone uniqueness validation
    const exists = clients.some((c) => c.phone === formData.phone);
    if (exists) {
      toast.error('A client with this phone number already exists');
      return;
    }

    const newClient = addClient(formData);
    toast.success(`Client ${formData.name} added successfully`);
    if (onSave) onSave(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#E0E5EC] w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Add New Client</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Full Name *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="tel"
                placeholder="Phone Number *"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary"
              />
            </div>

            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary"
              />
            </div>

            <div className="relative">
              <FileText className="absolute left-4 top-4 text-text-secondary" size={18} />
              <textarea
                placeholder="Notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic-inset focus:outline-none font-bold text-primary resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-[#E0E5EC] shadow-neumorphic font-bold text-text-secondary hover:shadow-neumorphic-inset transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 transition-all"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useToastStore } from '../../store/toastStore';
import { Supplier } from '../../types';

interface AddSupplierModalProps {
  onClose: () => void;
  editData?: Supplier;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, editData }) => {
  const { addSupplier, updateSupplier } = usePurchaseStore();
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    archived: false
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        phone: editData.phone,
        email: editData.email || '',
        address: editData.address || '',
        notes: editData.notes || '',
        archived: editData.archived
      });
    }
  }, [editData]);

  const handleSave = () => {
    if (!formData.name) {
      showToast('Supplier name is required', 'error');
      return;
    }

    if (editData) {
      updateSupplier(editData.id, formData);
      showToast('Supplier updated successfully', 'success');
    } else {
      addSupplier(formData);
      showToast('Supplier added successfully', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-gray-300/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{editData ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Register a new vendor for your inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Supplier Name</label>
            <div className="relative">
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fresh Poultry Ltd."
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Phone</label>
              <div className="relative">
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Email (Optional)</label>
              <div className="relative">
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendor@example.com"
                  className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Address</label>
            <textarea 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full business address..."
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any other details..."
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="p-8 border-t border-gray-300/30 bg-gray-50/50 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Save size={20} />
            {editData ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSupplierModal;

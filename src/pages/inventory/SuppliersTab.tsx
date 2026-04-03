import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Archive, Phone, Mail, MapPin, FileText, UserPlus } from 'lucide-react';
import { usePurchaseStore } from '../../store/purchaseStore';
import { usePrompt } from '../../hooks/usePrompt';
import AddSupplierModal from '../../components/modals/AddSupplierModal';

const SuppliersTab: React.FC = () => {
  const { suppliers, archiveSupplier } = usePurchaseStore();
  const { askConfirm } = usePrompt();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const activeSuppliers = useMemo(() => suppliers.filter(s => !s.archived), [suppliers]);

  const handleArchive = async (id: string) => {
    const confirmed = await askConfirm('Archive Supplier', 'Are you sure you want to archive this supplier?');
    if (confirmed) {
      archiveSupplier(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-primary uppercase tracking-tight">Manage Suppliers</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
        >
          <UserPlus size={18} />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeSuppliers.length > 0 ? (
          activeSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-background rounded-[32px] p-8 shadow-neumorphic flex flex-col justify-between group hover:shadow-neumorphic-inset transition-all">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">{supplier.name}</h3>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest mt-2">
                      Active Supplier
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => setEditingSupplier(supplier)}
                      className="p-3 rounded-xl bg-background shadow-neumorphic text-blue-600 hover:shadow-neumorphic-inset transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleArchive(supplier.id)}
                      className="p-3 rounded-xl bg-background shadow-neumorphic text-red-600 hover:shadow-neumorphic-inset transition-all"
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="p-2 rounded-lg bg-primary/5">
                      <Phone size={14} />
                    </div>
                    <span className="text-xs font-bold">{supplier.phone}</span>
                  </div>
                  {supplier.email && (
                    <div className="flex items-center gap-3 text-text-secondary">
                      <div className="p-2 rounded-lg bg-primary/5">
                        <Mail size={14} />
                      </div>
                      <span className="text-xs font-bold truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-3 text-text-secondary col-span-full">
                      <div className="p-2 rounded-lg bg-primary/5 mt-0.5">
                        <MapPin size={14} />
                      </div>
                      <span className="text-xs font-bold leading-relaxed">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-300/30 flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary">
                  <FileText size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {/* In a real app, we'd count POs from the store */}
                    12 purchase orders
                  </span>
                </div>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                  Added {new Date(supplier.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-text-secondary font-bold bg-background rounded-[32px] shadow-neumorphic-inset">
            <div className="flex flex-col items-center gap-4">
              <UserPlus size={48} className="text-primary/20" />
              <p className="text-sm font-black uppercase tracking-widest">No suppliers registered</p>
            </div>
          </div>
        )}
      </div>

      {(isAddModalOpen || editingSupplier) && (
        <AddSupplierModal 
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSupplier(null);
          }} 
          editData={editingSupplier}
        />
      )}
    </div>
  );
};

export default SuppliersTab;

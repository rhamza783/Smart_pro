import React, { useState, useMemo } from 'react';
import { useDealStore } from '../../store/dealStore';
import { useMenuStore } from '../../store/menuStore';
import { Deal, DealComponent } from '../../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Download, 
  Upload,
  ChevronRight,
  Minus,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrompt } from '../../hooks/usePrompt';
import { toast } from 'react-hot-toast';

const DealManager: React.FC = () => {
  const { deals, addDeal, updateDeal, deleteDeal } = useDealStore();
  const { menuItems } = useMenuStore();
  const { askConfirm } = usePrompt();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled'>('All');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Deal, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    price: 0,
    status: 'available',
    sortOrder: 0,
    items: []
  });

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Active' && deal.status === 'available') ||
        (statusFilter === 'Disabled' && deal.status === 'disabled');
      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [deals, searchTerm, statusFilter]);

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setFormData({
      name: deal.name,
      description: deal.description || '',
      price: deal.price,
      status: deal.status,
      sortOrder: deal.sortOrder,
      items: [...deal.items]
    });
  };

  const handleNewDeal = () => {
    setSelectedDealId(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      status: 'available',
      sortOrder: deals.length + 1,
      items: []
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { menuItemId: '', menuItemName: '', qty: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof DealComponent, value: any) => {
    const newItems = [...formData.items];
    if (field === 'menuItemId') {
      const item = menuItems.find(m => m.id === value);
      if (item) {
        newItems[index] = {
          ...newItems[index],
          menuItemId: item.id,
          menuItemName: item.name,
          price: item.price
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const totalOriginalValue = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [formData.items]);

  const savings = totalOriginalValue - formData.price;
  const savingsPercent = totalOriginalValue > 0 ? Math.round((savings / totalOriginalValue) * 100) : 0;

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Deal name is required');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be positive');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }
    if (formData.items.some(i => !i.menuItemId)) {
      toast.error('All items must have a menu item selected');
      return;
    }

    const isDuplicate = deals.some(d => d.name.toLowerCase() === formData.name.toLowerCase() && d.id !== selectedDealId);
    if (isDuplicate) {
      toast.error('A deal with this name already exists');
      return;
    }

    if (selectedDealId) {
      updateDeal(selectedDealId, formData);
      toast.success('Deal updated successfully');
    } else {
      addDeal(formData);
      toast.success('Deal created successfully');
      handleNewDeal();
    }
  };

  const handleDelete = async () => {
    if (selectedDealId) {
      const confirmed = await askConfirm(
        'Delete Deal',
        'Are you sure you want to delete this deal? This action cannot be undone.'
      );
      if (confirmed) {
        deleteDeal(selectedDealId);
        toast.success('Deal deleted');
        handleNewDeal();
      }
    }
  };

  const toggleStatus = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = deal.status === 'available' ? 'disabled' : 'available';
    updateDeal(deal.id, { status: newStatus });
    toast.success(`${deal.name} ${newStatus === 'available' ? 'enabled' : 'disabled'}`);
  };

  const handleExportDeals = () => {
    const headers = ['id', 'name', 'description', 'price', 'status', 'sortOrder', 'items'];
    const rows = deals.map(d => [
      d.id,
      d.name,
      d.description || '',
      d.price,
      d.status,
      d.sortOrder,
      d.items.map(i => `${i.menuItemId}:${i.menuItemName}:${i.qty}:${i.price}`).join('|')
    ]);
    
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deals_export.csv';
    a.click();
    toast.success('Deals exported successfully');
  };

  const handleImportDeals = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1); // Skip header
        
        let importedCount = 0;
        rows.forEach(row => {
          if (!row.trim()) return;
          const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma but ignore commas inside quotes
          
          if (columns.length >= 7) {
            const name = columns[1].replace(/"/g, '').trim();
            const description = columns[2].replace(/"/g, '').trim();
            const price = parseFloat(columns[3]);
            const status = columns[4].trim() as 'available' | 'disabled';
            const sortOrder = parseInt(columns[5]);
            const itemsStr = columns[6].replace(/"/g, '').trim();
            
            const items: DealComponent[] = itemsStr.split('|').filter(Boolean).map(itemPart => {
              const [menuItemId, menuItemName, qty, price] = itemPart.split(':');
              return {
                menuItemId,
                menuItemName,
                qty: parseInt(qty) || 1,
                price: parseFloat(price) || 0
              };
            });

            if (name && !isNaN(price)) {
              addDeal({
                name,
                description,
                price,
                status: status === 'disabled' ? 'disabled' : 'available',
                sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
                items
              });
              importedCount++;
            }
          }
        });
        
        if (importedCount > 0) {
          toast.success(`Successfully imported ${importedCount} deals`);
        } else {
          toast.error('No valid deals found in CSV');
        }
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Column: Deals List */}
      <div className="lg:w-[40%] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-700 uppercase tracking-tight">Deal Manager</h2>
          <div className="flex items-center gap-2">
            <label className="p-2 bg-[#E0E5EC] rounded-xl shadow-neumorphic text-gray-600 hover:shadow-neumorphic-inset transition-all cursor-pointer" title="Import Deals">
              <Upload size={18} />
              <input type="file" accept=".csv" onChange={handleImportDeals} className="hidden" />
            </label>
            <button 
              onClick={handleExportDeals}
              className="p-2 bg-[#E0E5EC] rounded-xl shadow-neumorphic text-gray-600 hover:shadow-neumorphic-inset transition-all"
              title="Export Deals"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700"
            />
          </div>

          <div className="flex gap-2">
            {(['All', 'Active', 'Disabled'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === filter 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-[#E0E5EC] text-gray-500 shadow-neumorphic hover:shadow-neumorphic-inset'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {filteredDeals.map(deal => (
            <motion.div
              key={deal.id}
              layout
              onClick={() => handleSelectDeal(deal)}
              className={`p-4 rounded-3xl cursor-pointer transition-all border-l-4 ${
                selectedDealId === deal.id 
                  ? 'bg-white/40 border-purple-600 shadow-neumorphic-inset' 
                  : 'bg-[#E0E5EC] border-transparent shadow-neumorphic hover:shadow-neumorphic-inset'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    {deal.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {deal.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-purple-600">PKR {deal.price.toLocaleString()}</p>
                  <button 
                    onClick={(e) => toggleStatus(deal, e)}
                    className={`mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                      deal.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {deal.status === 'available' ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredDeals.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm font-bold text-gray-400 italic">No deals found</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-300/30">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            {deals.length} deals configured
          </p>
          <button 
            onClick={handleNewDeal}
            className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <Plus size={18} />
            New Deal
          </button>
        </div>
      </div>

      {/* Right Column: Deal Form */}
      <div className="lg:w-[60%] flex flex-col min-h-0">
        <div className="bg-[#E0E5EC] rounded-[32px] p-8 shadow-neumorphic-inset flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                  <Tag size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-700 uppercase tracking-tight">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Deal Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔥</span>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. BBQ Family Deal"
                      className="w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Bundle Price (PKR)</label>
                  <input 
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-[#E0E5EC] rounded-2xl py-4 px-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Sort Order</label>
                  <input 
                    type="number"
                    value={formData.sortOrder || ''}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full bg-[#E0E5EC] rounded-2xl py-4 px-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#E0E5EC] rounded-2xl py-4 px-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700 appearance-none"
                  >
                    <option value="available">Available</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the deal contents..."
                  rows={2}
                  className="w-full bg-[#E0E5EC] rounded-2xl py-4 px-4 shadow-neumorphic-inset outline-none text-sm font-bold text-gray-700 resize-none"
                />
              </div>
            </div>

            {/* Deal Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-700 uppercase tracking-tight">Included Items</h3>
                </div>
                <button 
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-neumorphic text-purple-600 font-black text-[10px] uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-4 p-4 bg-white/20 rounded-2xl border border-white/30">
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Menu Item</label>
                      <select
                        value={item.menuItemId}
                        onChange={(e) => handleItemChange(index, 'menuItemId', e.target.value)}
                        className="w-full bg-[#E0E5EC] rounded-xl py-2 px-3 shadow-neumorphic-inset outline-none text-xs font-bold text-gray-700 appearance-none"
                      >
                        <option value="">Select Item...</option>
                        {menuItems.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (PKR {m.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32 space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Qty</label>
                      <div className="flex items-center bg-[#E0E5EC] rounded-xl shadow-neumorphic-inset p-1">
                        <button 
                          onClick={() => handleItemChange(index, 'qty', Math.max(1, item.qty - 1))}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-purple-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="flex-1 text-center text-xs font-black">{item.qty}</span>
                        <button 
                          onClick={() => handleItemChange(index, 'qty', item.qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-purple-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="w-24 space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Unit Price</label>
                      <div className="w-full bg-gray-200/50 rounded-xl py-2 px-3 text-xs font-bold text-gray-500">
                        {item.price}
                      </div>
                    </div>

                    <div className="w-24 space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Total</label>
                      <div className="w-full bg-white/30 rounded-xl py-2 px-3 text-xs font-black text-gray-700">
                        {item.price * item.qty}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 bg-white/10 rounded-3xl border-2 border-dashed border-gray-300">
                    <p className="text-sm font-bold text-gray-400 italic">No items added — click + Add Item to build the deal</p>
                  </div>
                )}
              </div>

              {/* Summary Row */}
              {formData.items.length > 0 && (
                <div className="mt-8 p-6 bg-white/40 rounded-[32px] shadow-neumorphic space-y-2">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Total original value:</span>
                    <span>PKR {totalOriginalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-purple-600">
                    <span>Deal price:</span>
                    <span>PKR {formData.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-green-600 pt-2 border-t border-gray-300/30">
                    <span>Saving:</span>
                    <span>PKR {savings.toLocaleString()} ({savingsPercent}%)</span>
                  </div>

                  {formData.price > totalOriginalValue && totalOriginalValue > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-bold mt-4">
                      <AlertTriangle size={14} />
                      Deal price is higher than individual item prices — are you sure?
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-8">
              <button 
                onClick={handleSave}
                className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                <Save size={18} />
                {selectedDealId ? 'Update Deal' : 'Save Deal'}
              </button>
              
              {selectedDealId && (
                <button 
                  onClick={handleDelete}
                  className="px-6 bg-white text-red-500 font-black py-4 rounded-2xl shadow-neumorphic hover:bg-red-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealManager;

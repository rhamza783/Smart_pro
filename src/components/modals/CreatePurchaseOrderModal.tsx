import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle, ShoppingCart, Truck, Package, Search } from 'lucide-react';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useToastStore } from '../../store/toastStore';
import { PurchaseItem, Supplier, Ingredient } from '../../types';
import AutocompleteInput from '../ui/AutocompleteInput';
import HighlightText from '../ui/HighlightText';

interface CreatePurchaseOrderModalProps {
  onClose: () => void;
}

const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({ onClose }) => {
  const { suppliers, addPurchaseOrder } = usePurchaseStore();
  const { ingredients } = useInventoryStore();
  const { showToast } = useToastStore();

  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [items, setItems] = useState<(Omit<PurchaseItem, 'ingredientName' | 'totalCost'> & { searchQuery: string })[]>([]);
  const [notes, setNotes] = useState('');

  const activeSuppliers = useMemo(() => suppliers.filter(s => !s.archived), [suppliers]);
  const activeIngredients = useMemo(() => ingredients.filter(i => !i.archived), [ingredients]);

  const addItem = () => {
    setItems([...items, { ingredientId: '', qty: 0, unit: '', unitCost: 0, searchQuery: '' }]);
  };

  const updateItem = (index: number, updates: Partial<Omit<PurchaseItem, 'ingredientName' | 'totalCost'> & { searchQuery: string }>) => {
    const newItems = [...items];
    if (updates.ingredientId) {
      const ing = ingredients.find(i => i.id === updates.ingredientId);
      if (ing) {
        updates.unit = ing.unit;
        updates.unitCost = ing.costPerUnit;
        updates.searchQuery = ing.name;
      }
    }
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
  }, [items]);

  const renderSupplierSearchItem = (supplier: Supplier, query: string, highlightRanges: [number, number][]) => {
    return (
      <div className="p-3 flex items-center justify-between hover:bg-primary/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Truck size={20} />
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm">
              <HighlightText text={supplier.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              {supplier.phone}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIngredientSearchItem = (ing: Ingredient, query: string, highlightRanges: [number, number][]) => {
    return (
      <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-purple-500">
            <Package size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-700 text-sm">
              <HighlightText text={ing.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">
              <HighlightText text={ing.category} query={query} highlightRanges={highlightRanges} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-purple-600 text-xs">{ing.unit}</div>
          <div className="text-[8px] font-bold text-gray-400">Rs. {ing.costPerUnit}</div>
        </div>
      </div>
    );
  };

  const handleCreate = () => {
    if (!supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }
    if (items.some(i => !i.ingredientId || i.qty <= 0)) {
      showToast('Please fill all item details correctly', 'error');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const fullItems: PurchaseItem[] = items.map(({ searchQuery, ...item }) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return {
        ...item,
        ingredientName: ing?.name || 'Unknown',
        totalCost: item.qty * item.unitCost
      };
    });

    addPurchaseOrder({
      supplierId,
      supplierName: supplier.name,
      items: fullItems,
      status: 'pending',
      totalCost,
      notes
    });

    showToast('Purchase Order created successfully', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-300/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Create Purchase Order</h2>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Draft a new order for your suppliers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:shadow-neumorphic-inset transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Select Supplier</label>
              <AutocompleteInput
                value={supplierSearch}
                onChange={setSupplierSearch}
                onSelect={(s) => {
                  setSupplierId(s.id);
                  setSupplierSearch(s.name);
                }}
                items={activeSuppliers}
                searchFields={['name', 'phone']}
                renderItem={renderSupplierSearchItem}
                placeholder="Search supplier..."
                icon={<Truck size={18} />}
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Order Items</h3>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
            
            <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                    <th className="pb-4 px-4">Ingredient</th>
                    <th className="pb-4 px-4 text-center">Quantity</th>
                    <th className="pb-4 px-4 text-center">Unit</th>
                    <th className="pb-4 px-4 text-right">Unit Cost</th>
                    <th className="pb-4 px-4 text-right">Total</th>
                    <th className="pb-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300/30">
                  {items.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const isPriceAnomaly = ing && item.unitCost > ing.costPerUnit * 1.1;
                    
                    return (
                      <tr key={idx}>
                        <td className="py-4 px-4 min-w-[250px]">
                            <AutocompleteInput
                              value={item.searchQuery}
                              onChange={(val) => updateItem(idx, { searchQuery: val })}
                              onSelect={(selectedIng) => updateItem(idx, { ingredientId: selectedIng.id })}
                              items={activeIngredients}
                              searchFields={['name', 'category']}
                              renderItem={renderIngredientSearchItem}
                              placeholder="Search ingredient..."
                              className="shadow-none bg-transparent"
                            />
                          </td>
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, { qty: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-background shadow-neumorphic-inset rounded-lg px-2 py-1 text-center text-sm font-bold outline-none border-none"
                          />
                        </td>
                        <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary">
                          {item.unit || '-'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <input 
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => updateItem(idx, { unitCost: parseFloat(e.target.value) || 0 })}
                              className="w-24 bg-background shadow-neumorphic-inset rounded-lg px-2 py-1 text-right text-sm font-bold outline-none border-none"
                            />
                            {isPriceAnomaly && (
                              <span className="flex items-center gap-1 text-[8px] font-black text-orange-600 uppercase bg-orange-100 px-1.5 py-0.5 rounded">
                                <AlertTriangle size={8} />
                                Price higher than usual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-sm font-black text-primary">
                          {(item.qty * item.unitCost).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => removeItem(idx)}
                            className="p-2 rounded-xl bg-background shadow-neumorphic text-red-500 hover:shadow-neumorphic-inset transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific instructions or notes for the supplier..."
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="p-8 border-t border-gray-300/30 bg-gray-50/50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Estimated Total Cost</p>
            <p className="text-2xl font-black text-primary">PKR {totalCost.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleCreate}
            className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
          >
            <Save size={20} />
            Create PO
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderModal;

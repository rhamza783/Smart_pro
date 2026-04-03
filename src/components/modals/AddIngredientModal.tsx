import React, { useState, useEffect } from 'react';
import { X, Save, Scan, AlertCircle } from 'lucide-react';
import { Ingredient } from '../../types';
import { useInventoryStore } from '../../store/inventoryStore';
import { useToastStore } from '../../store/toastStore';

interface AddIngredientModalProps {
  onSave: (ingredient: any, openingStock?: number) => void;
  onClose: () => void;
  editData?: Ingredient;
}

const units = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'box', 'pack', 'bottle', 'can'];

const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ onSave, onClose, editData }) => {
  const { ingredients, setStock } = useInventoryStore();
  const { showToast } = useToastStore();
  
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    altName: editData?.altName || '',
    unit: editData?.unit || 'kg',
    category: editData?.category || '',
    minThreshold: editData?.minThreshold || 0,
    costPerUnit: editData?.costPerUnit || 0,
    barcode: editData?.barcode || '',
    notes: editData?.notes || '',
    openingStock: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = Array.from(new Set(ingredients.map(ing => ing.category)));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    
    // Duplicate name check
    const duplicate = ingredients.find(ing => 
      ing.name.toLowerCase() === formData.name.toLowerCase() && 
      ing.id !== editData?.id
    );
    if (duplicate) newErrors.name = 'Ingredient already exists';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const { openingStock, ...ingredientData } = formData;
    
    onSave(ingredientData, openingStock);
    
    showToast(editData ? 'Ingredient updated' : 'Ingredient added', 'success');
    onClose();
  };

  const handleScan = () => {
    showToast('Barcode scanning coming soon — enter manually', 'info');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#E0E5EC] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 flex justify-between items-center border-b border-gray-300/30">
          <div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">
              {editData ? 'Edit Ingredient' : 'Add New Ingredient'}
            </h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">
              Ingredient Details & Stock Policy
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Ingredient Name *</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none ${errors.name ? 'ring-2 ring-danger/50' : ''}`}
                placeholder="e.g. Chicken Breast"
              />
              {errors.name && <p className="text-[10px] font-bold text-danger ml-1 uppercase">{errors.name}</p>}
            </div>

            {/* Alt Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Alt Name / Urdu Name</label>
              <input 
                type="text"
                value={formData.altName}
                onChange={(e) => setFormData({ ...formData, altName: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
                placeholder="e.g. چکن بریسٹ"
              />
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Unit *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Category *</label>
              <div className="relative">
                <input 
                  type="text"
                  list="categories"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none ${errors.category ? 'ring-2 ring-danger/50' : ''}`}
                  placeholder="e.g. Poultry"
                />
                <datalist id="categories">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              {errors.category && <p className="text-[10px] font-bold text-danger ml-1 uppercase">{errors.category}</p>}
            </div>

            {/* Min Threshold */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Min Stock Threshold</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  value={formData.minThreshold}
                  onChange={(e) => setFormData({ ...formData, minThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-text-secondary uppercase">{formData.unit}</span>
              </div>
            </div>

            {/* Cost per Unit */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Cost per Unit (PKR)</label>
              <input 
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Barcode</label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="flex-1 px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
                  placeholder="Scan or enter barcode"
                />
                <button 
                  type="button"
                  onClick={handleScan}
                  className="p-4 rounded-2xl bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                >
                  <Scan size={20} />
                </button>
              </div>
            </div>

            {/* Opening Stock (New only) */}
            {!editData && (
              <div className="space-y-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Opening Stock Qty</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.openingStock}
                    onChange={(e) => setFormData({ ...formData, openingStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-text-secondary uppercase">{formData.unit}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold border-none min-h-[100px]"
              placeholder="Storage instructions, supplier notes, etc."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-background shadow-neumorphic text-text-secondary font-black uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              <Save size={20} />
              <span>{editData ? 'Save Changes' : 'Save Ingredient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIngredientModal;

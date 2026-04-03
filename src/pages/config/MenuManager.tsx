import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, X, Plus, Trash2, Image as ImageIcon, 
  ChevronRight, Download, Upload, GripVertical,
  CheckCircle2, AlertCircle, Save, ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMenuStore } from '../../store/menuStore';
import { useRecipeStore } from '../../store/recipeStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { MenuItem, Variant, ModifierGroup, ModifierOption } from '../../types';
import SectionCard from '../../components/config/SectionCard';
import { usePrompt } from '../../hooks/usePrompt';

const MenuManager: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems, menuCategories, addItem, updateItem, deleteItem } = useMenuStore();
  const { recipes } = useRecipeStore();
  const { ingredients, setActiveTab: setInventoryTab } = useInventoryStore();
  const { askConfirm } = usePrompt();
  
  // List State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form State
  const [activeTab, setActiveTab] = useState<'general' | 'recipe'>('general');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    altName: '',
    price: 0,
    category: menuCategories[0]?.id || '',
    status: 'available',
    sortOrder: 0,
    code: '',
    imgData: '',
    askPrice: false,
    askQty: false,
    showPriceOnButton: true,
    variants: [],
    modifiers: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{ update: number, add: number, items: MenuItem[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [menuItems, searchQuery, categoryFilter, statusFilter]);

  // Handlers
  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.menuItemId === selectedItemId);
  }, [recipes, selectedItemId]);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItemId(item.id);
    setFormData(item);
    setErrors({});
    setActiveTab('general');
  };

  const handleNewItem = () => {
    setSelectedItemId(null);
    setFormData({
      name: '',
      altName: '',
      price: 0,
      category: menuCategories[0]?.id || '',
      status: 'available',
      sortOrder: menuItems.length + 1,
      code: '',
      imgData: '',
      askPrice: false,
      askQty: false,
      showPriceOnButton: true,
      variants: [],
      modifiers: []
    });
    setErrors({});
    setActiveTab('general');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Item Name is required';
    if (formData.price === undefined || formData.price < 0) newErrors.price = 'Price must be a positive number';
    
    // Duplicate name in same category
    const duplicate = menuItems.find(item => 
      item.id !== selectedItemId && 
      item.name.toLowerCase() === formData.name?.toLowerCase() && 
      item.category === formData.category
    );
    if (duplicate) newErrors.name = `An item named "${formData.name}" already exists in this category`;

    // Variant uniqueness
    if (formData.variants) {
      const names = formData.variants.map(v => v.vName.toLowerCase());
      if (new Set(names).size !== names.length) {
        newErrors.variants = 'Variant names must be unique';
      }
    }

    // Modifier uniqueness
    if (formData.modifiers) {
      formData.modifiers.forEach((group, gIdx) => {
        const names = group.options.map(o => o.name.toLowerCase());
        if (new Set(names).size !== names.length) {
          newErrors[`modifier_${gIdx}`] = 'Option names must be unique within group';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (selectedItemId) {
      updateItem(selectedItemId, formData as MenuItem);
    } else {
      const id = `item_${Date.now()}`;
      addItem({ ...formData, id } as MenuItem);
      setSelectedItemId(id);
    }
    
    // Show success toast
    toast.success('Item saved successfully!');
  };

  const handleDelete = async () => {
    if (selectedItemId) {
      const confirmed = await askConfirm(
        'Delete Menu Item',
        `Are you sure you want to delete "${formData.name}"? This action cannot be undone.`
      );
      if (confirmed) {
        deleteItem(selectedItemId);
        handleNewItem();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imgData: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Variants
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { vName: '', vPrice: 0 }]
    }));
  };

  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
    const newVariants = [...(formData.variants || [])];
    newVariants[idx] = { ...newVariants[idx], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== idx)
    }));
  };

  // Modifiers
  const addModifierGroup = () => {
    setFormData(prev => ({
      ...prev,
      modifiers: [...(prev.modifiers || []), { groupName: '', options: [{ name: '', price: 0 }] }]
    }));
  };

  const updateModifierGroup = (idx: number, name: string) => {
    const newGroups = [...(formData.modifiers || [])];
    newGroups[idx] = { ...newGroups[idx], groupName: name };
    setFormData(prev => ({ ...prev, modifiers: newGroups }));
  };

  const removeModifierGroup = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      modifiers: (prev.modifiers || []).filter((_, i) => i !== idx)
    }));
  };

  const addModifierOption = (groupIdx: number) => {
    const newGroups = [...(formData.modifiers || [])];
    newGroups[groupIdx].options.push({ name: '', price: 0 });
    setFormData(prev => ({ ...prev, modifiers: newGroups }));
  };

  const updateModifierOption = (groupIdx: number, optIdx: number, field: keyof ModifierOption, value: any) => {
    const newGroups = [...(formData.modifiers || [])];
    newGroups[groupIdx].options[optIdx] = { ...newGroups[groupIdx].options[optIdx], [field]: value };
    setFormData(prev => ({ ...prev, modifiers: newGroups }));
  };

  const removeModifierOption = (groupIdx: number, optIdx: number) => {
    const newGroups = [...(formData.modifiers || [])];
    newGroups[groupIdx].options = newGroups[groupIdx].options.filter((_, i) => i !== optIdx);
    setFormData(prev => ({ ...prev, modifiers: newGroups }));
  };

  // CSV
  const exportCSV = () => {
    const headers = ['id', 'name', 'category', 'price', 'status', 'sortOrder', 'altName', 'code', 'askPrice', 'askQty', 'variants', 'modifiers'];
    const rows = menuItems.map(item => {
      const variantsStr = item.variants?.map(v => `${v.vName}:${v.vPrice}`).join('|') || '';
      const modifiersStr = item.modifiers?.map(g => {
        const opts = g.options.map(o => `${o.name}:${o.price}`).join(',');
        return `${g.groupName}[${opts}]`;
      }).join(';') || '';
      
      return [
        item.id,
        item.name,
        item.category,
        item.price,
        item.status,
        item.sortOrder,
        item.altName || '',
        item.code || '',
        item.askPrice ? '1' : '0',
        item.askQty ? '1' : '0',
        variantsStr,
        modifiersStr
      ].map(v => `"${v}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `menu_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const items: MenuItem[] = [];
      let addCount = 0;
      let updateCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx];
        });

        // Parse variants
        const variants: Variant[] = row.variants ? row.variants.split('|').map((v: string) => {
          const [vName, vPrice] = v.split(':');
          return { vName, vPrice: parseFloat(vPrice) };
        }) : [];

        // Parse modifiers
        const modifiers: ModifierGroup[] = row.modifiers ? row.modifiers.split(';').map((g: string) => {
          const match = g.match(/(.+)\[(.+)\]/);
          if (match) {
            const groupName = match[1];
            const options = match[2].split(',').map(o => {
              const [name, price] = o.split(':');
              return { name, price: parseFloat(price) };
            });
            return { groupName, options };
          }
          return null;
        }).filter(Boolean) as ModifierGroup[] : [];

        const item: MenuItem = {
          id: row.id || `item_${Date.now()}_${i}`,
          name: row.name,
          category: row.category,
          price: parseFloat(row.price),
          status: row.status as 'available' | 'hidden',
          sortOrder: parseInt(row.sortOrder) || 0,
          altName: row.altName,
          code: row.code,
          askPrice: row.askPrice === '1',
          askQty: row.askQty === '1',
          variants,
          modifiers
        };

        if (menuItems.find(mi => mi.id === item.id)) {
          updateCount++;
        } else {
          addCount++;
        }
        items.push(item);
      }

      setImportPreview({ add: addCount, update: updateCount, items });
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (importPreview) {
      importPreview.items.forEach(item => {
        if (menuItems.find(mi => mi.id === item.id)) {
          updateItem(item.id, item);
        } else {
          addItem(item);
        }
      });
      setIsImportModalOpen(false);
      setImportPreview(null);
      toast.success('Import completed successfully!');
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Menu Manager</h2>
          <p className="text-xs text-text-secondary">Manage your food items, variants and add-ons</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all text-sm font-bold"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all text-sm font-bold"
          >
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
          <input 
            type="file" 
            ref={csvInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Column - List */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4 min-h-0">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background shadow-neumorphic-inset rounded-2xl pl-12 pr-10 py-3 outline-none text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-danger"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-xs font-bold text-text-secondary"
              >
                <option value="all">All Categories</option>
                {menuCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-xs font-bold text-text-secondary"
              >
                <option value="all">All Status</option>
                <option value="available">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                onClick={() => handleSelectItem(item)}
                className={`p-4 rounded-2xl bg-background shadow-neumorphic cursor-pointer transition-all border-l-4 ${
                  selectedItemId === item.id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {menuCategories.find(c => c.id === item.category)?.name || 'Uncategorized'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.status === 'available' ? 'Active' : 'Hidden'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                        Pos: {item.sortOrder}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm">{item.price}</div>
                    {item.code && <div className="text-[10px] text-text-secondary opacity-50">#{item.code}</div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom List Actions */}
          <div className="pt-2 flex justify-between items-center">
            <p className="text-[10px] text-text-secondary font-medium">
              Showing {filteredItems.length} of {menuItems.length} items
            </p>
            <button 
              onClick={handleNewItem}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm font-bold"
            >
              <Plus size={18} />
              <span>New Item</span>
            </button>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 flex flex-col min-h-0 bg-background rounded-[32px] shadow-neumorphic overflow-hidden">
          {/* Form Tabs */}
          <div className="flex border-b border-gray-300/30">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                activeTab === 'general' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'
              }`}
            >
              General Info
            </button>
            <button 
              onClick={() => setActiveTab('recipe')}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                activeTab === 'recipe' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Recipe (BOM)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {activeTab === 'general' ? (
              <>
                {/* Section 1 - Basic Info */}
                <SectionCard title="Basic Info" icon={<ImageIcon size={20} />}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-2xl shadow-neumorphic-inset flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative"
                    >
                      {formData.imgData ? (
                        <>
                          <img src={formData.imgData} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={24} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={32} className="text-text-secondary opacity-30" />
                          <span className="text-[10px] text-text-secondary mt-2 font-bold">Upload Image</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Item Name *</label>
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className={`w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm ${
                            errors.name ? 'ring-1 ring-danger' : ''
                          }`}
                        />
                        {errors.name && <p className="text-[10px] text-danger font-bold">{errors.name}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Urdu/Alt Name</label>
                        <input 
                          type="text"
                          value={formData.altName}
                          onChange={(e) => setFormData(prev => ({ ...prev, altName: e.target.value }))}
                          className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm text-right font-urdu"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Item Code</label>
                        <input 
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                          className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Sort Order</label>
                        <input 
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Section 2 - Pricing & Category */}
                <SectionCard title="Pricing & Category">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Selling Price *</label>
                      <input 
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className={`w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm ${
                          errors.price ? 'ring-1 ring-danger' : ''
                        }`}
                      />
                      {errors.price && <p className="text-[10px] text-danger font-bold">{errors.price}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                      >
                        {menuCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                      >
                        <option value="available">Available</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, askPrice: !prev.askPrice }))}
                        className={`w-10 h-5 rounded-full transition-all relative ${formData.askPrice ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.askPrice ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-xs font-bold text-text-secondary">Ask Price</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, askQty: !prev.askQty }))}
                        className={`w-10 h-5 rounded-full transition-all relative ${formData.askQty ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.askQty ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-xs font-bold text-text-secondary">Ask Qty</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, showPriceOnButton: !prev.showPriceOnButton }))}
                        className={`w-10 h-5 rounded-full transition-all relative ${formData.showPriceOnButton ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.showPriceOnButton ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-xs font-bold text-text-secondary">Show Price on Button</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Section 3 - Variants */}
                <SectionCard 
                  title="Variants" 
                  icon={
                    <button 
                      onClick={addVariant}
                      className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  }
                >
                  <div className="space-y-3">
                    {formData.variants && formData.variants.length > 0 ? (
                      formData.variants.map((variant, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <GripVertical size={16} className="text-text-secondary opacity-30 cursor-grab" />
                          <input 
                            type="text"
                            placeholder="Variant Name (e.g. Half)"
                            value={variant.vName}
                            onChange={(e) => updateVariant(idx, 'vName', e.target.value)}
                            className="flex-[2] bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                          />
                          <input 
                            type="number"
                            placeholder="Price"
                            value={variant.vPrice}
                            onChange={(e) => updateVariant(idx, 'vPrice', parseFloat(e.target.value) || 0)}
                            className="flex-1 bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm"
                          />
                          <button 
                            onClick={() => removeVariant(idx)}
                            className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300/30 rounded-2xl">
                        <p className="text-xs text-text-secondary opacity-50">No variants — item has one fixed price</p>
                      </div>
                    )}
                    {errors.variants && <p className="text-[10px] text-danger font-bold">{errors.variants}</p>}
                    <p className="text-[10px] text-text-secondary opacity-60 italic">
                      Variants let customer choose size/option with different prices
                    </p>
                  </div>
                </SectionCard>

                {/* Section 4 - Modifiers */}
                <SectionCard 
                  title="Modifiers / Add-ons" 
                  icon={
                    <button 
                      onClick={addModifierGroup}
                      className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  }
                >
                  <div className="space-y-6">
                    {formData.modifiers && formData.modifiers.length > 0 ? (
                      formData.modifiers.map((group, gIdx) => (
                        <div key={gIdx} className="p-4 rounded-2xl bg-background shadow-neumorphic-inset space-y-4">
                          <div className="flex gap-3">
                            <input 
                              type="text"
                              placeholder="Group Name (e.g. Extras)"
                              value={group.groupName}
                              onChange={(e) => updateModifierGroup(gIdx, e.target.value)}
                              className="flex-1 bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-sm font-bold"
                            />
                            <button 
                              onClick={() => removeModifierGroup(gIdx)}
                              className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <div className="space-y-2 pl-4 border-l-2 border-gray-300/30">
                            {group.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex gap-3 items-center">
                                <input 
                                  type="text"
                                  placeholder="Option Name"
                                  value={opt.name}
                                  onChange={(e) => updateModifierOption(gIdx, oIdx, 'name', e.target.value)}
                                  className="flex-1 bg-background shadow-neumorphic rounded-lg px-3 py-1.5 outline-none text-xs"
                                />
                                <input 
                                  type="number"
                                  placeholder="Extra Price"
                                  value={opt.price}
                                  onChange={(e) => updateModifierOption(gIdx, oIdx, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 bg-background shadow-neumorphic rounded-lg px-3 py-1.5 outline-none text-xs"
                                />
                                <button 
                                  onClick={() => removeModifierOption(gIdx, oIdx)}
                                  className="p-1.5 text-text-secondary hover:text-danger"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button 
                              onClick={() => addModifierOption(gIdx)}
                              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Plus size={12} />
                              Add Option
                            </button>
                          </div>
                          {errors[`modifier_${gIdx}`] && <p className="text-[10px] text-danger font-bold">{errors[`modifier_${gIdx}`]}</p>}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300/30 rounded-2xl">
                        <p className="text-xs text-text-secondary opacity-50">No modifiers — item has no add-ons</p>
                      </div>
                    )}
                    <p className="text-[10px] text-text-secondary opacity-60 italic">
                      All options are unlimited — customer can pick any combination
                    </p>
                  </div>
                </SectionCard>

                {/* Section 5 - Recipe Link */}
                <SectionCard title="Recipe (BOM) Link">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">Link to Inventory</p>
                      <p className="text-[10px] text-text-secondary">Auto-deduct ingredients when this item is sold</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('recipe')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-primary text-xs font-bold hover:shadow-md transition-all"
                    >
                      <span>Edit Recipe</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </SectionCard>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Save size={20} />
                    <span>Save Item</span>
                  </button>
                  {selectedItemId && (
                    <button 
                      onClick={handleDelete}
                      className="px-6 py-4 rounded-2xl bg-background text-danger font-bold shadow-neumorphic hover:shadow-neumorphic-inset active:scale-95 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full space-y-6">
                {currentRecipe ? (
                  <>
                    <div className="p-8 rounded-[32px] bg-background shadow-neumorphic-inset space-y-6">
                      <div className="flex justify-between items-center border-b border-gray-300/30 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <ChefHat size={20} />
                          </div>
                          <h3 className="text-lg font-black text-primary uppercase tracking-tight">Recipe Summary</h3>
                        </div>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                          Linked to Inventory
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {currentRecipe.ingredients.map((ri, idx) => {
                          const ing = ingredients.find(i => i.id === ri.ingredientId);
                          return (
                            <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-background shadow-neumorphic">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-primary uppercase tracking-tight">{ing?.name || 'Unknown'}</span>
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{ing?.category}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-primary">{ri.qty} {ri.unit}</span>
                                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                                  Cost: PKR {(ri.qty * (ing?.costPerUnit || 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-gray-300/30 flex justify-between items-center">
                        <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Total Recipe Cost</span>
                        <span className="text-lg font-black text-primary">
                          PKR {currentRecipe.ingredients.reduce((sum, ri) => {
                            const ing = ingredients.find(i => i.id === ri.ingredientId);
                            return sum + (ri.qty * (ing?.costPerUnit || 0));
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setInventoryTab('recipes');
                        navigate('/inventory');
                      }}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      <ChefHat size={20} />
                      <span>Manage Full Recipe in Inventory</span>
                      <ChevronRight size={20} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <AlertCircle size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Recipe Linked</h3>
                      <p className="text-sm text-text-secondary max-w-xs font-medium">
                        This item is not yet linked to any ingredients in the inventory. Sales will not deduct stock.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setInventoryTab('recipes');
                        navigate('/inventory');
                      }}
                      className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      <ChefHat size={20} />
                      <span>Create Recipe in Inventory</span>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background w-full max-w-md rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Import Preview</h3>
                  <p className="text-xs text-text-secondary">Verify the changes before applying</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-3">
                    <Plus size={20} className="text-green-600" />
                    <span className="text-sm font-bold text-green-700">New Items to Add</span>
                  </div>
                  <span className="text-lg font-black text-green-700">{importPreview?.add}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Existing Items to Update</span>
                  </div>
                  <span className="text-lg font-black text-blue-700">{importPreview?.update}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-text-secondary bg-background shadow-neumorphic hover:text-primary transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmImport}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-primary shadow-lg hover:opacity-90 transition-all"
                >
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuManager;

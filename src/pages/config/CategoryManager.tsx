import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit2, GripVertical, 
  Check, X, LayoutGrid, AlertCircle
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { useMenuStore } from '../../store/menuStore';
import { MenuCategory } from '../../types';
import { usePrompt } from '../../hooks/usePrompt';

const CategoryManager: React.FC = () => {
  const { menuCategories, menuItems, addCategory, updateCategory, deleteCategory, saveMenuItems } = useMenuStore();
  const { askConfirm } = usePrompt();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    
    // Check duplicate
    if (menuCategories.find(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
      setError('Category already exists');
      return;
    }

    const newCat: MenuCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      sortOrder: menuCategories.length + 1
    };

    addCategory(newCat);
    setNewCatName('');
    setIsAdding(false);
    setError(null);
  };

  const handleStartEdit = (cat: MenuCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setError(null);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;

    // Check duplicate
    if (menuCategories.find(c => c.id !== editingId && c.name.toLowerCase() === editName.toLowerCase())) {
      setError('Category name already exists');
      return;
    }

    const cat = menuCategories.find(c => c.id === editingId);
    if (cat) {
      updateCategory(editingId, { ...cat, name: editName.trim() });
    }
    setEditingId(null);
    setError(null);
  };

  const handleDeleteClick = async (id: string) => {
    // Check if items are assigned
    const assignedItems = menuItems.filter(item => item.category === id);
    if (assignedItems.length > 0) {
      toast.error(`Cannot delete category. There are ${assignedItems.length} items assigned to it. Please move or delete those items first.`);
      return;
    }
    
    const confirmed = await askConfirm(
      'Delete Category',
      'Are you sure you want to delete this category? This will remove it from the menu filters.'
    );
    
    if (confirmed) {
      deleteCategory(id);
    }
  };

  const handleReorder = (newOrder: MenuCategory[]) => {
    // Update sortOrder for all
    const updated = newOrder.map((cat, idx) => ({
      ...cat,
      sortOrder: idx + 1
    }));
    
    // Update store
    updated.forEach(cat => updateCategory(cat.id, cat));
    saveMenuItems();
  };

  return (
    <div className="bg-background rounded-[32px] shadow-neumorphic p-8 mt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">Category Management</h3>
            <p className="text-xs text-text-secondary">Organize your menu into logical groups</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3 text-danger text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Add Form */}
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-background shadow-neumorphic-inset flex gap-3 items-center"
          >
            <input 
              autoFocus
              type="text"
              placeholder="Category Name (e.g. Desserts)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-background shadow-neumorphic rounded-xl px-4 py-2 outline-none text-sm font-bold"
            />
            <button 
              onClick={handleAdd}
              className="p-2 rounded-xl bg-primary text-white shadow-md hover:opacity-90 transition-all"
            >
              <Check size={20} />
            </button>
            <button 
              onClick={() => { setIsAdding(false); setError(null); }}
              className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}

        {/* Category List */}
        <Reorder.Group axis="y" values={menuCategories} onReorder={handleReorder} className="space-y-3">
          {menuCategories.map(cat => (
            <Reorder.Item 
              key={cat.id} 
              value={cat}
              className="p-4 rounded-2xl bg-background shadow-neumorphic flex items-center gap-4 group cursor-default"
            >
              <div className="cursor-grab active:cursor-grabbing text-text-secondary opacity-30 group-hover:opacity-100 transition-opacity">
                <GripVertical size={20} />
              </div>

              {editingId === cat.id ? (
                <div className="flex-1 flex gap-3 items-center">
                  <input 
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="flex-1 bg-background shadow-neumorphic-inset rounded-xl px-4 py-2 outline-none text-sm font-bold"
                  />
                  <button 
                    onClick={handleSaveEdit}
                    className="p-2 rounded-xl bg-primary text-white shadow-md hover:opacity-90 transition-all"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={() => { setEditingId(null); setError(null); }}
                    className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h4 className="font-bold text-text-primary">{cat.name}</h4>
                    <p className="text-[10px] text-text-secondary font-medium">
                      {menuItems.filter(item => item.category === cat.id).length} items assigned
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleStartEdit(cat)}
                      className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(cat.id)}
                      className="p-2 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-danger transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
};

export default CategoryManager;

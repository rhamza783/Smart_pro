import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Save, AlertCircle, ChevronRight, Package } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { useRecipeStore } from '../../store/recipeStore';
import { useToastStore } from '../../store/toastStore';
import { useCartStore } from '../../store/cartStore'; // Assuming menu items are here or in a menu store
import { usePrompt } from '../../hooks/usePrompt';
import { Recipe, RecipeIngredient, Ingredient } from '../../types';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import HighlightText from '../../components/ui/HighlightText';

// Mocking menu items if not available in a store
// In a real app, this would come from a menuStore
const menuItems = [
  { id: 'm1', name: 'Chicken Shinwari Karahi (Half)', category: 'Shinwari', price: 1200 },
  { id: 'm2', name: 'Chicken Shinwari Karahi (Full)', category: 'Shinwari', price: 2200 },
  { id: 'm3', name: 'Mutton Shinwari Karahi (Half)', category: 'Shinwari', price: 1800 },
  { id: 'm4', name: 'Mutton Shinwari Karahi (Full)', category: 'Shinwari', price: 3400 },
  { id: 'm5', name: 'Kabuli Pulao', category: 'Rice', price: 850 },
  { id: 'm6', name: 'Naan', category: 'Bread', price: 40 },
  { id: 'm7', name: 'Raita', category: 'Sides', price: 60 },
];

interface EditingRecipeIngredient extends RecipeIngredient {
  searchQuery: string;
}

interface EditingRecipe extends Omit<Recipe, 'ingredients'> {
  ingredients: EditingRecipeIngredient[];
}

const RecipesTab: React.FC = () => {
  const { ingredients } = useInventoryStore();
  const { getRecipe, saveRecipe, deleteRecipe, hasRecipe } = useRecipeStore();
  const { showToast } = useToastStore();
  const { askConfirm } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<EditingRecipe | null>(null);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selectedItem = useMemo(() => 
    menuItems.find(item => item.id === selectedItemId), 
    [selectedItemId]
  );

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const existingRecipe = getRecipe(itemId);
    if (existingRecipe) {
      setEditingRecipe({ 
        ...existingRecipe,
        ingredients: existingRecipe.ingredients.map(ri => {
          const ing = ingredients.find(i => i.id === ri.ingredientId);
          return { ...ri, searchQuery: ing?.name || '' };
        })
      });
    } else {
      setEditingRecipe({
        menuItemId: itemId,
        ingredients: [],
        updatedAt: Date.now()
      });
    }
  };

  const addIngredientToRecipe = () => {
    if (!editingRecipe) return;
    setEditingRecipe({
      ...editingRecipe,
      ingredients: [
        ...editingRecipe.ingredients,
        { ingredientId: '', qty: 0, unit: '', searchQuery: '' }
      ]
    });
  };

  const updateRecipeIngredient = (index: number, updates: Partial<EditingRecipeIngredient>) => {
    if (!editingRecipe) return;
    const newIngredients = [...editingRecipe.ingredients];
    
    if (updates.ingredientId) {
      const ing = ingredients.find(i => i.id === updates.ingredientId);
      if (ing) {
        updates.unit = ing.unit;
        updates.searchQuery = ing.name;
      }
    }

    newIngredients[index] = { ...newIngredients[index], ...updates };
    setEditingRecipe({ ...editingRecipe, ingredients: newIngredients });
  };

  const removeIngredientFromRecipe = (index: number) => {
    if (!editingRecipe) return;
    const newIngredients = editingRecipe.ingredients.filter((_, i) => i !== index);
    setEditingRecipe({ ...editingRecipe, ingredients: newIngredients });
  };

  const totalCost = useMemo(() => {
    if (!editingRecipe) return 0;
    return editingRecipe.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      return sum + (ing ? ing.costPerUnit * ri.qty : 0);
    }, 0);
  }, [editingRecipe, ingredients]);

  const margin = selectedItem ? ((selectedItem.price - totalCost) / selectedItem.price) * 100 : 0;

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

  const handleSave = () => {
    if (!editingRecipe) return;
    
    // Validation
    const hasEmpty = editingRecipe.ingredients.some(ri => !ri.ingredientId || ri.qty <= 0);
    if (hasEmpty) {
      showToast('Please fill all ingredient details', 'error');
      return;
    }

    saveRecipe({
      ...editingRecipe,
      ingredients: editingRecipe.ingredients.map(({ searchQuery, ...rest }) => rest)
    });
    showToast('Recipe saved successfully', 'success');
  };

  const handleDelete = async () => {
    if (!selectedItemId) return;
    const confirmed = await askConfirm('Delete Recipe', 'Are you sure you want to delete this recipe?');
    if (confirmed) {
      deleteRecipe(selectedItemId);
      setEditingRecipe({
        menuItemId: selectedItemId,
        ingredients: [],
        updatedAt: Date.now()
      });
      showToast('Recipe deleted', 'info');
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6">
      {/* Left Panel: Menu Items List */}
      <div className="w-[320px] flex flex-col bg-background rounded-[32px] shadow-neumorphic overflow-hidden">
        <div className="p-6 border-b border-gray-300/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-xs border-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
          {filteredMenuItems.map(item => {
            const linked = hasRecipe(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  selectedItemId === item.id 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-background text-text-primary shadow-neumorphic hover:shadow-neumorphic-inset'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-black truncate max-w-[180px]">{item.name}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedItemId === item.id ? 'text-white/70' : 'text-text-secondary'}`}>
                    {item.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${linked ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-300'}`} />
                  <ChevronRight size={14} className={selectedItemId === item.id ? 'text-white/50' : 'text-text-secondary'} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Recipe Editor */}
      <div className="flex-1 bg-background rounded-[32px] shadow-neumorphic overflow-hidden flex flex-col">
        {selectedItem && editingRecipe ? (
          <>
            <div className="p-8 border-b border-gray-300/30 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{selectedItem.name}</h2>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">
                  Define ingredients consumed when 1x this item is sold
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleDelete}
                  className="px-6 py-3 rounded-2xl bg-background shadow-neumorphic text-red-600 font-black text-xs uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
                >
                  Delete Recipe
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Recipe
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="bg-background rounded-3xl p-6 shadow-neumorphic-inset">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                      <th className="pb-4 px-4">Ingredient Name</th>
                      <th className="pb-4 px-4 text-center">Quantity</th>
                      <th className="pb-4 px-4 text-center">Unit</th>
                      <th className="pb-4 px-4 text-right">Cost/Unit</th>
                      <th className="pb-4 px-4 text-right">Total Cost</th>
                      <th className="pb-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300/30">
                    {editingRecipe.ingredients.map((ri, idx) => {
                      const ing = ingredients.find(i => i.id === ri.ingredientId);
                      return (
                        <tr key={idx} className="group">
                          <td className="py-4 px-4 min-w-[250px]">
                            <AutocompleteInput
                              value={ri.searchQuery}
                              onChange={(val) => updateRecipeIngredient(idx, { searchQuery: val })}
                              onSelect={(selectedIng) => updateRecipeIngredient(idx, { ingredientId: selectedIng.id })}
                              items={ingredients.filter(i => !i.archived)}
                              searchFields={['name', 'category']}
                              renderItem={renderIngredientSearchItem}
                              placeholder="Search ingredient..."
                              className="shadow-none bg-transparent"
                            />
                          </td>
                          <td className="py-4 px-4 text-center">
                            <input 
                              type="number"
                              step="0.001"
                              value={ri.qty}
                              onChange={(e) => updateRecipeIngredient(idx, { qty: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-background shadow-neumorphic-inset rounded-lg px-2 py-1 text-center text-sm font-bold outline-none border-none"
                            />
                          </td>
                          <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary">
                            {ri.unit || '-'}
                          </td>
                          <td className="py-4 px-4 text-right text-xs font-bold text-text-primary">
                            {ing ? ing.costPerUnit.toLocaleString() : '-'}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-black text-primary">
                            {ing ? (ing.costPerUnit * ri.qty).toLocaleString() : '-'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => removeIngredientFromRecipe(idx)}
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
                <button 
                  onClick={addIngredientToRecipe}
                  className="mt-6 flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                  <Plus size={16} />
                  Add Ingredient
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic text-center border-l-4 border-blue-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Total Recipe Cost</p>
                  <p className="text-2xl font-black text-primary">PKR {totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic text-center border-l-4 border-purple-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Selling Price</p>
                  <p className="text-2xl font-black text-primary">PKR {selectedItem.price.toLocaleString()}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic text-center border-l-4 border-green-500">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Gross Margin</p>
                  <p className={`text-2xl font-black ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-background shadow-neumorphic flex items-center justify-center mb-6">
              <AlertCircle size={48} className="text-primary/30" />
            </div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">No Item Selected</h3>
            <p className="text-sm font-bold max-w-xs">
              Select a menu item from the left panel to manage its recipe and ingredient linkages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesTab;

import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { getStockStatus, getStatusColor, getStatusLabel, formatQty } from '../../utils/inventoryUtils';
import { usePrompt } from '../../hooks/usePrompt';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  History, 
  Edit2, 
  Archive, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import AddIngredientModal from '../../components/modals/AddIngredientModal';
import StockAdjustmentModal from '../../components/modals/StockAdjustmentModal';
import MovementHistoryModal from '../../components/modals/MovementHistoryModal';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import HighlightText from '../../components/ui/HighlightText';
import { fuzzySearch } from '../../utils/autocompleteEngine';
import { Ingredient } from '../../types';

const StockRegister: React.FC = () => {
  const { 
    getActiveIngredients, 
    getStockQty, 
    archiveIngredient,
    addIngredient,
    updateIngredient,
    adjustStock
  } = useInventoryStore();
  const { askConfirm } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const [adjustingIngredient, setAdjustingIngredient] = useState<any>(null);
  const [historyIngredient, setHistoryIngredient] = useState<any>(null);

  const activeIngredients = getActiveIngredients();
  const categories = useMemo(() => {
    const cats = new Set(activeIngredients.map(ing => ing.category));
    return ['All', ...Array.from(cats)];
  }, [activeIngredients]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fuzzySearch(searchTerm, activeIngredients, ['name', 'category', 'barcode'], { maxResults: 50 });
  }, [searchTerm, activeIngredients]);

  const filteredIngredients = useMemo(() => {
    let result = searchTerm.trim() === '' 
      ? [...activeIngredients]
      : searchResults.map(r => r.item);

    return result
      .filter(ing => {
        const matchesCategory = categoryFilter === 'All' || ing.category === categoryFilter;
        
        const qty = getStockQty(ing.id);
        const status = getStockStatus(qty, ing.minThreshold);
        const matchesStatus = statusFilter === 'All' || status === statusFilter.toLowerCase();
        
        return matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const qtyA = getStockQty(a.id);
        const qtyB = getStockQty(b.id);
        const statusA = getStockStatus(qtyA, a.minThreshold);
        const statusB = getStockStatus(qtyB, b.minThreshold);
        
        const statusOrder = { 'empty': 0, 'critical': 1, 'low': 2, 'ok': 3 };
        return statusOrder[statusA] - statusOrder[statusB];
      });
  }, [activeIngredients, searchTerm, searchResults, categoryFilter, statusFilter, getStockQty]);

  const renderIngredientSearchItem = (ing: Ingredient, query: string, highlightRanges: [number, number][]) => {
    const qty = getStockQty(ing.id);
    const status = getStockStatus(qty, ing.minThreshold);
    return (
      <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-purple-500">
            <Package size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-700">
              <HighlightText text={ing.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">
              <HighlightText text={ing.category} query={query} highlightRanges={highlightRanges} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-purple-600">{qty} {ing.unit}</div>
          <span className={`text-[8px] font-black uppercase tracking-widest ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
      </div>
    );
  };

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleArchive = async (id: string, name: string) => {
    const confirmed = await askConfirm('Archive Ingredient', `Are you sure you want to archive ${name}?`);
    if (confirmed) {
      archiveIngredient(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <AutocompleteInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSelect={(ing) => {
                setSearchTerm('');
                setAdjustingIngredient(ing);
              }}
              items={activeIngredients}
              searchFields={['name', 'category', 'barcode']}
              renderItem={renderIngredientSearchItem}
              placeholder="Search name, category or barcode..."
              icon={<Search size={18} />}
              maxResults={8}
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-background shadow-neumorphic outline-none text-sm border-none min-w-[150px]"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-background shadow-neumorphic outline-none text-sm border-none min-w-[150px]"
          >
            <option value="All">All Statuses</option>
            <option value="OK">OK</option>
            <option value="Low">Low</option>
            <option value="Critical">Critical</option>
            <option value="Empty">Empty</option>
          </select>
        </div>
        <div className="flex gap-4 w-full lg:w-auto justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 transition-all"
          >
            <Plus size={20} />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-background rounded-[32px] p-6 shadow-neumorphic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">Name</th>
                <th className="pb-4 px-4">Category</th>
                <th className="pb-4 px-4 text-center">Unit</th>
                <th className="pb-4 px-4 text-center">Current Stock</th>
                <th className="pb-4 px-4 text-center">Min Threshold</th>
                <th className="pb-4 px-4 text-right">Cost/Unit</th>
                <th className="pb-4 px-4 text-right">Stock Value</th>
                <th className="pb-4 px-4 text-center">Status</th>
                <th className="pb-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {paginatedIngredients.map((ing, idx) => {
                const qty = getStockQty(ing.id);
                const status = getStockStatus(qty, ing.minThreshold);
                const stockValue = qty * ing.costPerUnit;
                
                return (
                  <tr key={ing.id} className={`group hover:bg-primary/5 transition-all ${idx % 2 === 0 ? 'bg-background' : 'bg-gray-50/30'}`}>
                    <td className="py-4 px-4">
                      <p className="text-sm font-black text-primary">{ing.name}</p>
                      {ing.altName && <p className="text-[10px] font-bold text-text-secondary">{ing.altName}</p>}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-text-secondary uppercase">
                        {ing.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary">
                      {ing.unit}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => setAdjustingIngredient(ing)}
                        className="text-sm font-black text-primary hover:underline"
                      >
                        {qty.toLocaleString()}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-bold text-text-secondary">
                      {ing.minThreshold}
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-bold text-text-primary">
                      {ing.costPerUnit.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-black text-primary">
                      {stockValue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setAdjustingIngredient(ing)}
                          title="Adjust Stock"
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                        >
                          <TrendingUp size={14} />
                        </button>
                        <button 
                          onClick={() => setHistoryIngredient(ing)}
                          title="Movement History"
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-blue-600 hover:shadow-neumorphic-inset transition-all"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingIngredient(ing)}
                          title="Edit Ingredient"
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-orange-600 hover:shadow-neumorphic-inset transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleArchive(ing.id, ing.name)}
                          title="Archive"
                          className="p-2 rounded-xl bg-background shadow-neumorphic text-red-600 hover:shadow-neumorphic-inset transition-all"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-300/30">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredIngredients.length)} of {filteredIngredients.length} ingredients
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-background shadow-neumorphic disabled:opacity-30 disabled:shadow-none text-primary"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center px-4 font-black text-primary">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-background shadow-neumorphic disabled:opacity-30 disabled:shadow-none text-primary"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(isAddModalOpen || editingIngredient) && (
        <AddIngredientModal 
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingIngredient(null);
          }}
          onSave={(ing, openingStock) => {
            if (editingIngredient) {
              updateIngredient(editingIngredient.id, ing);
            } else {
              const newIng = addIngredient(ing);
              if (openingStock && openingStock > 0) {
                adjustStock(newIng.id, openingStock, 'Opening Stock', 'MANUAL');
              }
            }
          }}
          editData={editingIngredient}
        />
      )}

      {adjustingIngredient && (
        <StockAdjustmentModal 
          ingredient={adjustingIngredient}
          currentQty={getStockQty(adjustingIngredient.id)}
          onClose={() => setAdjustingIngredient(null)}
        />
      )}

      {historyIngredient && (
        <MovementHistoryModal 
          ingredient={historyIngredient}
          onClose={() => setHistoryIngredient(null)}
        />
      )}
    </div>
  );
};

export default StockRegister;

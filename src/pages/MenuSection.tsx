import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, UtensilsCrossed } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import CategoryTabs from '../components/menu/CategoryTabs';
import MenuGrid from '../components/menu/MenuGrid';
import DealsGrid from '../components/menu/DealsGrid';
import { useItemAdd } from '../hooks/useItemAdd';
import VariantModal from '../components/modals/VariantModal';
import ModifierModal from '../components/modals/ModifierModal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import HighlightText from '../components/ui/HighlightText';
import { fuzzySearch } from '../utils/autocompleteEngine';
import { trackSearch } from '../utils/searchAnalytics';
import { MenuItem } from '../types';

const MenuSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { menuItems, activeCategory, getItemsByCategory, menuCategories } = useMenuStore();
  const { 
    handleItemAdd, 
    variantModalOpen, 
    modifierModalOpen, 
    variantModalProps, 
    modifierModalProps 
  } = useItemAdd();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results = fuzzySearch(searchQuery, menuItems, ['name', 'altName', 'code'], { maxResults: 50 });
    trackSearch(searchQuery, results.length);
    return results;
  }, [searchQuery, menuItems]);

  const filteredItems = useMemo(() => {
    if (searchQuery.trim() === '') {
      return getItemsByCategory(activeCategory);
    }
    return searchResults.map(r => r.item);
  }, [searchQuery, activeCategory, getItemsByCategory, searchResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const renderSearchItem = (item: MenuItem, query: string, highlightRanges: [number, number][]) => {
    const category = menuCategories.find(c => c.id === item.category);
    const hasModifiers = item.modifiers && item.modifiers.length > 0;

    return (
      <div className="p-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-purple-500">
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-700">
              <HighlightText text={item.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {category?.name || 'General'}
              </span>
              {hasModifiers && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Has Modifiers" />}
              {item.code && <span className="text-[10px] text-gray-400 font-mono">#{item.code}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-purple-600">Rs. {item.price}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Search Bar */}
      <div className="relative">
        <AutocompleteInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={(item) => {
            handleItemAdd(item);
            trackSearch(searchQuery, searchResults.length, item.name);
            setSearchQuery('');
          }}
          items={menuItems}
          searchFields={['name', 'altName', 'code']}
          renderItem={renderSearchItem}
          placeholder="Search menu items..."
          icon={<Search size={18} />}
          maxResults={8}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-primary z-10"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Category Tabs - Hidden when searching */}
      {!searchQuery && <CategoryTabs />}

      {/* Results Count when searching */}
      {searchQuery && (
        <div className="px-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
          {filteredItems.length} results for '{searchQuery}'
        </div>
      )}

      {/* Menu Grid */}
      <div className="flex-1 overflow-hidden">
        {activeCategory === 'deals' && !searchQuery ? (
          <DealsGrid />
        ) : (
          <MenuGrid items={filteredItems} onAdd={handleItemAdd} />
        )}
      </div>

      {/* Modals */}
      {variantModalOpen && <VariantModal {...variantModalProps} />}
      {modifierModalOpen && <ModifierModal {...modifierModalProps} />}
    </div>
  );
};

export default MenuSection;

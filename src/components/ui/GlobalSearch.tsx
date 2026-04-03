import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Command, Package, Users, ClipboardList, 
  Settings, LayoutDashboard, Utensils, History, Database,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventoryStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { fuzzySearch } from '../../utils/autocompleteEngine';
import { SearchResult } from '../../types';
import HighlightText from './HighlightText';

interface PageItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

interface GlobalSearchResult {
  type: 'menu' | 'customer' | 'ingredient' | 'order' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  originalItem: any;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const { ingredients } = useInventoryStore();
  const { history } = useHistoryStore();
  const { currentUser } = useAuthStore();

  // Pages for navigation search
  const pages: PageItem[] = useMemo(() => [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { title: 'Menu', path: '/menu', icon: <Utensils size={16} /> },
    { title: 'Inventory', path: '/inventory', icon: <Database size={16} /> },
    { title: 'Order History', path: '/history', icon: <History size={16} /> },
    { title: 'CRM / Customers', path: '/crm', icon: <Users size={16} /> },
    { title: 'Settings', path: '/settings', icon: <Settings size={16} /> },
  ], []);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const allResults: GlobalSearchResult[] = [];

    // 1. Search Pages
    const pageMatches = fuzzySearch(query, pages, ['title'], { maxResults: 3 });
    pageMatches.forEach(m => {
      allResults.push({
        type: 'page',
        id: m.item.path,
        title: m.item.title,
        subtitle: 'Navigation',
        icon: m.item.icon,
        path: m.item.path,
        originalItem: m
      });
    });

    // 2. Search Ingredients
    const ingMatches = fuzzySearch(query, ingredients.filter(i => !i.archived), ['name', 'category'], { maxResults: 5 });
    ingMatches.forEach(m => {
      allResults.push({
        type: 'ingredient',
        id: m.item.id,
        title: m.item.name,
        subtitle: `Ingredient • ${m.item.category}`,
        icon: <Package size={16} className="text-purple-500" />,
        path: '/inventory',
        originalItem: m
      });
    });

    // 3. Search Orders
    const orderMatches = fuzzySearch(query, history, ['id', 'table', 'waiter'], { maxResults: 5 });
    orderMatches.forEach(m => {
      allResults.push({
        type: 'order',
        id: m.item.id,
        title: `Order #${m.item.id}`,
        subtitle: `Table ${m.item.table} • ${m.item.waiter}`,
        icon: <ClipboardList size={16} className="text-blue-500" />,
        path: '/history',
        originalItem: m
      });
    });

    return allResults;
  }, [query, pages, ingredients, history]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback((result: GlobalSearchResult) => {
    if (result.path) {
      navigate(result.path);
    }
    if (result.action) {
      result.action();
    }
    setIsOpen(false);
    setQuery('');
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[10vh] p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-background rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-6 border-b border-gray-300/30 flex items-center gap-4">
              <Search className="text-primary" size={24} />
              <input
                autoFocus
                type="text"
                placeholder="Search anything (menu, orders, inventory, pages)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-text-primary placeholder:text-text-secondary/50"
              />
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-[10px] font-black text-text-secondary uppercase">
                <Command size={10} />
                <span>K</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        selectedIndex === idx 
                          ? 'bg-primary text-white shadow-lg' 
                          : 'hover:bg-gray-50 text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedIndex === idx ? 'bg-white/20' : 'bg-background shadow-neumorphic'
                        }`}>
                          {result.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm">
                            <HighlightText 
                              text={result.title} 
                              query={query} 
                              highlightRanges={result.originalItem.highlightRanges || []} 
                            />
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${
                            selectedIndex === idx ? 'text-white/70' : 'text-text-secondary'
                          }`}>
                            {result.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className={selectedIndex === idx ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-text-secondary">
                    <Search size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">No results found for "{query}"</p>
                    <p className="text-xs text-text-secondary">Try searching for something else</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4 ml-2">Quick Navigation</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {pages.map(page => (
                        <button
                          key={page.path}
                          onClick={() => handleSelect({ type: 'page', id: page.path, title: page.title, icon: page.icon, path: page.path, originalItem: {} })}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all text-left"
                        >
                          <div className="text-primary">{page.icon}</div>
                          <span className="text-xs font-bold text-text-primary">{page.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-300/30 flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><ArrowRight size={10} className="rotate-90" /> Select</span>
                <span className="flex items-center gap-1"><ArrowRight size={10} className="-rotate-90" /> Navigate</span>
                <span className="flex items-center gap-1">Enter to Open</span>
              </div>
              <div>
                ESC to Close
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;

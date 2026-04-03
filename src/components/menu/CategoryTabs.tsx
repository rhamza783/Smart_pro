import React from 'react';
import { useMenuStore } from '../../store/menuStore';
import { useDealStore } from '../../store/dealStore';

const CategoryTabs: React.FC = () => {
  const { menuCategories, activeCategory, setActiveCategory } = useMenuStore();
  const { getActiveDeals } = useDealStore();

  const sortedCategories = [...menuCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeDeals = getActiveDeals();

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
      {sortedCategories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              px-6 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-bold text-sm
              ${isActive 
                ? 'bg-primary text-white shadow-lg scale-105' 
                : 'bg-background shadow-neumorphic text-text-secondary hover:text-primary'
              }
            `}
          >
            {cat.name}
          </button>
        );
      })}
      
      {activeDeals.length > 0 && (
        <button
          onClick={() => setActiveCategory('deals')}
          className={`
            px-6 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-bold text-sm
            ${activeCategory === 'deals' 
              ? 'bg-purple-600 text-white shadow-lg scale-105' 
              : 'bg-background shadow-neumorphic text-purple-600 hover:text-purple-700'
            }
          `}
        >
          🔥 Deals
        </button>
      )}
    </div>
  );
};

export default CategoryTabs;

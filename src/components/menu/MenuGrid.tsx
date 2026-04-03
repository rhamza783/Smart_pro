import React from 'react';
import { MenuItem } from '../../types';
import MenuItemButton from './MenuItemButton';

interface MenuGridProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ items, onAdd }) => {
  if (items.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-text-secondary italic">
        No items in this category
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar pb-10">
      {items.map((item) => (
        <MenuItemButton 
          key={item.id} 
          item={item} 
          onAdd={onAdd} 
        />
      ))}
    </div>
  );
};

export default MenuGrid;

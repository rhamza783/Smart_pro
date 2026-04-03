import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';

interface MenuItemButtonProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const MenuItemButton: React.FC<MenuItemButtonProps> = ({ item, onAdd }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isDisabled = item.status === 'disabled';

  const handleMouseDown = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div className="relative">
      <button
        disabled={isDisabled}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={() => onAdd(item)}
        className={`
          w-full h-[80px] rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-150 relative
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed bg-background shadow-neumorphic-inset' 
            : 'bg-background shadow-neumorphic hover:scale-105 active:scale-95 active:shadow-neumorphic-inset'
          }
        `}
      >
        <span className="font-bold text-sm text-center leading-tight line-clamp-2">
          {item.name}
        </span>
        
        <div className="mt-1">
          {item.variants && item.variants.length > 0 ? (
            <span className="text-[10px] font-bold text-orange-500 uppercase">Options</span>
          ) : (
            <span className="text-xs font-bold text-primary">Rs. {item.price}</span>
          )}
        </div>

        {/* Modifiers Indicator */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-sm" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-text-primary text-white text-[10px] p-2 rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none">
          <p className="font-bold">{item.name}</p>
          <p>Base Price: Rs. {item.price}</p>
          {item.variants && <p>{item.variants.length} Variants Available</p>}
        </div>
      )}
    </div>
  );
};

export default MenuItemButton;

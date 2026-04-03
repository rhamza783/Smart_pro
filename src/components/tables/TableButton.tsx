import React, { useEffect, useState } from 'react';
import { Lock, Monitor } from 'lucide-react';
import { useSyncStore } from '../../store/syncStore';

interface TableButtonProps {
  tableName: string;
  status: 'empty' | 'occupied';
  onClick: () => void;
  minutesOpen?: number;
  totalAmount?: number;
  itemCount?: number;
  isReserved?: boolean;
  isBlocked?: boolean;
}

const TableButton: React.FC<TableButtonProps> = ({ 
  tableName, 
  status, 
  onClick, 
  minutesOpen,
  totalAmount,
  itemCount,
  isReserved,
  isBlocked
}) => {
  const { activeTabs, tabId } = useSyncStore();
  const isEmpty = status === 'empty';
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Check if table is locked by another tab
  const lockedTab = activeTabs.find(t => t.currentTable === tableName && t.tabId !== tabId);
  const isLockedByOther = !!lockedTab;

  useEffect(() => {
    if (!isEmpty) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isEmpty]);

  return (
    <button
      onClick={onClick}
      className={`
        w-full h-full rounded-2xl flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden
        ${isEmpty 
          ? 'bg-background shadow-neumorphic text-text-primary hover:scale-105 active:shadow-neumorphic-inset' 
          : 'bg-background shadow-neumorphic-inset text-primary border-2 border-primary scale-95'
        }
        ${isReserved ? 'border-2 border-[#6750A4]/50' : ''}
        ${isBlocked && isEmpty ? 'bg-red-500/10 border-red-500/30' : ''}
      `}
    >
      {isReserved && (
        <div className="absolute top-1 right-1 text-[#6750A4]">
          <Lock size={12} />
        </div>
      )}

      {isLockedByOther && (
        <div className="absolute top-1 left-1 text-orange-500 animate-pulse">
          <Monitor size={12} />
        </div>
      )}

      <span className="font-bold text-lg leading-tight">{tableName}</span>
      
      {isLockedByOther ? (
        <div className="absolute inset-0 bg-orange-500/10 flex flex-col items-center justify-center pointer-events-none">
          <Monitor size={24} className="text-orange-500/30 mb-1" />
          <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest border border-orange-600/30 px-1 rounded bg-white/80">
            Editing in Tab {lockedTab.tabId.slice(0, 4)}
          </span>
        </div>
      ) : isBlocked && isEmpty ? (
        <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest rotate-[-15deg] border-2 border-red-600/30 px-1 rounded">Reserved</span>
        </div>
      ) : isReserved && isEmpty ? (
        <span className="text-[10px] font-bold text-[#6750A4] uppercase tracking-tighter mt-1">Upcoming</span>
      ) : !isEmpty ? (
        <div className="flex flex-col items-center mt-1">
          <span className="text-primary text-[10px] font-bold">
            {minutesOpen} min
          </span>
          {totalAmount !== undefined && (
            <span className="text-success text-[10px] font-black mt-0.5">
              PKR {totalAmount.toLocaleString()}
            </span>
          )}
          {itemCount !== undefined && (
            <span className="text-text-secondary text-[8px] font-medium">
              {itemCount} items
            </span>
          )}
        </div>
      ) : null}
    </button>
  );
};

export default TableButton;

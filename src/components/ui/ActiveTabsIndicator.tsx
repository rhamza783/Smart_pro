import React, { useState } from 'react';
import { Monitor, ChevronDown, User, MapPin, Clock } from 'lucide-react';
import { useSyncStore } from '../../store/syncStore';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveTabsIndicator: React.FC = () => {
  const { activeTabs, tabId } = useSyncStore();
  const [isOpen, setIsOpen] = useState(false);

  if (activeTabs.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all"
      >
        <Monitor size={16} />
        <span className="text-xs font-bold">{activeTabs.length} tabs</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-72 bg-background rounded-2xl shadow-2xl z-50 p-4 border border-gray-200"
            >
              <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">Active POS Sessions</h3>
              
              <div className="space-y-3">
                {activeTabs.map((tab) => (
                  <div 
                    key={tab.tabId}
                    className={`p-3 rounded-xl border ${tab.tabId === tabId ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 border-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className={tab.tabId === tabId ? 'text-primary' : 'text-text-secondary'} />
                        <span className="text-xs font-bold">
                          Tab {tab.tabId.slice(0, 4)}
                          {tab.tabId === tabId && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] uppercase">You</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <Clock size={10} />
                        <span>{new Date(tab.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                        <User size={10} />
                        <span className="truncate">{tab.currentUser || 'No User'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                        <MapPin size={10} />
                        <span className="truncate">{tab.currentTable || 'No Table'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Current Section</span>
                      <span className="text-[9px] font-black text-primary uppercase">{tab.activeSection}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveTabsIndicator;

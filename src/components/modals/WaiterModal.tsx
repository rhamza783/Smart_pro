import React, { useState } from 'react';
import { X, User, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ZoneSettings, AppUser } from '../../types';
import AutocompleteInput from '../ui/AutocompleteInput';
import HighlightText from '../ui/HighlightText';

interface WaiterModalProps {
  onSelect: (waiterName: string) => void;
  onClose: () => void;
  zoneSettings: ZoneSettings;
}

const WaiterModal: React.FC<WaiterModalProps> = ({ onSelect, onClose }) => {
  const workers = useAuthStore(state => state.appWorkers);
  const waiters = workers.filter(w => w.role === 'Waiter');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (name: string) => {
    onSelect(name);
  };

  const renderWaiterSearchItem = (waiter: AppUser, query: string, highlightRanges: [number, number][]) => {
    return (
      <div className="p-3 flex items-center justify-between hover:bg-primary/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm">
              <HighlightText text={waiter.name} query={query} highlightRanges={highlightRanges} />
            </div>
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              {waiter.role}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-[380px] rounded-3xl p-6 shadow-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">Select Waiter</h2>
          <p className="text-sm text-text-secondary">Who is serving this table?</p>
        </div>

        <div className="mb-6">
          <AutocompleteInput
            value={searchTerm}
            onChange={setSearchTerm}
            onSelect={(waiter) => handleSelect(waiter.name)}
            items={waiters}
            searchFields={['name']}
            renderItem={renderWaiterSearchItem}
            placeholder="Search waiter..."
            icon={<Search size={18} />}
          />
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {waiters.length > 0 ? (
            waiters.map((waiter) => (
              <button
                key={waiter.login}
                onClick={() => handleSelect(waiter.name)}
                className="w-full flex justify-between items-center p-4 rounded-2xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <User size={20} />
                  </div>
                  <span className="font-bold text-text-primary">{waiter.name}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary px-2 py-1 rounded-full">
                  {waiter.role}
                </span>
              </button>
            ))
          ) : (
            <button
              onClick={() => handleSelect('Staff')}
              className="w-full flex justify-between items-center p-4 rounded-2xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <span className="font-bold text-text-primary">Staff</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary px-2 py-1 rounded-full">
                Default
              </span>
            </button>
          )}
        </div>

        <button
          onClick={() => handleSelect('Staff')}
          className="w-full mt-8 py-4 rounded-2xl font-bold text-text-secondary bg-background shadow-neumorphic hover:text-primary transition-all active:shadow-neumorphic-inset"
        >
          Skip / No Waiter
        </button>
      </div>
    </div>
  );
};

export default WaiterModal;

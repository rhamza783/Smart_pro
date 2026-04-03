import React, { useState, useEffect } from 'react';
import { useSettingsStore, Shortcut } from '../../store/settingsStore';
import { Keyboard, RotateCcw, Save, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrompt } from '../../hooks/usePrompt';

const ShortcutsSettings: React.FC = () => {
  const { shortcuts, updateShortcuts } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>(shortcuts);

  useEffect(() => {
    if (!recordingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      let combo = '';
      if (e.ctrlKey) combo += 'Ctrl+';
      if (e.shiftKey) combo += 'Shift+';
      if (e.altKey) combo += 'Alt+';
      
      if (e.key.startsWith('F') && e.key.length > 1) {
        combo += e.key;
      } else if (e.key === ' ') {
        combo += 'Space';
      } else if (e.key.length === 1) {
        combo += e.key.toUpperCase();
      } else if (['Control', 'Shift', 'Alt'].includes(e.key)) {
        // Don't save if only modifier is pressed
        return;
      } else {
        combo += e.key;
      }

      const newShortcuts = localShortcuts.map(s => 
        s.id === recordingId ? { ...s, key: combo } : s
      );
      setLocalShortcuts(newShortcuts);
      setRecordingId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingId, localShortcuts]);

  const handleReset = (id: string) => {
    const newShortcuts = localShortcuts.map(s => 
      s.id === id ? { ...s, key: s.defaultKey } : s
    );
    setLocalShortcuts(newShortcuts);
  };

  const handleResetAll = async () => {
    const confirmed = await askConfirm('Reset Shortcuts', 'Are you sure you want to reset all keyboard shortcuts to default?');
    if (confirmed) {
      const newShortcuts = localShortcuts.map(s => ({ ...s, key: s.defaultKey }));
      setLocalShortcuts(newShortcuts);
    }
  };

  const handleSave = () => {
    updateShortcuts(localShortcuts);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-inner">
            <Keyboard size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800">Keyboard Shortcuts</h3>
            <p className="text-sm text-gray-500 font-medium">Customize your POS experience with quick actions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localShortcuts.map((shortcut) => (
            <div 
              key={shortcut.id}
              className="bg-[#E0E5EC] p-6 rounded-2xl shadow-[5px_5px_10px_rgb(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.4)] border border-white/20"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{shortcut.name}</span>
                {shortcut.key !== shortcut.defaultKey && (
                  <button 
                    onClick={() => handleReset(shortcut.id)}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                    title="Reset to default"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className={`flex-1 py-3 px-4 rounded-xl text-center font-black text-lg shadow-inner transition-all ${
                  recordingId === shortcut.id ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-500' : 'bg-gray-200/50 text-gray-700'
                }`}>
                  {recordingId === shortcut.id ? 'Press Key...' : shortcut.key}
                </div>
                
                <button
                  onClick={() => setRecordingId(shortcut.id)}
                  className={`p-3 rounded-xl shadow-md transition-all ${
                    recordingId === shortcut.id ? 'bg-red-500 text-white' : 'bg-white text-purple-600 hover:scale-105'
                  }`}
                >
                  <Keyboard size={18} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold">Default: {shortcut.defaultKey}</span>
                <button className="text-[10px] text-purple-600 font-black uppercase tracking-tighter hover:underline">
                  Test Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-300 transition-all"
        >
          <RotateCcw size={18} />
          Reset All to Default
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all"
        >
          <Save size={18} />
          Save All Shortcuts
        </button>
      </div>
    </div>
  );
};

export default ShortcutsSettings;

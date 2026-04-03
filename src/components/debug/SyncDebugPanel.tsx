import React, { useState } from 'react';
import { Terminal, Trash2, Send, Activity, Shield, Users } from 'lucide-react';
import { useSyncStore } from '../../store/syncStore';
import { motion, AnimatePresence } from 'framer-motion';

const SyncDebugPanel: React.FC = () => {
  const { 
    tabId, 
    activeTabs, 
    isLeaderTab, 
    syncErrors, 
    broadcast,
    lastSyncAt
  } = useSyncStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  if (process.env.NODE_ENV !== 'development') return null;

  const handleSendTest = () => {
    if (!testMessage) return;
    broadcast('SETTINGS_CHANGED' as any, { debug: testMessage });
    setTestMessage('');
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
      >
        <Terminal size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-12 left-0 w-96 bg-gray-900 text-gray-300 rounded-2xl shadow-2xl overflow-hidden border border-gray-800"
          >
            <div className="p-4 bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-primary" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Sync Debugger</h3>
              </div>
              <div className="flex items-center gap-2">
                {isLeaderTab && (
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-black uppercase">Leader</span>
                )}
                <span className="text-[10px] font-mono text-gray-500">{tabId.slice(0, 8)}</span>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Users size={12} />
                    <span className="text-[10px] font-bold uppercase">Active Tabs</span>
                  </div>
                  <span className="text-xl font-black text-white">{activeTabs.length}</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Activity size={12} />
                    <span className="text-[10px] font-bold uppercase">Last Sync</span>
                  </div>
                  <span className="text-[10px] font-mono text-white">
                    {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Active Tabs List */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Network Nodes</h4>
                <div className="space-y-1">
                  {activeTabs.map(tab => (
                    <div key={tab.tabId} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg text-[10px] font-mono">
                      <span className={tab.tabId === tabId ? 'text-primary' : 'text-gray-400'}>
                        {tab.tabId.slice(0, 8)}
                      </span>
                      <span className="text-gray-600">{tab.activeSection}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Broadcast */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Test Broadcast</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter debug payload..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleSendTest}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Error Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Conflict Log</h4>
                  <button className="text-gray-600 hover:text-white transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="bg-black/30 rounded-xl p-3 min-h-[100px] max-h-[150px] overflow-y-auto font-mono text-[10px]">
                  {syncErrors.length === 0 ? (
                    <span className="text-gray-700 italic">No conflicts detected...</span>
                  ) : (
                    syncErrors.map((err, i) => (
                      <div key={i} className="mb-2 last:mb-0 border-b border-gray-800 pb-2">
                        <div className="text-red-400 mb-1">[{new Date(err.timestamp).toLocaleTimeString()}]</div>
                        <div className="text-gray-400">{err.error}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncDebugPanel;

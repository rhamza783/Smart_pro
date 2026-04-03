import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useSyncStore } from '../../store/syncStore';
import { motion, AnimatePresence } from 'framer-motion';

const SyncStatusIndicator: React.FC = () => {
  const { channel, lastSyncAt, syncErrors } = useSyncStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (syncErrors.length > 0) return 'bg-orange-500';
    if (channel) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={14} className="text-red-500" />;
    if (syncErrors.length > 0) return <AlertCircle size={14} className="text-orange-500" />;
    if (channel) return <CheckCircle size={14} className="text-green-500" />;
    return <RefreshCw size={14} className="text-gray-400 animate-spin" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncErrors.length > 0) return 'Sync Error';
    if (channel) return 'Synced';
    return 'Connecting...';
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-sm`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{getStatusText()}</span>
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 bg-background rounded-2xl shadow-2xl z-50 p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon()}
              <h3 className="text-xs font-bold">Multi-Tab Sync Status</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary">Network:</span>
                <span className={isOnline ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary">Broadcast Channel:</span>
                <span className={channel ? 'text-green-600 font-bold' : 'text-gray-400 font-bold'}>
                  {channel ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary">Last Sync:</span>
                <span className="text-text-primary font-bold">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>

            {syncErrors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-[10px] font-bold text-red-500 mb-1">Recent Errors</h4>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {syncErrors.slice(-3).map((err, i) => (
                    <p key={i} className="text-[9px] text-text-secondary leading-tight">
                      • {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncStatusIndicator;

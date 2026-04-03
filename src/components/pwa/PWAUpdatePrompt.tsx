import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

const PWAUpdatePrompt: React.FC = () => {
  const { swUpdateAvailable, updateApp, needRefresh, setNeedRefresh } = usePWA();

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[9999] w-full max-w-sm"
        >
          <div className="bg-[#E0E5EC] p-6 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-inner">
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">Update Available!</h3>
                <p className="text-sm text-gray-500 font-medium">New version available with latest features.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateApp()}
                className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all"
              >
                Update Now
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-300 transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;

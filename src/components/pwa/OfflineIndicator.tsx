import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="bg-red-600 text-white py-3 px-6 shadow-lg flex items-center justify-center gap-3 pointer-events-auto"
          >
            <WifiOff className="w-5 h-5 animate-pulse" />
            <span className="font-black text-sm uppercase tracking-widest">
              You are offline — POS is still fully operational
            </span>
          </motion.div>
        )}

        {isOnline && showRestored && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="bg-green-500 text-white py-3 px-6 shadow-lg flex items-center justify-center gap-3 pointer-events-auto"
          >
            <Wifi className="w-5 h-5" />
            <span className="font-black text-sm uppercase tracking-widest">
              Connection restored
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineIndicator;

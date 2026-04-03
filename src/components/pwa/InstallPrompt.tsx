import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

const InstallPrompt: React.FC = () => {
  const { canInstall, installApp, isInstalled } = usePWA();
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed && !isInstalled) {
      if (canInstall || isIOSDevice) {
        setShow(true);
      }
    }
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShow(false);
  };

  const handleInstall = async () => {
    if (isIOS) return;
    await installApp();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && !isInstalled && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-6 left-6 z-[9998] w-full max-w-sm"
        >
          <div className="bg-[#E0E5EC] p-6 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-2xl">
                AMS
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-800">Install AL-MADINA POS</h3>
                <p className="text-sm text-gray-500 font-medium">Add to home screen for faster access</p>
              </div>
              <button onClick={handleDismiss} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 text-xs font-bold flex items-center gap-3 border border-purple-100">
                <Share size={18} />
                <span>To install: tap the Share button then 'Add to Home Screen'</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-300 transition-all"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;

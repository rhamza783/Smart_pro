import React, { useState } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'motion/react';

interface ManagerPINModalProps {
  onApprove: () => void;
  onClose: () => void;
}

const ManagerPINModal: React.FC<ManagerPINModalProps> = ({ onApprove, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const appWorkers = useAuthStore(state => state.appWorkers);

  const handleApprove = () => {
    // Check if PIN matches any Admin or Manager password
    const approved = appWorkers.some(w => 
      (w.role === 'Admin' || w.role === 'Manager') && w.pass === pin
    );

    if (approved) {
      onApprove();
    } else {
      setError('Incorrect PIN');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-[#E0E5EC] rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden ${isShaking ? 'animate-shake' : ''}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-700 uppercase tracking-tight">Manager Approval</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-6 font-medium">
            This action requires a Manager or Admin PIN to proceed.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter Manager PIN"
                className="w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-lg tracking-[0.5em] font-black text-center"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleApprove()}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-xs font-bold text-center uppercase tracking-wider"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleApprove}
              className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:bg-purple-700 transition-all active:shadow-inner uppercase tracking-widest text-sm"
            >
              Approve Action
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ManagerPINModal;

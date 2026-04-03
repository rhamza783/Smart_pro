import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToastStore } from '../../store/toastStore';

const Toast: React.FC = () => {
  const { message, type, hideToast } = useToastStore();

  const bgColors = {
    info: 'bg-text-secondary',
    success: 'bg-success',
    error: 'bg-danger'
  };

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`${bgColors[type]} text-white px-6 py-3 rounded-2xl shadow-neumorphic pointer-events-auto flex items-center gap-3 font-medium`}
            onClick={hideToast}
          >
            {message}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

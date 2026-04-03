import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, History } from 'lucide-react';

interface ReadOnlyBannerProps {
  orderId: string;
  onExit: () => void;
}

const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({ orderId, onExit }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500 text-white p-4 rounded-3xl shadow-lg shadow-red-200 flex items-center justify-between mb-4 mx-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <History className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Read Only Mode</p>
          <p className="text-sm font-black uppercase tracking-tighter">Historical Order #{orderId}</p>
        </div>
      </div>
      <button 
        onClick={onExit}
        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center gap-2"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">Exit</span>
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ReadOnlyBanner;

import React from 'react';
import { motion } from 'motion/react';
import { useDealStore } from '../../store/dealStore';
import { Deal } from '../../types';
import { useDealAdd } from '../../hooks/useDealAdd';

const DealsGrid: React.FC = () => {
  const { getActiveDeals } = useDealStore();
  const { handleDealAdd } = useDealAdd();
  const activeDeals = getActiveDeals();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar h-full pr-2">
      {activeDeals.map((deal) => {
        const totalOriginal = deal.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const savings = totalOriginal - deal.price;

        return (
          <motion.button
            key={deal.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDealAdd(deal)}
            className="relative flex flex-col items-center justify-center p-4 bg-background rounded-[24px] shadow-neumorphic hover:shadow-neumorphic-inset transition-all border-2 border-transparent hover:border-yellow-400 h-[100px] w-full group"
          >
            <span className="absolute top-2 left-2 text-sm">🔥</span>
            <span className="text-xs font-black text-text-primary text-center line-clamp-2 mb-1 px-1">
              {deal.name}
            </span>
            <span className="text-[10px] font-black text-purple-600">
              PKR {deal.price.toLocaleString()}
            </span>
            {savings > 0 && (
              <span className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-tighter">
                Save PKR {savings.toLocaleString()}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default DealsGrid;

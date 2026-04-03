import React from 'react';
import { Delete } from 'lucide-react';
import { hapticTap } from '../../utils/haptics';

interface NumpadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDecimal?: () => void;
  showDecimal?: boolean;
}

const Numpad: React.FC<NumpadProps> = ({
  onDigit,
  onBackspace,
  onDecimal,
  showDecimal = true,
}) => {
  const handlePress = (action: () => void) => {
    hapticTap();
    action();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => handlePress(() => onDigit(digit))}
          className="h-[60px] w-[60px] mx-auto rounded-2xl bg-white shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] active:scale-90 active:shadow-inner transition-all flex items-center justify-center text-xl font-bold text-gray-700"
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        onClick={() => handlePress(() => (showDecimal ? onDecimal?.() : {}))}
        className={`h-[60px] w-[60px] mx-auto rounded-2xl bg-white shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] active:scale-90 active:shadow-inner transition-all flex items-center justify-center text-2xl font-bold text-gray-700 ${!showDecimal ? 'opacity-0 cursor-default' : ''}`}
        disabled={!showDecimal}
      >
        .
      </button>

      <button
        type="button"
        onClick={() => handlePress(() => onDigit('0'))}
        className="h-[60px] w-[60px] mx-auto rounded-2xl bg-white shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] active:scale-90 active:shadow-inner transition-all flex items-center justify-center text-xl font-bold text-gray-700"
      >
        0
      </button>

      <button
        type="button"
        onClick={() => handlePress(onBackspace)}
        className="h-[60px] w-[60px] mx-auto rounded-2xl bg-red-50 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] active:scale-90 active:shadow-inner transition-all flex items-center justify-center text-red-500"
      >
        <Delete size={24} />
      </button>
    </div>
  );
};

export default Numpad;

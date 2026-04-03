import React from 'react';

interface NumpadDisplayProps {
  value: string;
  prefix?: string;
  suffix?: string;
  isActive?: boolean;
  hasError?: boolean;
}

const NumpadDisplay: React.FC<NumpadDisplayProps> = ({
  value,
  prefix,
  suffix,
  isActive = false,
  hasError = false,
}) => {
  return (
    <div
      className={`
        relative w-full p-4 rounded-2xl bg-gray-50 shadow-inner flex items-center justify-center
        transition-all duration-200
        ${isActive ? 'ring-2 ring-purple-500 bg-white' : ''}
        ${hasError ? 'ring-2 ring-red-500 animate-shake' : ''}
      `}
    >
      {prefix && (
        <span className="absolute left-4 text-sm font-medium text-gray-400 uppercase">
          {prefix}
        </span>
      )}
      
      <div className="flex items-center">
        <span className={`text-3xl font-bold ${hasError ? 'text-red-500' : 'text-purple-600'}`}>
          {value || '0'}
        </span>
        {isActive && (
          <span className="w-0.5 h-8 bg-purple-500 ml-1 animate-blink" />
        )}
      </div>

      {suffix && (
        <span className="absolute right-4 text-sm font-medium text-gray-400 uppercase">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default NumpadDisplay;

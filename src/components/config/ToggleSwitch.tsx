import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-text-primary">{label}</span>
        {description && <span className="text-xs text-text-secondary">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out
          ${checked ? 'bg-success' : 'bg-gray-300'}
          shadow-neumorphic-inset
        `}
      >
        <div
          className={`
            absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md
            transition-transform duration-300 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;

import React from 'react';

interface FontSelectorProps {
  idPrefix: string;
  currentFamily: string;
  currentStyle: string;
  onChange: (family: string, style: string) => void;
}

const fontFamilies = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Noto Nastaliq Urdu',
  'sans-serif',
  'serif',
  'monospace',
];

const fontStyles = ['Normal', 'Italic', 'Bold'];

const FontSelector: React.FC<FontSelectorProps> = ({
  idPrefix,
  currentFamily,
  currentStyle,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        id={`${idPrefix}-family`}
        value={currentFamily}
        onChange={(e) => onChange(e.target.value, currentStyle)}
        className="w-full p-2 text-sm rounded-xl shadow-neumorphic-inset bg-background outline-none border-none"
      >
        {fontFamilies.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-style`}
        value={currentStyle}
        onChange={(e) => onChange(currentFamily, e.target.value)}
        className="w-full p-2 text-sm rounded-xl shadow-neumorphic-inset bg-background outline-none border-none"
      >
        {fontStyles.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FontSelector;

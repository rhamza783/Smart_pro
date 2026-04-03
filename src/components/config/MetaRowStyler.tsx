import React from 'react';
import { PrintStyle } from '../../types';

interface MetaRowStylerProps {
  title: string;
  headingStyle: PrintStyle;
  valueStyle: PrintStyle;
  onHeadingChange: (style: PrintStyle) => void;
  onValueChange: (style: PrintStyle) => void;
}

const MetaRowStyler: React.FC<MetaRowStylerProps> = ({ 
  title, 
  headingStyle, 
  valueStyle, 
  onHeadingChange, 
  onValueChange 
}) => {
  const fontFamilies = ['Inter', 'Courier New', 'Georgia', 'Arial', 'Verdana', 'Times New Roman'];
  const fontStyles = ['Normal', 'Bold', 'Italic'];

const StyleControls = ({ style, onChange, label }: { style?: PrintStyle, onChange: (s: PrintStyle) => void, label: string }) => {
  if (!style) return null;
  return (
    <div className="flex-1">
      <label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={style.fontSize || ''}
          onChange={(e) => onChange({ ...style, fontSize: e.target.value })}
          className="w-full bg-[#E0E5EC] rounded-lg p-1 text-[10px] shadow-[inset_1px_1px_3px_#babecc,inset_-2px_-2px_5px_#ffffff] outline-none"
          placeholder="12px"
        />
        <select
          value={style.fontFamily || 'Inter'}
          onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
          className="w-full bg-[#E0E5EC] rounded-lg p-1 text-[10px] shadow-[inset_1px_1px_3px_#babecc,inset_-2px_-2px_5px_#ffffff] outline-none"
        >
          {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={style.fontStyle || 'Normal'}
          onChange={(e) => onChange({ ...style, fontStyle: e.target.value as any })}
          className="w-full bg-[#E0E5EC] rounded-lg p-1 text-[10px] shadow-[inset_1px_1px_3px_#babecc,inset_-2px_-2px_5px_#ffffff] outline-none"
        >
          {fontStyles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
};

  return (
    <div className="p-4 bg-[#E0E5EC] rounded-xl shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] mb-4">
      <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">{title}</h4>
      <div className="flex flex-col gap-4">
        <StyleControls label="Heading" style={headingStyle} onChange={onHeadingChange} />
        <StyleControls label="Value" style={valueStyle} onChange={onValueChange} />
      </div>
    </div>
  );
};

export default MetaRowStyler;

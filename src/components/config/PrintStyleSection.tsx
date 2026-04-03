import React from 'react';
import { PrintStyle } from '../../types';

interface PrintStyleSectionProps {
  title: string;
  style: PrintStyle;
  onChange: (newStyle: PrintStyle) => void;
}

const PrintStyleSection: React.FC<PrintStyleSectionProps> = ({ title, style, onChange }) => {
  const fontFamilies = ['Inter', 'Courier New', 'Georgia', 'Arial', 'Verdana', 'Times New Roman'];
  const fontStyles = ['Normal', 'Bold', 'Italic'];

  if (!style) return null;

  return (
    <div className="p-4 bg-[#E0E5EC] rounded-xl shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] mb-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1 uppercase">Size</label>
          <input
            type="text"
            value={style.fontSize || ''}
            onChange={(e) => onChange({ ...style, fontSize: e.target.value })}
            className="w-full bg-[#E0E5EC] rounded-lg p-2 text-xs shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none"
            placeholder="14px"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1 uppercase">Family</label>
          <select
            value={style.fontFamily || 'Inter'}
            onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
            className="w-full bg-[#E0E5EC] rounded-lg p-2 text-xs shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none"
          >
            {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1 uppercase">Style</label>
          <select
            value={style.fontStyle || 'Normal'}
            onChange={(e) => onChange({ ...style, fontStyle: e.target.value as any })}
            className="w-full bg-[#E0E5EC] rounded-lg p-2 text-xs shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none"
          >
            {fontStyles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PrintStyleSection;

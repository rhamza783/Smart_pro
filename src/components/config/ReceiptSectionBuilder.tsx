import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Settings2, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Type,
  Hash,
  QrCode,
  Layout
} from 'lucide-react';
import { ReceiptSection } from '../../types';

interface ReceiptSectionBuilderProps {
  sections: ReceiptSection[];
  onUpdate: (sections: ReceiptSection[]) => void;
}

const ReceiptSectionBuilder: React.FC<ReceiptSectionBuilderProps> = ({ sections, onUpdate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    onUpdate(sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const updateSection = (id: string, updates: Partial<ReceiptSection>) => {
    onUpdate(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addCustomSection = () => {
    const newSection: ReceiptSection = {
      id: crypto.randomUUID(),
      type: 'custom',
      isVisible: true,
      sortOrder: sections.length,
      customContent: 'New Custom Section'
    };
    onUpdate([...sections, newSection]);
  };

  const deleteSection = (id: string) => {
    onUpdate(sections.filter(s => s.id !== id));
  };

  const getIcon = (type: ReceiptSection['type']) => {
    switch (type) {
      case 'header': return <Layout size={16} />;
      case 'divider': return <Type size={16} />;
      case 'items': return <Layout size={16} />;
      case 'totals': return <Hash size={16} />;
      case 'footer': return <Layout size={16} />;
      case 'barcode': return <Hash size={16} />;
      case 'qr': return <QrCode size={16} />;
      default: return <Settings2 size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-tight text-text-secondary">Receipt Layout Sections</h3>
        <button
          onClick={addCustomSection}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
        >
          <Plus size={14} />
          Add Custom
        </button>
      </div>

      <Reorder.Group axis="y" values={sections} onReorder={onUpdate} className="space-y-3">
        {sections.map((section) => (
          <Reorder.Item
            key={section.id}
            value={section}
            className={`bg-background rounded-xl shadow-neumorphic overflow-hidden transition-all ${
              !section.isVisible ? 'opacity-50' : ''
            }`}
          >
            <div className="p-4 flex items-center gap-4">
              <div className="cursor-grab active:cursor-grabbing text-text-secondary">
                <GripVertical size={18} />
              </div>
              
              <div className={`p-2 rounded-lg bg-background shadow-neumorphic-inset ${section.isVisible ? 'text-primary' : 'text-text-secondary'}`}>
                {getIcon(section.type)}
              </div>

              <div className="flex-1">
                <div className="text-sm font-black uppercase tracking-tight">
                  {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                </div>
                {section.customContent && (
                  <div className="text-[10px] text-text-secondary truncate max-w-[200px]">
                    {section.customContent}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(section.id)}
                  className={`p-2 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all ${
                    section.isVisible ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {section.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="p-2 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-text-secondary transition-all"
                >
                  {expandedId === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {section.type === 'custom' && (
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {expandedId === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/50 bg-background-dark/10"
                >
                  <div className="p-4 space-y-4">
                    {section.type === 'divider' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Divider Style</label>
                        <select
                          value={section.customContent || '---'}
                          onChange={(e) => updateSection(section.id, { customContent: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-background shadow-neumorphic-inset text-xs outline-none"
                        >
                          <option value="---">Dashed (---)</option>
                          <option value="———">Solid (———)</option>
                          <option value="====">Double (====)</option>
                          <option value="***">Stars (***)</option>
                          <option value="None">None (Blank Line)</option>
                        </select>
                      </div>
                    )}

                    {(section.type === 'custom' || section.type === 'footer') && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Content</label>
                        <textarea
                          value={section.customContent || ''}
                          onChange={(e) => updateSection(section.id, { customContent: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-background shadow-neumorphic-inset text-xs outline-none min-h-[80px]"
                          placeholder="Enter custom text or placeholders like {{restaurant_name}}..."
                        />
                      </div>
                    )}

                    {section.type === 'qr' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">QR Content</label>
                        <select
                          value={section.customContent || 'order_id'}
                          onChange={(e) => updateSection(section.id, { customContent: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-background shadow-neumorphic-inset text-xs outline-none"
                        >
                          <option value="order_id">Order ID</option>
                          <option value="website">Website URL</option>
                          <option value="google_maps">Google Maps Link</option>
                          <option value="custom">Custom Text</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Spacing (Blank lines before/after)</label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <span className="text-[8px] uppercase text-text-secondary">Before</span>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={section.styles?.marginTop || 0}
                            onChange={(e) => updateSection(section.id, { styles: { ...section.styles, marginTop: e.target.value } })}
                            className="w-full px-3 py-1.5 rounded-lg bg-background shadow-neumorphic-inset text-xs outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[8px] uppercase text-text-secondary">After</span>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={section.styles?.marginBottom || 0}
                            onChange={(e) => updateSection(section.id, { styles: { ...section.styles, marginBottom: e.target.value } })}
                            className="w-full px-3 py-1.5 rounded-lg bg-background shadow-neumorphic-inset text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <button
        onClick={() => onUpdate([])} // This should be a reset to default function
        className="w-full py-3 rounded-xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-text-secondary text-xs font-black uppercase tracking-widest transition-all mt-4"
      >
        Reset to Default Order
      </button>
    </div>
  );
};

export default ReceiptSectionBuilder;

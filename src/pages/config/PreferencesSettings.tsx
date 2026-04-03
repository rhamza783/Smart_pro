import React, { useState } from 'react';
import { Palette, Check, Layout, Type } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import SectionCard from '../../components/config/SectionCard';
import FontSelector from '../../components/config/FontSelector';
import { usePrompt } from '../../hooks/usePrompt';

const themes = [
  { id: 'default-light', name: 'Default Light', color: '#6750A4' },
  { id: 'dark-mode', name: 'Dark Mode', color: '#1A1C1E' },
  { id: 'ocean-blue', name: 'Ocean Blue', color: '#0061A4' },
  { id: 'sunset-orange', name: 'Sunset Orange', color: '#9C4300' },
  { id: 'emerald-green', name: 'Emerald Green', color: '#006D3B' },
  { id: 'minimalist-gray', name: 'Minimalist Gray', color: '#5E5E5E' },
  { id: 'neon-purple', name: 'Neon Purple', color: '#D0BCFF' },
];

const PreferencesSettings: React.FC = () => {
  const { preferences, updatePreferences } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPrefs);
  };

  const handleThemeChange = (themeId: string) => {
    setLocalPrefs((prev) => ({ ...prev, theme: themeId }));
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Preferences', 'Are you sure you want to discard unsaved changes?');
    if (confirmed) {
      setLocalPrefs(preferences);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <SectionCard title="UI Theme Selector" icon={<Palette size={20} />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {themes.map((theme) => {
            const isSelected = localPrefs.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`
                  relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all
                  ${isSelected ? 'shadow-neumorphic-inset bg-background' : 'shadow-neumorphic bg-background hover:shadow-neumorphic-inset'}
                `}
              >
                <div 
                  className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.color }}
                >
                  {isSelected && <Check size={24} className="text-white" />}
                </div>
                <span className="text-xs font-bold text-text-secondary text-center">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Layout & Positioning" icon={<Layout size={20} />}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-primary">Cart Panel Position</span>
              <span className="text-xs text-text-secondary">Choose which side the cart panel appears on</span>
            </div>
            <div className="flex p-1 bg-background rounded-2xl shadow-neumorphic-inset">
              <button
                onClick={() => setLocalPrefs((prev) => ({ ...prev, cartPosition: 'left' }))}
                className={`
                  px-6 py-2 rounded-xl text-xs font-bold transition-all
                  ${localPrefs.cartPosition === 'left' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary'}
                `}
              >
                Left
              </button>
              <button
                onClick={() => setLocalPrefs((prev) => ({ ...prev, cartPosition: 'right' }))}
                className={`
                  px-6 py-2 rounded-xl text-xs font-bold transition-all
                  ${localPrefs.cartPosition === 'right' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary'}
                `}
              >
                Right
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Typography Settings" icon={<Type size={20} />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Base Font Family & Style</label>
            <FontSelector
              idPrefix="base-font"
              currentFamily={localPrefs.fontFamily}
              currentStyle={localPrefs.fontStyle}
              onChange={(family, style) => setLocalPrefs((prev) => ({ ...prev, fontFamily: family, fontStyle: style }))}
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Save Preferences
        </button>
        <button
          onClick={handleReset}
          className="px-8 py-4 rounded-2xl bg-background text-danger font-bold shadow-neumorphic hover:shadow-neumorphic-inset active:scale-95 transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PreferencesSettings;

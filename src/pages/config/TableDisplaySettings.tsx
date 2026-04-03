import React, { useState } from 'react';
import { LayoutGrid, Type, Settings2 } from 'lucide-react';
import { useSettingsStore, ZoneDisplaySettings } from '../../store/settingsStore';
import SectionCard from '../../components/config/SectionCard';
import ToggleSwitch from '../../components/config/ToggleSwitch';
import FontSelector from '../../components/config/FontSelector';
import { usePrompt } from '../../hooks/usePrompt';

const zones = [
  { id: 'zone_dinein', name: 'Dine In', icon: '🍽️' },
  { id: 'zone_takeaway', name: 'Take Away', icon: '🥡' },
  { id: 'zone_delivery', name: 'Delivery', icon: '🛵' },
];

const TableDisplaySettings: React.FC = () => {
  const { tableDisplaySettings, updateTableDisplaySettings } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [activeZone, setActiveZone] = useState('zone_dinein');
  const [localSettings, setLocalSettings] = useState(tableDisplaySettings[activeZone]);

  const handleZoneChange = (zoneId: string) => {
    setActiveZone(zoneId);
    setLocalSettings(tableDisplaySettings[zoneId]);
  };

  const handleSave = () => {
    updateTableDisplaySettings(activeZone, localSettings);
  };

  const updateField = (field: keyof ZoneDisplaySettings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = async () => {
    const zoneName = zones.find((z) => z.id === activeZone)?.name;
    const confirmed = await askConfirm(`Reset ${zoneName}`, `Are you sure you want to discard unsaved changes for ${zoneName}?`);
    if (confirmed) {
      setLocalSettings(tableDisplaySettings[activeZone]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex p-1 bg-background rounded-3xl shadow-neumorphic-inset mb-6">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneChange(zone.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all
              ${activeZone === zone.id ? 'bg-primary text-white shadow-lg' : 'text-text-secondary'}
            `}
          >
            <span>{zone.icon}</span>
            <span>{zone.name}</span>
          </button>
        ))}
      </div>

      <SectionCard title="General Table Settings" icon={<Settings2 size={20} />}>
        <div className="space-y-4">
          <ToggleSwitch
            label="Auto-Size Table Buttons"
            description="Automatically adjust button sizes based on screen width"
            checked={localSettings.autoSize}
            onChange={(val) => updateField('autoSize', val)}
          />
          <ToggleSwitch
            label="Ask for Customer Info"
            description="Prompt for customer details when opening a new order"
            checked={localSettings.askCustomer}
            onChange={(val) => updateField('askCustomer', val)}
          />
          <ToggleSwitch
            label="Ask for Waiter"
            description="Prompt for waiter selection when opening a new order"
            checked={localSettings.askWaiter}
            onChange={(val) => updateField('askWaiter', val)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Button Width (px)</label>
              <input
                type="number"
                value={localSettings.width}
                onChange={(e) => updateField('width', parseInt(e.target.value))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Button Height (px)</label>
              <input
                type="number"
                value={localSettings.height}
                onChange={(e) => updateField('height', parseInt(e.target.value))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Min Item Width (px)</label>
              <input
                type="number"
                value={localSettings.minWidth}
                onChange={(e) => updateField('minWidth', parseInt(e.target.value))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vertical Gap (px)</label>
              <input
                type="number"
                value={localSettings.vGap}
                onChange={(e) => updateField('vGap', parseInt(e.target.value))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Horizontal Gap (px)</label>
              <input
                type="number"
                value={localSettings.hGap}
                onChange={(e) => updateField('hGap', parseInt(e.target.value))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Table Groups Visual Settings" icon={<LayoutGrid size={20} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Group Line Style</label>
            <select
              value={localSettings.groupLineStyle}
              onChange={(e) => updateField('groupLineStyle', e.target.value)}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm border-none"
            >
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Line Thickness (px)</label>
            <input
              type="number"
              value={localSettings.groupLineThickness}
              onChange={(e) => updateField('groupLineThickness', parseInt(e.target.value))}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Line Color</label>
            <input
              type="color"
              value={localSettings.groupLineColor}
              onChange={(e) => updateField('groupLineColor', e.target.value)}
              className="w-full h-11 p-1 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm border-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Button Border Radius (px)</label>
            <input
              type="number"
              value={localSettings.borderRadius}
              onChange={(e) => updateField('borderRadius', parseInt(e.target.value))}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Typography Settings" icon={<Type size={20} />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Table Button Font</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="text"
                value={localSettings.tableFontSize}
                onChange={(e) => updateField('tableFontSize', e.target.value)}
                className="w-24 p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
                placeholder="14px"
              />
              <div className="flex-1 w-full">
                <FontSelector
                  idPrefix="table-font"
                  currentFamily={localSettings.tableFontFamily}
                  currentStyle={localSettings.tableFontStyle}
                  onChange={(family, style) => {
                    updateField('tableFontFamily', family);
                    updateField('tableFontStyle', style);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Table Heading Font</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="text"
                value={localSettings.headerFontSize}
                onChange={(e) => updateField('headerFontSize', e.target.value)}
                className="w-24 p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
                placeholder="16px"
              />
              <div className="flex-1 w-full">
                <FontSelector
                  idPrefix="header-font"
                  currentFamily={localSettings.headerFontFamily}
                  currentStyle={localSettings.headerFontStyle}
                  onChange={(family, style) => {
                    updateField('headerFontFamily', family);
                    updateField('headerFontStyle', style);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSave}
          className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Save {zones.find((z) => z.id === activeZone)?.name} Settings
        </button>
        <button
          onClick={handleReset}
          className="py-4 px-8 rounded-2xl bg-background text-danger font-bold shadow-neumorphic hover:shadow-neumorphic-inset active:scale-95 transition-all"
        >
          Reset {zones.find((z) => z.id === activeZone)?.name}
        </button>
      </div>
    </div>
  );
};

export default TableDisplaySettings;

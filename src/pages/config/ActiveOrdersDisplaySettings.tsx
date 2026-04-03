import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { ActiveOrdersZoneSettings } from '../../types';
import { Save, RotateCcw, Type, Layout, Grid, Maximize2, Minimize2, Palette } from 'lucide-react';
import FontSelector from '../../components/config/FontSelector';
import { usePrompt } from '../../hooks/usePrompt';

const ActiveOrdersDisplaySettings: React.FC = () => {
  const { activeOrdersDisplay, updateActiveOrdersDisplay, updateActiveOrdersZoneSettings } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [activeZone, setActiveZone] = useState<'dinein' | 'takeaway' | 'delivery'>('dinein');

  const zoneSettings = activeOrdersDisplay[activeZone];

  const handleZoneUpdate = (updates: Partial<ActiveOrdersZoneSettings>) => {
    updateActiveOrdersZoneSettings(activeZone, updates);
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Settings', `Are you sure you want to reset ${activeZone} display settings to default?`);
    if (confirmed) {
      const defaultZone: ActiveOrdersZoneSettings = {
        tileAutoSize: true,
        tileWidth: '100px',
        tileHeight: '70px',
        tileMinItemWidth: '80px',
        tileGap: '15px',
        tileColumnGap: '15px',
        groupLineStyle: 'Solid',
        groupLineThickness: '1px',
        groupLineColor: '#cccccc',
        tileBorderRadius: '8px',
        partitionGapTop: '10px',
        partitionGapBottom: '10px',
        groupHPadding: '10px',
        tableNameFontSize: '14px',
        timerFontSize: '12px',
        groupHeaderFontSize: '16px',
        uiFont: {
          tableNameFamily: 'Inter',
          tableNameStyle: 'Bold',
          timerFamily: 'Inter',
          timerStyle: 'Normal',
          groupHeaderFamily: 'Inter',
          groupHeaderStyle: 'Bold',
        }
      };
      handleZoneUpdate(defaultZone);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Global Toggle */}
      <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-inner">
              <Grid size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">Global Layout</h3>
              <p className="text-sm text-gray-500 font-medium">Control how orders are organized on the screen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Group by Zone</span>
            <button
              onClick={() => updateActiveOrdersDisplay({ groupByZone: !activeOrdersDisplay.groupByZone })}
              className={`w-14 h-8 rounded-full transition-all duration-300 relative shadow-inner ${
                activeOrdersDisplay.groupByZone ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                activeOrdersDisplay.groupByZone ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="flex gap-4 p-2 bg-gray-200/50 rounded-2xl w-fit mx-auto shadow-inner">
        {[
          { id: 'dinein', label: '🍽️ Dine In' },
          { id: 'takeaway', label: '🥡 Take Away' },
          { id: 'delivery', label: '🛵 Delivery' },
        ].map((zone) => (
          <button
            key={zone.id}
            onClick={() => setActiveZone(zone.id as any)}
            className={`px-6 py-2 rounded-xl font-black text-sm transition-all duration-300 ${
              activeZone === zone.id ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tile Dimensions */}
        <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-6">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Maximize2 size={20} className="text-purple-600" />
            Tile Dimensions
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-white/30 rounded-2xl shadow-inner">
            <span className="text-sm font-bold text-gray-600">Auto-Size Tiles</span>
            <button
              onClick={() => handleZoneUpdate({ tileAutoSize: !zoneSettings.tileAutoSize })}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                zoneSettings.tileAutoSize ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                zoneSettings.tileAutoSize ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tile Width</label>
              <input
                type="text"
                value={zoneSettings.tileWidth}
                onChange={(e) => handleZoneUpdate({ tileWidth: e.target.value })}
                disabled={zoneSettings.tileAutoSize}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tile Height</label>
              <input
                type="text"
                value={zoneSettings.tileHeight}
                onChange={(e) => handleZoneUpdate({ tileHeight: e.target.value })}
                disabled={zoneSettings.tileAutoSize}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Min Item Width</label>
              <input
                type="text"
                value={zoneSettings.tileMinItemWidth}
                onChange={(e) => handleZoneUpdate({ tileMinItemWidth: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Border Radius</label>
              <input
                type="text"
                value={zoneSettings.tileBorderRadius}
                onChange={(e) => handleZoneUpdate({ tileBorderRadius: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Spacing & Layout */}
        <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-6">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Layout size={20} className="text-purple-600" />
            Spacing & Layout
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tile Gap (V)</label>
              <input
                type="text"
                value={zoneSettings.tileGap}
                onChange={(e) => handleZoneUpdate({ tileGap: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tile Gap (H)</label>
              <input
                type="text"
                value={zoneSettings.tileColumnGap}
                onChange={(e) => handleZoneUpdate({ tileColumnGap: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Group H-Padding</label>
              <input
                type="text"
                value={zoneSettings.groupHPadding}
                onChange={(e) => handleZoneUpdate({ groupHPadding: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Partition Gap (Top)</label>
              <input
                type="text"
                value={zoneSettings.partitionGapTop}
                onChange={(e) => handleZoneUpdate({ partitionGapTop: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Group Line Style */}
        <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-6">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Palette size={20} className="text-purple-600" />
            Group Line Style
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Line Style</label>
              <select
                value={zoneSettings.groupLineStyle}
                onChange={(e) => handleZoneUpdate({ groupLineStyle: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="None">None</option>
                <option value="Solid">Solid</option>
                <option value="Dashed">Dashed</option>
                <option value="Dotted">Dotted</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Line Thickness</label>
              <input
                type="text"
                value={zoneSettings.groupLineThickness}
                onChange={(e) => handleZoneUpdate({ groupLineThickness: e.target.value })}
                className="w-full px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Line Color</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={zoneSettings.groupLineColor}
                  onChange={(e) => handleZoneUpdate({ groupLineColor: e.target.value })}
                  className="w-12 h-12 bg-transparent border-none cursor-pointer"
                />
                <input
                  type="text"
                  value={zoneSettings.groupLineColor}
                  onChange={(e) => handleZoneUpdate({ groupLineColor: e.target.value })}
                  className="flex-1 px-4 py-2 bg-[#E0E5EC] rounded-xl shadow-inner border-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-[#E0E5EC] p-8 rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-8">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Type size={20} className="text-purple-600" />
            Typography
          </h3>
          
          <div className="space-y-6">
            {/* Table Name */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Table Name</label>
                <input
                  type="text"
                  value={zoneSettings.tableNameFontSize}
                  onChange={(e) => handleZoneUpdate({ tableNameFontSize: e.target.value })}
                  className="w-20 px-3 py-1 bg-[#E0E5EC] rounded-lg shadow-inner border-none text-xs text-center"
                />
              </div>
              <FontSelector
                idPrefix="table-name"
                currentFamily={zoneSettings.uiFont.tableNameFamily}
                currentStyle={zoneSettings.uiFont.tableNameStyle}
                onChange={(family, style) => handleZoneUpdate({ uiFont: { ...zoneSettings.uiFont, tableNameFamily: family, tableNameStyle: style } })}
              />
            </div>

            {/* Timer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Timer</label>
                <input
                  type="text"
                  value={zoneSettings.timerFontSize}
                  onChange={(e) => handleZoneUpdate({ timerFontSize: e.target.value })}
                  className="w-20 px-3 py-1 bg-[#E0E5EC] rounded-lg shadow-inner border-none text-xs text-center"
                />
              </div>
              <FontSelector
                idPrefix="timer"
                currentFamily={zoneSettings.uiFont.timerFamily}
                currentStyle={zoneSettings.uiFont.timerStyle}
                onChange={(family, style) => handleZoneUpdate({ uiFont: { ...zoneSettings.uiFont, timerFamily: family, timerStyle: style } })}
              />
            </div>

            {/* Group Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Group Header</label>
                <input
                  type="text"
                  value={zoneSettings.groupHeaderFontSize}
                  onChange={(e) => handleZoneUpdate({ groupHeaderFontSize: e.target.value })}
                  className="w-20 px-3 py-1 bg-[#E0E5EC] rounded-lg shadow-inner border-none text-xs text-center"
                />
              </div>
              <FontSelector
                idPrefix="group-header"
                currentFamily={zoneSettings.uiFont.groupHeaderFamily}
                currentStyle={zoneSettings.uiFont.groupHeaderStyle}
                onChange={(family, style) => handleZoneUpdate({ uiFont: { ...zoneSettings.uiFont, groupHeaderFamily: family, groupHeaderStyle: style } })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-300 transition-all"
        >
          <RotateCcw size={18} />
          Reset to Default
        </button>
        <button
          onClick={() => useSettingsStore.getState().saveSettings()}
          className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all"
        >
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default ActiveOrdersDisplaySettings;

import React, { useState } from 'react';
import { Save, RefreshCw, Download, Upload, Bug, ShieldCheck, Settings } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { usePrompt } from '../../hooks/usePrompt';

const InventorySettingsTab: React.FC = () => {
  const { showToast } = useToastStore();
  const { askConfirm } = usePrompt();
  
  const [settings, setSettings] = useState({
    lowStockThreshold: 5,
    varianceWarningPct: 5,
    varianceCriticalPct: 10,
    priceAnomalyThreshold: 10,
    autoCreatePO: false,
    debugMode: false
  });

  const handleSave = () => {
    // In a real app, this would update a settingsStore
    showToast('Inventory settings updated', 'success');
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Settings', 'Are you sure you want to reset all inventory settings to default?');
    if (confirmed) {
      setSettings({
        lowStockThreshold: 5,
        varianceWarningPct: 5,
        varianceCriticalPct: 10,
        priceAnomalyThreshold: 10,
        autoCreatePO: false,
        debugMode: false
      });
      showToast('Settings reset to default', 'info');
    }
  };

  const handleExport = () => {
    const data = {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_settings_${new Date().toISOString()}.json`;
    link.click();
    showToast('Inventory data exported', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Threshold Settings */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-300/30 pb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Settings size={20} />
            </div>
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">Thresholds</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Low Stock Threshold (Qty)</label>
              <input 
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Variance Warning (%)</label>
              <input 
                type="number"
                value={settings.varianceWarningPct}
                onChange={(e) => setSettings({ ...settings, varianceWarningPct: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Variance Critical (%)</label>
              <input 
                type="number"
                value={settings.varianceCriticalPct}
                onChange={(e) => setSettings({ ...settings, varianceCriticalPct: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">Price Anomaly Threshold (%)</label>
              <input 
                type="number"
                value={settings.priceAnomalyThreshold}
                onChange={(e) => setSettings({ ...settings, priceAnomalyThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-sm font-bold text-primary border-none"
              />
            </div>
          </div>
        </div>

        {/* Automation & Debug */}
        <div className="space-y-8">
          <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-300/30 pb-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Automation</h3>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-neumorphic-inset">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-tight">Auto-create PO</p>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">For critical stock items</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, autoCreatePO: !settings.autoCreatePO })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.autoCreatePO ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.autoCreatePO ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-neumorphic-inset">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-tight">Enable Debug Mode</p>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Show internal IDs and logs</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, debugMode: !settings.debugMode })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.debugMode ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.debugMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-300/30 pb-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <RefreshCw size={20} />
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Data Management</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleExport}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all"
              >
                <Download size={24} className="text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Export Data</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all">
                <Upload size={24} className="text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Import Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8">
        <button 
          onClick={handleReset}
          className="px-8 py-4 rounded-2xl bg-background shadow-neumorphic text-text-secondary font-black text-xs uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
        >
          Reset to Default
        </button>
        <button 
          onClick={handleSave}
          className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default InventorySettingsTab;

import React, { useState } from 'react';
import { Trash2, Upload, Building2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../store/settingsStore';
import SectionCard from '../../components/config/SectionCard';
import { usePrompt } from '../../hooks/usePrompt';

const PropertySettings: React.FC = () => {
  const { propertySettings, updatePropertySettings, resetAllData } = useSettingsStore();
  const { askConfirm } = usePrompt();
  const [localSettings, setLocalSettings] = useState(propertySettings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updatePropertySettings(localSettings);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Max file size 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalSettings((prev) => ({ ...prev, logo: '' }));
  };

  const handleResetAll = async () => {
    const confirmed = await askConfirm(
      'Reset All Data',
      'ARE YOU ABSOLUTELY SURE? This will wipe ALL data including orders, menu, and settings. This cannot be undone.'
    );
    if (confirmed) {
      resetAllData();
    }
  };

  const handleResetLocal = async () => {
    const confirmed = await askConfirm('Reset Settings', 'Are you sure you want to discard unsaved changes?');
    if (confirmed) {
      setLocalSettings(propertySettings);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <SectionCard title="Logo & Branding" icon={<Building2 size={20} />}>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="relative w-40 h-40 rounded-3xl shadow-neumorphic flex items-center justify-center overflow-hidden bg-background">
            {localSettings.logo ? (
              <>
                <img src={localSettings.logo} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                <button
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-2 bg-danger text-white rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer p-4 text-center">
                <Upload size={32} className="text-primary opacity-50" />
                <span className="text-xs font-bold text-text-secondary">Click to Upload Logo</span>
                <span className="text-[10px] text-text-secondary opacity-60">Max 1MB</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Logo Width on Receipts (px)</label>
              <input
                type="number"
                name="logoWidth"
                value={localSettings.logoWidth}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, logoWidth: parseInt(e.target.value) }))}
                className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
              />
              <p className="text-[10px] text-text-secondary opacity-60 italic">Recommended width: 80px - 200px</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Restaurant Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Restaurant Name</label>
            <input
              type="text"
              name="name"
              value={localSettings.name}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={localSettings.phone}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Address</label>
            <input
              type="text"
              name="address"
              value={localSettings.address}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Currency</label>
            <input
              type="text"
              name="currency"
              value={localSettings.currency}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Branch Code/Name</label>
            <input
              type="text"
              name="branch"
              value={localSettings.branch}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Opening Time</label>
            <input
              type="time"
              name="openingTime"
              value={localSettings.openingTime || ''}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Closing Time</label>
            <input
              type="time"
              name="closingTime"
              value={localSettings.closingTime || ''}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl shadow-neumorphic-inset bg-background outline-none text-sm"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSave}
          className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Save Property Settings
        </button>
        <button
          onClick={handleResetLocal}
          className="py-4 px-8 rounded-2xl bg-background text-danger font-bold shadow-neumorphic hover:shadow-neumorphic-inset active:scale-95 transition-all"
        >
          Reset to Default
        </button>
      </div>

      <div className="pt-10">
        <div className="bg-danger/5 border-2 border-danger/20 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h4 className="font-bold text-danger text-lg uppercase tracking-wider">Danger Zone</h4>
            <p className="text-xs text-text-secondary mt-1">This action will permanently delete all your data including orders, menu, and settings. This cannot be undone.</p>
          </div>
          <button
            onClick={handleResetAll}
            className="w-full py-4 rounded-2xl bg-danger text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            RESET ALL APP DATA
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertySettings;

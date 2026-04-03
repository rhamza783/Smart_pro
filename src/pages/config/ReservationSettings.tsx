import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react';
import { useReservationStore } from '../../store/reservationStore';
import { useToastStore } from '../../store/toastStore';
import { usePrompt } from '../../hooks/usePrompt';

const ReservationSettings: React.FC = () => {
  const { settings, saveSettings } = useReservationStore();
  const { showToast } = useToastStore();
  const { askConfirm } = usePrompt();
  
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    saveSettings(localSettings);
    showToast('Reservation settings saved', 'success');
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Settings', 'Are you sure you want to reset reservation settings to defaults?');
    if (confirmed) {
      const defaults = {
        defaultDuration: 120,
        beforeMargin: 15,
        afterMargin: 15,
        allowOverbooking: false
      };
      setLocalSettings(defaults);
      saveSettings(defaults);
      showToast('Settings reset to defaults', 'info');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Reservation Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure how the table booking system behaves.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 transition-all font-bold text-sm"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#6750A4] text-white shadow-lg hover:scale-105 transition-all font-bold text-sm"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timing Settings */}
        <div className="rounded-[32px] bg-[#E0E5EC] p-8 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6750A4] shadow-sm">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-gray-700">Timing & Duration</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Default Duration (mins)</label>
                <span className="text-sm font-bold text-[#6750A4]">{localSettings.defaultDuration} min</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-[#E0E5EC] p-2 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                <button 
                  onClick={() => setLocalSettings(prev => ({ ...prev, defaultDuration: Math.max(15, prev.defaultDuration - 15) }))}
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6750A4] shadow-sm active:shadow-inner"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6750A4] transition-all" 
                    style={{ width: `${(localSettings.defaultDuration / 240) * 100}%` }}
                  />
                </div>
                <button 
                  onClick={() => setLocalSettings(prev => ({ ...prev, defaultDuration: Math.min(240, prev.defaultDuration + 15) }))}
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6750A4] shadow-sm active:shadow-inner"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Margin Before (min)</label>
                <input 
                  type="number"
                  value={localSettings.beforeMargin}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, beforeMargin: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Margin After (min)</label>
                <input 
                  type="number"
                  value={localSettings.afterMargin}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, afterMargin: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Policy Settings */}
        <div className="rounded-[32px] bg-[#E0E5EC] p-8 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6750A4] shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-gray-700">Booking Policies</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/20">
              <div>
                <p className="font-bold text-gray-700">Allow Overbooking</p>
                <p className="text-[10px] text-gray-500">Permit multiple reservations for the same table/time.</p>
              </div>
              <button 
                onClick={() => setLocalSettings(prev => ({ ...prev, allowOverbooking: !prev.allowOverbooking }))}
                className={`w-12 h-6 rounded-full transition-all relative ${localSettings.allowOverbooking ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.allowOverbooking ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 flex items-start gap-3 border border-blue-100">
              <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Pro Tip:</strong> Setting margins helps ensure tables are cleaned and ready for the next guest. We recommend at least 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationSettings;

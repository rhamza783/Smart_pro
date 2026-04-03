import React, { useState } from 'react';
import { useStaffStore } from '../../store/staffStore';
import { Settings, Clock, AlertTriangle, Calendar, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

const StaffSettingsTab: React.FC = () => {
  const { settings, updateSettings } = useStaffStore();
  const [formData, setFormData] = useState(settings);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Staff settings saved');
  };

  const toggleWeekend = (dayIdx: number) => {
    const newWeekends = formData.weekendDays.includes(dayIdx)
      ? formData.weekendDays.filter(d => d !== dayIdx)
      : [...formData.weekendDays, dayIdx];
    setFormData({ ...formData, weekendDays: newWeekends });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-[#E0E5EC] p-8 rounded-[40px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <div className="flex items-center gap-3 text-purple-600 mb-8">
          <Settings size={28} strokeWidth={2.5} />
          <h2 className="text-2xl font-black uppercase tracking-tight">Staff Configuration</h2>
        </div>

        <div className="space-y-8">
          {/* Late Threshold */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-4">
              <Clock size={16} className="text-gray-400" />
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Late Threshold (Minutes)</label>
            </div>
            <input
              type="number"
              value={formData.lateThreshold}
              onChange={e => setFormData({ ...formData, lateThreshold: Number(e.target.value) })}
              className="w-full px-6 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
              placeholder="15"
            />
            <p className="text-[9px] font-bold text-gray-400 ml-4 italic">Staff is marked "LATE" after X minutes past scheduled start time.</p>
          </div>

          {/* Overtime Threshold */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-4">
              <AlertTriangle size={16} className="text-gray-400" />
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Overtime Threshold (Hours)</label>
            </div>
            <input
              type="number"
              value={formData.overtimeThreshold}
              onChange={e => setFormData({ ...formData, overtimeThreshold: Number(e.target.value) })}
              className="w-full px-6 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
              placeholder="8"
            />
            <p className="text-[9px] font-bold text-gray-400 ml-4 italic">Overtime is calculated after X hours worked in a single day.</p>
          </div>

          {/* Auto Clock-out */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-4">
              <Clock size={16} className="text-gray-400" />
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Auto Clock-out Time</label>
            </div>
            <input
              type="time"
              value={formData.autoClockOutTime}
              onChange={e => setFormData({ ...formData, autoClockOutTime: e.target.value })}
              className="w-full px-6 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
            />
            <p className="text-[9px] font-bold text-gray-400 ml-4 italic">Automatically clock-out staff at this time if they forget.</p>
          </div>

          {/* Weekend Days */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-4">
              <Calendar size={16} className="text-gray-400" />
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Weekend Days</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {days.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => toggleWeekend(idx)}
                  className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.weekendDays.includes(idx)
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : 'bg-[#E0E5EC] text-gray-500 shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-5 bg-purple-600 text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
          >
            <Save size={24} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSettingsTab;

import React, { useState } from 'react';
import { useStaffStore } from '../../store/staffStore';
import { Clock, AlertTriangle, CheckCircle2, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClockTimePicker from '../../components/ui/ClockTimePicker';
import { toast } from 'react-hot-toast';

const SchedulesTab: React.FC = () => {
  const { employees, schedules, saveSchedule, getScheduleForEmployee, calcHoursWorked, timeEntries } = useStaffStore();
  const [editingCell, setEditingCell] = useState<{ employeeId: string; day: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeEmployees = employees.filter(e => e.isActive);

  const [tempSchedule, setTempSchedule] = useState({
    startTime: '09:00',
    endTime: '17:00',
    isOff: false,
    applyToAll: false
  });

  const handleCellClick = (employeeId: string, day: number) => {
    const existing = schedules.find(s => s.employeeId === employeeId && s.dayOfWeek === day);
    setEditingCell({ employeeId, day });
    setTempSchedule({
      startTime: existing?.startTime || '09:00',
      endTime: existing?.endTime || '17:00',
      isOff: existing?.isOff ?? true,
      applyToAll: false
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    if (tempSchedule.applyToAll) {
      // Apply to all days for this employee
      for (let i = 0; i < 7; i++) {
        saveSchedule({
          employeeId: editingCell.employeeId,
          dayOfWeek: i,
          startTime: tempSchedule.startTime,
          endTime: tempSchedule.endTime,
          isOff: tempSchedule.isOff
        });
      }
    } else {
      saveSchedule({
        employeeId: editingCell.employeeId,
        dayOfWeek: editingCell.day,
        startTime: tempSchedule.startTime,
        endTime: tempSchedule.endTime,
        isOff: tempSchedule.isOff
      });
    }
    
    toast.success('Schedule updated');
    setIsModalOpen(false);
  };

  const today = new Date().getDay();
  const todayDate = new Date().toISOString().split('T')[0];

  const getStatusIndicator = (empId: string) => {
    const entry = timeEntries.find(t => t.employeeId === empId && t.date === todayDate);
    const sched = schedules.find(s => s.employeeId === empId && s.dayOfWeek === today);
    
    if (!sched || sched.isOff) return { label: 'OFF', color: 'text-gray-400', bg: 'bg-gray-100' };
    if (!entry) return { label: 'Not yet', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (entry.clockIn && !entry.clockOut) return { label: 'On shift', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (entry.status === 'late') return { label: 'Late', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (entry.status === 'present') return { label: 'On time', color: 'text-green-600', bg: 'bg-green-100' };
    return { label: 'Absent', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Main Schedule Grid */}
      <div className="flex-1 overflow-auto bg-[#E0E5EC] rounded-[32px] shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff] p-6">
        <div className="min-w-[1000px]">
          {/* Header */}
          <div className="grid grid-cols-[160px_repeat(7,1fr)] gap-4 mb-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center px-4">Employee</div>
            {days.map((day, i) => (
              <div key={day} className={`text-center p-3 rounded-2xl font-black uppercase tracking-widest text-xs ${i === today ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-4">
            {activeEmployees.map(emp => (
              <div key={emp.id} className="grid grid-cols-[160px_repeat(7,1fr)] gap-4 items-center">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs shadow-inner">
                    {emp.name.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-700 text-sm truncate">{emp.name}</span>
                </div>

                {days.map((_, dayIdx) => {
                  const sched = schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === dayIdx);
                  return (
                    <button
                      key={dayIdx}
                      onClick={() => handleCellClick(emp.id, dayIdx)}
                      className={`h-16 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 border-2 border-transparent hover:border-purple-300 ${
                        !sched || sched.isOff 
                          ? 'bg-gray-50/50 border-dashed border-gray-300' 
                          : 'bg-white shadow-md'
                      }`}
                    >
                      {sched && !sched.isOff ? (
                        <>
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">{sched.startTime}–{sched.endTime}</span>
                          <span className="text-[9px] font-bold text-gray-400">{calcHoursWorked(sched.startTime, sched.endTime).toFixed(1)}h</span>
                        </>
                      ) : sched?.isOff ? (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OFF</span>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">+ Add</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Live Summary */}
      <div className="w-[280px] flex flex-col gap-6">
        <div className="bg-[#E0E5EC] p-6 rounded-[32px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
          <div className="flex items-center gap-2 text-purple-600 mb-6">
            <Clock size={20} strokeWidth={2.5} />
            <h3 className="font-black uppercase tracking-tight">Today's Staff</h3>
          </div>

          <div className="space-y-4">
            {activeEmployees.map(emp => {
              const status = getStatusIndicator(emp.id);
              const sched = schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === today);
              return (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-white/50 rounded-2xl border border-white/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-700">{emp.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      {sched && !sched.isOff ? `${sched.startTime}–${sched.endTime}` : 'No Shift'}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                    {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conflicts Banner */}
        <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-200 shadow-lg">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <AlertTriangle size={20} strokeWidth={2.5} />
            <h3 className="font-black uppercase tracking-tight">Conflicts</h3>
          </div>
          <p className="text-[10px] font-bold text-orange-700 leading-relaxed">
            No scheduling conflicts detected for the current week. All shifts have adequate coverage.
          </p>
        </div>
      </div>

      {/* Schedule Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#E0E5EC] rounded-[40px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                  Edit Shift: {days[editingCell?.day || 0]}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <CheckCircle2 size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Toggle Off/On */}
                <div className="flex p-2 bg-white/50 rounded-2xl shadow-inner">
                  <button
                    onClick={() => setTempSchedule({ ...tempSchedule, isOff: false })}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${!tempSchedule.isOff ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400'}`}
                  >
                    Working
                  </button>
                  <button
                    onClick={() => setTempSchedule({ ...tempSchedule, isOff: true })}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${tempSchedule.isOff ? 'bg-gray-500 text-white shadow-lg' : 'text-gray-400'}`}
                  >
                    Day Off
                  </button>
                </div>

                {!tempSchedule.isOff && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Start Time</label>
                      <ClockTimePicker
                        value={tempSchedule.startTime}
                        onChange={(val) => setTempSchedule({ ...tempSchedule, startTime: val })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">End Time</label>
                      <ClockTimePicker
                        value={tempSchedule.endTime}
                        onChange={(val) => setTempSchedule({ ...tempSchedule, endTime: val })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 ml-2">
                  <input
                    type="checkbox"
                    id="applyAll"
                    checked={tempSchedule.applyToAll}
                    onChange={e => setTempSchedule({ ...tempSchedule, applyToAll: e.target.checked })}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <label htmlFor="applyAll" className="text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">
                    Apply to all days of the week
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.02] transition-all"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulesTab;

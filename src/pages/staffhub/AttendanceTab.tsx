import React, { useState } from 'react';
import { useStaffStore } from '../../store/staffStore';
import { ChevronLeft, ChevronRight, Calendar, Clock, Edit2, FileText, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClockTimePicker from '../../components/ui/ClockTimePicker';
import { toast } from 'react-hot-toast';

const AttendanceTab: React.FC = () => {
  const { employees, schedules, timeEntries, clockIn, clockOut, calcHoursWorked, calcOvertimeHours, settings } = useStaffStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingTime, setEditingTime] = useState<{ employeeId: string; type: 'in' | 'out' } | null>(null);

  const activeEmployees = employees.filter(e => e.isActive);
  const dayOfWeek = new Date(selectedDate).getDay();

  const handleDateChange = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-600 border-green-200';
      case 'late': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'absent': return 'bg-red-100 text-red-600 border-red-200';
      case 'on-shift': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'half-day': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'off': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleTimeSave = (time: string) => {
    if (!editingTime) return;
    if (editingTime.type === 'in') {
      clockIn(editingTime.employeeId, time, selectedDate);
    } else {
      clockOut(editingTime.employeeId, time, selectedDate);
    }
    setEditingTime(null);
    toast.success('Time updated');
  };

  const exportAttendance = () => {
    const headers = ['Employee', 'Role', 'Scheduled In', 'Scheduled Out', 'Clock In', 'Clock Out', 'Hours', 'Overtime', 'Status'];
    const rows = activeEmployees.map(emp => {
      const entry = timeEntries.find(t => t.employeeId === emp.id && t.date === selectedDate);
      const sched = schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === dayOfWeek);
      return [
        emp.name,
        emp.role,
        sched?.startTime || '-',
        sched?.endTime || '-',
        entry?.clockIn || '-',
        entry?.clockOut || '-',
        entry?.hoursWorked?.toFixed(2) || '0',
        entry?.overtimeHours?.toFixed(2) || '0',
        entry?.status || (sched?.isOff ? 'OFF' : 'ABSENT')
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-[#E0E5EC] p-4 rounded-[24px] shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff]">
        <div className="flex items-center gap-4">
          <button onClick={() => handleDateChange(-1)} className="p-2 bg-white/50 rounded-xl shadow-md text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-xl shadow-md">
            <Calendar size={18} className="text-purple-600" />
            <span className="font-black text-sm text-gray-700 uppercase tracking-widest">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <button onClick={() => handleDateChange(1)} className="p-2 bg-white/50 rounded-xl shadow-md text-gray-500">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-white/50 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md"
          >
            Today
          </button>
          <button
            onClick={exportAttendance}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-[#E0E5EC] rounded-[32px] shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff] overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-separate border-spacing-y-2 px-6">
            <thead className="sticky top-0 bg-[#E0E5EC] z-10">
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="py-4 px-4">Employee</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Scheduled</th>
                <th className="py-4 px-4">Clock In</th>
                <th className="py-4 px-4">Clock Out</th>
                <th className="py-4 px-4">Hours</th>
                <th className="py-4 px-4">Overtime</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(emp => {
                const entry = timeEntries.find(t => t.employeeId === emp.id && t.date === selectedDate);
                const sched = schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === dayOfWeek);
                const status = entry?.clockIn && !entry?.clockOut ? 'on-shift' : (entry?.status || (sched?.isOff ? 'off' : 'absent'));
                const isOvernight = entry?.clockIn && entry?.clockOut && entry.clockOut < entry.clockIn;

                return (
                  <tr key={emp.id} className="bg-white/50 rounded-2xl shadow-sm hover:bg-white transition-colors group">
                    <td className="py-4 px-4 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-700 text-sm">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{emp.role}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-gray-500">
                        {sched && !sched.isOff ? `${sched.startTime} – ${sched.endTime}` : 'OFF'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setEditingTime({ employeeId: emp.id, type: 'in' })}
                        className="flex items-center gap-2 text-xs font-black text-purple-600 hover:scale-105 transition-all"
                      >
                        <Clock size={14} />
                        {entry?.clockIn || '—'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setEditingTime({ employeeId: emp.id, type: 'out' })}
                        className="flex items-center gap-2 text-xs font-black text-purple-600 hover:scale-105 transition-all"
                      >
                        <Clock size={14} />
                        {entry?.clockOut || '—'}
                        {isOvernight && <span title="Overnight shift">🌙</span>}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-black text-green-600">
                        {entry?.hoursWorked ? `${Math.floor(entry.hoursWorked)}h ${Math.round((entry.hoursWorked % 1) * 60)}m` : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-black text-orange-600">
                        {entry?.overtimeHours && entry.overtimeHours > 0 ? `+${Math.floor(entry.overtimeHours)}h ${Math.round((entry.overtimeHours % 1) * 60)}m` : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(status)}`}>
                        {status}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right rounded-r-2xl">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-purple-600 bg-gray-50 rounded-xl shadow-sm">
                          <Edit2 size={14} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl shadow-sm">
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-6 bg-white/30 border-t border-white/20 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Present</p>
            <p className="text-xl font-black text-green-600">{timeEntries.filter(t => t.date === selectedDate && t.status !== 'absent').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Absent</p>
            <p className="text-xl font-black text-red-600">{activeEmployees.length - timeEntries.filter(t => t.date === selectedDate && t.status !== 'absent').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Late</p>
            <p className="text-xl font-black text-orange-600">{timeEntries.filter(t => t.date === selectedDate && t.status === 'late').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Hours</p>
            <p className="text-xl font-black text-purple-600">
              {timeEntries.filter(t => t.date === selectedDate).reduce((acc, t) => acc + (t.hoursWorked || 0), 0).toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* Time Picker Modal */}
      <AnimatePresence>
        {editingTime && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTime(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#E0E5EC] rounded-[40px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                    {editingTime.type === 'in' ? 'Clock In' : 'Clock Out'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {employees.find(e => e.id === editingTime.employeeId)?.name}
                  </p>
                </div>
                <button onClick={() => setEditingTime(null)} className="text-gray-400 hover:text-gray-600">
                  <CheckCircle2 size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="bg-white/50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Scheduled Time</p>
                  <p className="text-lg font-black text-purple-600">
                    {(() => {
                      const sched = schedules.find(s => s.employeeId === editingTime.employeeId && s.dayOfWeek === dayOfWeek);
                      return sched ? (editingTime.type === 'in' ? sched.startTime : sched.endTime) : 'No schedule';
                    })()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Select Time</label>
                  <ClockTimePicker
                    value={(() => {
                      const entry = timeEntries.find(t => t.employeeId === editingTime.employeeId && t.date === selectedDate);
                      return (editingTime.type === 'in' ? entry?.clockIn : entry?.clockOut) || '09:00';
                    })()}
                    onChange={handleTimeSave}
                  />
                </div>

                <button
                  onClick={() => setEditingTime(null)}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.02] transition-all"
                >
                  Confirm Time
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceTab;

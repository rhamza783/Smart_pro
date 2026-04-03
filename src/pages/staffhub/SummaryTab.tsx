import React, { useState } from 'react';
import { useStaffStore } from '../../store/staffStore';
import { BarChart, Calendar, Download, User, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SummaryTab: React.FC = () => {
  const { employees, timeEntries, schedules } = useStaffStore();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const activeEmployees = employees.filter(e => e.isActive);

  // Calculate KPIs for current period
  const totalWorkingDays = 30; // Mock
  const totalPresent = timeEntries.filter(t => t.status !== 'absent').length;
  const totalAbsent = timeEntries.filter(t => t.status === 'absent').length;
  const avgHours = timeEntries.length > 0 ? timeEntries.reduce((acc, t) => acc + (t.hoursWorked || 0), 0) / timeEntries.length : 0;

  const getAttendancePercentage = (empId: string) => {
    const entries = timeEntries.filter(t => t.employeeId === empId);
    if (entries.length === 0) return 0;
    const present = entries.filter(t => t.status !== 'absent').length;
    return (present / entries.length) * 100;
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPercentageTextColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const exportReport = () => {
    const headers = ['Employee', 'Role', 'Present Days', 'Absent Days', 'Late Days', 'Total Hours', 'Overtime', 'Attendance %'];
    const rows = activeEmployees.map(emp => {
      const entries = timeEntries.filter(t => t.employeeId === emp.id);
      const present = entries.filter(t => t.status !== 'absent').length;
      const absent = entries.filter(t => t.status === 'absent').length;
      const late = entries.filter(t => t.status === 'late').length;
      const hours = entries.reduce((acc, t) => acc + (t.hoursWorked || 0), 0);
      const overtime = entries.reduce((acc, t) => acc + (t.overtimeHours || 0), 0);
      const pct = getAttendancePercentage(emp.id);
      return [
        emp.name,
        emp.role,
        present,
        absent,
        late,
        hours.toFixed(1),
        overtime.toFixed(1),
        `${pct.toFixed(1)}%`
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_summary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Top Controls */}
      <div className="flex justify-between items-center">
        <div className="flex p-1.5 bg-white/50 rounded-2xl shadow-inner">
          {['week', 'month', 'custom'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                dateRange === range
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Working Days', value: totalWorkingDays, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Present', value: totalPresent, icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Total Absent', value: totalAbsent, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Avg Hours/Day', value: `${avgHours.toFixed(1)}h`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#E0E5EC] p-6 rounded-[32px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center shadow-inner`}>
              <kpi.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black text-gray-800">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="flex-1 bg-[#E0E5EC] rounded-[32px] shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff] overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="py-4 px-4">Employee</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4 text-center">Present</th>
                <th className="py-4 px-4 text-center">Absent</th>
                <th className="py-4 px-4 text-center">Late</th>
                <th className="py-4 px-4 text-center">Total Hours</th>
                <th className="py-4 px-4 text-center">Overtime</th>
                <th className="py-4 px-4">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(emp => {
                const entries = timeEntries.filter(t => t.employeeId === emp.id);
                const present = entries.filter(t => t.status !== 'absent').length;
                const absent = entries.filter(t => t.status === 'absent').length;
                const late = entries.filter(t => t.status === 'late').length;
                const hours = entries.reduce((acc, t) => acc + (t.hoursWorked || 0), 0);
                const overtime = entries.reduce((acc, t) => acc + (t.overtimeHours || 0), 0);
                const pct = getAttendancePercentage(emp.id);

                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`bg-white/50 rounded-2xl shadow-sm hover:bg-white transition-all cursor-pointer ${selectedEmployeeId === emp.id ? 'ring-2 ring-purple-600 bg-white' : ''}`}
                  >
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
                    <td className="py-4 px-4 text-center font-bold text-green-600">{present}</td>
                    <td className="py-4 px-4 text-center font-bold text-red-600">{absent}</td>
                    <td className="py-4 px-4 text-center font-bold text-orange-600">{late}</td>
                    <td className="py-4 px-4 text-center font-bold text-purple-600">{hours.toFixed(1)}h</td>
                    <td className="py-4 px-4 text-center font-bold text-orange-600">{overtime.toFixed(1)}h</td>
                    <td className="py-4 px-4 rounded-r-2xl">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className={`h-full ${getPercentageColor(pct)} shadow-lg`}
                          />
                        </div>
                        <span className={`text-[10px] font-black min-w-[40px] ${getPercentageTextColor(pct)}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Calendar View */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#E0E5EC] p-8 rounded-[40px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  {employees.find(e => e.id === selectedEmployeeId)?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                    Attendance History: {employees.find(e => e.id === selectedEmployeeId)?.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 30 Days Activity</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="text-gray-400 hover:text-gray-600 font-black uppercase tracking-widest text-[10px]"
              >
                Close View
              </button>
            </div>

            <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-15 gap-4">
              {Array.from({ length: 30 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const dateStr = date.toISOString().split('T')[0];
                const entry = timeEntries.find(t => t.employeeId === selectedEmployeeId && t.date === dateStr);
                
                let color = 'bg-gray-100 text-gray-300';
                if (entry) {
                  if (entry.status === 'present') color = 'bg-green-500 text-white shadow-green-200';
                  else if (entry.status === 'late') color = 'bg-orange-500 text-white shadow-orange-200';
                  else if (entry.status === 'absent') color = 'bg-red-500 text-white shadow-red-200';
                }

                return (
                  <div
                    key={i}
                    title={dateStr}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black shadow-md transition-all hover:scale-110 ${color}`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-6 justify-center">
              {[
                { label: 'Present', color: 'bg-green-500' },
                { label: 'Late', color: 'bg-orange-500' },
                { label: 'Absent', color: 'bg-red-500' },
                { label: 'No Entry', color: 'bg-gray-100' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SummaryTab;

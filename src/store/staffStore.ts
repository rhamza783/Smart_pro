import { create } from 'zustand';
import { Employee, DutySchedule, TimeEntry, ShiftConflict } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StaffState {
  employees: Employee[];
  schedules: DutySchedule[];
  timeEntries: TimeEntry[];
  settings: {
    lateThreshold: number;
    overtimeThreshold: number;
    autoClockOutTime: string;
    weekendDays: number[];
  };
  
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deactivateEmployee: (id: string) => void;
  getActiveEmployees: () => Employee[];
  
  saveSchedule: (schedule: Omit<DutySchedule, 'id'> & { id?: string }) => void;
  getScheduleForEmployee: (employeeId: string) => DutySchedule[];
  getTodaySchedule: () => { employee: Employee; schedule: DutySchedule }[];
  
  clockIn: (employeeId: string, time: string, date: string) => void;
  clockOut: (employeeId: string, time: string, date: string) => void;
  getTimeEntry: (employeeId: string, date: string) => TimeEntry | null;
  getAttendanceForDate: (date: string) => TimeEntry[];
  
  detectConflicts: () => ShiftConflict[];
  calcHoursWorked: (clockIn: string, clockOut: string) => number;
  calcOvertimeHours: (hoursWorked: number, scheduledHours: number) => number;
  
  updateSettings: (updates: Partial<StaffState['settings']>) => void;
  saveAll: () => void;
}

const STORAGE_KEY_EMPLOYEES = 'pos_employees';
const STORAGE_KEY_SCHEDULES = 'pos_schedules';
const STORAGE_KEY_TIME_ENTRIES = 'pos_timeEntries';
const STORAGE_KEY_STAFF_SETTINGS = 'pos_staff_settings';

export const useStaffStore = create<StaffState>((set, get) => ({
  employees: JSON.parse(localStorage.getItem(STORAGE_KEY_EMPLOYEES) || '[]'),
  schedules: JSON.parse(localStorage.getItem(STORAGE_KEY_SCHEDULES) || '[]'),
  timeEntries: JSON.parse(localStorage.getItem(STORAGE_KEY_TIME_ENTRIES) || '[]'),
  settings: JSON.parse(localStorage.getItem(STORAGE_KEY_STAFF_SETTINGS) || JSON.stringify({
    lateThreshold: 15,
    overtimeThreshold: 8,
    autoClockOutTime: '23:59',
    weekendDays: [0, 6] // Sun, Sat
  })),

  addEmployee: (emp) => {
    const newEmp: Employee = {
      ...emp,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((state) => ({ employees: [...state.employees, newEmp] }));
    get().saveAll();
    return newEmp;
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    get().saveAll();
  },

  deactivateEmployee: (id) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, isActive: false } : e)),
    }));
    get().saveAll();
  },

  getActiveEmployees: () => {
    return get().employees.filter((e) => e.isActive);
  },

  saveSchedule: (schedule) => {
    set((state) => {
      const existingIdx = state.schedules.findIndex(
        (s) => s.employeeId === schedule.employeeId && s.dayOfWeek === schedule.dayOfWeek
      );
      
      const newSchedules = [...state.schedules];
      if (existingIdx >= 0) {
        newSchedules[existingIdx] = { ...newSchedules[existingIdx], ...schedule };
      } else {
        newSchedules.push({ ...schedule, id: uuidv4() } as DutySchedule);
      }
      
      return { schedules: newSchedules };
    });
    get().saveAll();
  },

  getScheduleForEmployee: (employeeId) => {
    return get().schedules.filter((s) => s.employeeId === employeeId);
  },

  getTodaySchedule: () => {
    const today = new Date().getDay();
    const activeEmps = get().getActiveEmployees();
    return activeEmps.map(emp => {
      const schedule = get().schedules.find(s => s.employeeId === emp.id && s.dayOfWeek === today);
      return { employee: emp, schedule: schedule || { id: '', employeeId: emp.id, dayOfWeek: today, startTime: '', endTime: '', isOff: true } };
    });
  },

  clockIn: (employeeId, time, date) => {
    set((state) => {
      const existingIdx = state.timeEntries.findIndex(
        (t) => t.employeeId === employeeId && t.date === date
      );
      
      const dayOfWeek = new Date(date).getDay();
      const schedule = state.schedules.find(s => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek);
      
      let status: TimeEntry['status'] = 'present';
      if (schedule && !schedule.isOff) {
        const [schedH, schedM] = schedule.startTime.split(':').map(Number);
        const [clockH, clockM] = time.split(':').map(Number);
        const schedMinutes = schedH * 60 + schedM;
        const clockMinutes = clockH * 60 + clockM;
        
        if (clockMinutes > schedMinutes + state.settings.lateThreshold) {
          status = 'late';
        }
      }

      const newEntries = [...state.timeEntries];
      if (existingIdx >= 0) {
        newEntries[existingIdx] = { 
          ...newEntries[existingIdx], 
          clockIn: time, 
          status,
          scheduledIn: schedule?.startTime,
          scheduledOut: schedule?.endTime
        };
      } else {
        newEntries.push({
          id: uuidv4(),
          employeeId,
          date,
          clockIn: time,
          status,
          scheduledIn: schedule?.startTime,
          scheduledOut: schedule?.endTime
        });
      }
      
      return { timeEntries: newEntries };
    });
    get().saveAll();
  },

  clockOut: (employeeId, time, date) => {
    set((state) => {
      const existingIdx = state.timeEntries.findIndex(
        (t) => t.employeeId === employeeId && t.date === date
      );
      
      if (existingIdx === -1) return state;

      const entry = state.timeEntries[existingIdx];
      const hoursWorked = get().calcHoursWorked(entry.clockIn, time);
      
      const dayOfWeek = new Date(date).getDay();
      const schedule = state.schedules.find(s => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek);
      const scheduledHours = schedule && !schedule.isOff ? get().calcHoursWorked(schedule.startTime, schedule.endTime) : 0;
      
      const overtimeHours = get().calcOvertimeHours(hoursWorked, scheduledHours || state.settings.overtimeThreshold);

      const newEntries = [...state.timeEntries];
      newEntries[existingIdx] = {
        ...entry,
        clockOut: time,
        hoursWorked,
        overtimeHours
      };
      
      return { timeEntries: newEntries };
    });
    get().saveAll();
  },

  getTimeEntry: (employeeId, date) => {
    return get().timeEntries.find((t) => t.employeeId === employeeId && t.date === date) || null;
  },

  getAttendanceForDate: (date) => {
    return get().timeEntries.filter((t) => t.date === date);
  },

  detectConflicts: () => {
    // Basic conflict detection: same employee scheduled twice on same day (not possible with current saveSchedule)
    // Or multiple employees in same role at same time (if business rules require)
    // For now, return empty or mock logic
    return [];
  },

  calcHoursWorked: (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    const [h1, m1] = clockIn.split(':').map(Number);
    const [h2, m2] = clockOut.split(':').map(Number);
    
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes < 0) {
      // Overnight shift
      totalMinutes += 24 * 60;
    }
    
    return totalMinutes / 60;
  },

  calcOvertimeHours: (hoursWorked, scheduledHours) => {
    const threshold = scheduledHours > 0 ? scheduledHours : get().settings.overtimeThreshold;
    return Math.max(0, hoursWorked - threshold);
  },

  updateSettings: (updates) => {
    set((state) => ({ settings: { ...state.settings, ...updates } }));
    get().saveAll();
  },

  saveAll: () => {
    const state = get();
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(state.employees));
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(state.schedules));
    localStorage.setItem(STORAGE_KEY_TIME_ENTRIES, JSON.stringify(state.timeEntries));
    localStorage.setItem(STORAGE_KEY_STAFF_SETTINGS, JSON.stringify(state.settings));
  },
}));

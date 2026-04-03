import { create } from 'zustand';
import { Reservation, ReservationSettings } from '../types';
import { useSyncStore } from './syncStore';

interface ReservationState {
  reservations: Reservation[];
  settings: ReservationSettings;
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt'>) => Reservation;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  cancelReservation: (id: string) => void;
  completeReservation: (id: string) => void;
  isTableFree: (tableName: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getFreeTables: (date: string, startTime: string, endTime: string) => string[];
  hasReservationToday: (tableName: string) => boolean;
  isTableBlockedNow: (tableName: string) => boolean;
  getCurrentReservation: (tableName: string) => Reservation | null;
  saveSettings: (settings: ReservationSettings) => void;
  loadReservations: () => void;
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const STORAGE_KEY = 'pos_reservations';
const SETTINGS_KEY = 'pos_reservation_settings';

const defaultSettings: ReservationSettings = {
  defaultDuration: 90,
  beforeMargin: 30,
  afterMargin: 30,
  allowOverbooking: false,
};

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(defaultSettings)),

  addReservation: (res) => {
    const newRes: Reservation = {
      ...res,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    const updated = [...get().reservations, newRes];
    set({ reservations: updated });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    useSyncStore.getState().broadcast('RESERVATION_UPDATED', { reservation: newRes });
    return newRes;
  },

  updateReservation: (id, updates) => {
    const updated = get().reservations.map((r) => (r.id === id ? { ...r, ...updates } : r));
    set({ reservations: updated });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    useSyncStore.getState().broadcast('RESERVATION_UPDATED', { id, updates });
  },

  cancelReservation: (id) => {
    get().updateReservation(id, { status: 'cancelled' });
  },

  completeReservation: (id) => {
    get().updateReservation(id, { status: 'completed' });
  },

  isTableFree: (tableName, date, startTime, endTime, excludeId) => {
    const { reservations, settings } = get();
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);
    
    // Adjusted range for the NEW reservation
    const newRangeStart = newStart - settings.beforeMargin;
    const newRangeEnd = newEnd + settings.afterMargin;

    const conflicts = reservations.filter((r) => {
      if (r.status !== 'confirmed') return false;
      if (r.tableName !== tableName) return false;
      if (r.date !== date) return false;
      if (excludeId && r.id === excludeId) return false;

      const exStart = timeToMinutes(r.startTime);
      const exEnd = timeToMinutes(r.endTime);
      
      // Adjusted range for the EXISTING reservation
      const exRangeStart = exStart - settings.beforeMargin;
      const exRangeEnd = exEnd + settings.afterMargin;

      // Check overlap of adjusted ranges
      return newRangeStart < exRangeEnd && newRangeEnd > exRangeStart;
    });

    return conflicts.length === 0;
  },

  getFreeTables: (date, startTime, endTime) => {
    const { isTableFree } = get();
    const { tableLayout } = (window as any).useLayoutStore?.getState() || { tableLayout: [] };
    
    const allTables: string[] = [];
    tableLayout.forEach((zone: any) => {
      zone.sections.forEach((section: any) => {
        section.tables.forEach((table: any) => {
          allTables.push(table.name);
        });
      });
    });

    return allTables.filter(tableName => isTableFree(tableName, date, startTime, endTime));
  },

  hasReservationToday: (tableName) => {
    const today = new Date().toISOString().split('T')[0];
    return get().reservations.some(r => r.tableName === tableName && r.date === today && r.status === 'confirmed');
  },

  isTableBlockedNow: (tableName) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const { reservations, settings } = get();

    return reservations.some(r => {
      if (r.status !== 'confirmed') return false;
      if (r.tableName !== tableName) return false;
      if (r.date !== today) return false;

      const start = timeToMinutes(r.startTime);
      const end = timeToMinutes(r.endTime);
      
      return currentTime >= (start - settings.beforeMargin) && currentTime <= (end + settings.afterMargin);
    });
  },

  getCurrentReservation: (tableName) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const { reservations, settings } = get();

    return reservations.find(r => {
      if (r.status !== 'confirmed') return false;
      if (r.tableName !== tableName) return false;
      if (r.date !== today) return false;

      const start = timeToMinutes(r.startTime);
      const end = timeToMinutes(r.endTime);
      
      return currentTime >= (start - settings.beforeMargin) && currentTime <= (end + settings.afterMargin);
    }) || null;
  },

  saveSettings: (settings) => {
    set({ settings });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    useSyncStore.getState().broadcast('RESERVATION_UPDATED', { settings });
  },

  loadReservations: () => {
    set({ 
      reservations: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
      settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(defaultSettings))
    });
  }
}));

import { useMemo } from 'react';
import { useReservationStore } from '../store/reservationStore';
import { useLayoutStore } from '../store/layoutStore';
import { Reservation } from '../types';

export const useReservations = () => {
  const { reservations, isTableFree } = useReservationStore();
  const { tableLayout } = useLayoutStore();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayReservations = useMemo(() => {
    return reservations.filter(r => r.date === today && r.status === 'confirmed');
  }, [reservations, today]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return reservations
      .filter(r => {
        if (r.status !== 'confirmed') return false;
        if (r.date < today) return false;
        if (r.date === today) {
          const [h, m] = r.startTime.split(':').map(Number);
          if (h * 60 + m <= currentTime) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 3);
  }, [reservations, today]);

  const allTables = useMemo(() => {
    const tables: string[] = [];
    tableLayout.forEach(zone => {
      zone.sections.forEach(section => {
        section.tables.forEach(table => {
          tables.push(table.name);
        });
      });
    });
    return tables;
  }, [tableLayout]);

  const getTableAvailabilityMap = (date: string, start: string, end: string) => {
    const map: Record<string, boolean> = {};
    allTables.forEach(tableName => {
      map[tableName] = isTableFree(tableName, date, start, end);
    });
    return map;
  };

  return {
    todayReservations,
    upcomingReservations,
    isTableAvailable: isTableFree,
    getTableAvailabilityMap,
    allTables
  };
};

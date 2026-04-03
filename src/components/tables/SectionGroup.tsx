import React from 'react';
import { Table, Zone } from '../../types';
import TableButton from './TableButton';
import { useTableStore } from '../../store/tableStore';
import { useReservationStore } from '../../store/reservationStore';

interface SectionGroupProps {
  sectionName: string;
  tables: Table[];
  zone: Zone;
  onTableClick: (tableName: string, zone: Zone) => void;
}

const SectionGroup: React.FC<SectionGroupProps> = ({ sectionName, tables, zone, onTableClick }) => {
  const getTableStatus = useTableStore(state => state.getTableStatus);
  const orders = useTableStore(state => state.orders);
  const { isTableBlockedNow, hasReservationToday } = useReservationStore();

  return (
    <div className="flex border-b border-gray-300/50 py-6 last:border-0">
      {/* Vertical Section Label */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center">
        <div className="rotate-180 [writing-mode:vertical-lr] text-text-secondary font-bold text-xs uppercase tracking-widest opacity-50">
          {sectionName}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 flex flex-wrap gap-6 pl-4">
        {tables.map((table) => {
          const status = getTableStatus(table.name);
          const order = orders[table.name];
          const minutesOpen = order 
            ? Math.floor((Date.now() - order.startTime) / 60000) 
            : undefined;

          const isReserved = hasReservationToday(table.name);
          const isBlocked = isTableBlockedNow(table.name);

          const itemCount = order?.items.reduce((sum, item) => sum + item.qty, 0);

          return (
            <div 
              key={table.name} 
              style={{ 
                width: zone.settings?.tableBtnWidth || '100px', 
                height: zone.settings?.tableBtnHeight || '80px' 
              }}
            >
              <TableButton
                tableName={table.name}
                status={status}
                minutesOpen={minutesOpen}
                totalAmount={order?.total}
                itemCount={itemCount}
                isReserved={isReserved}
                isBlocked={isBlocked}
                onClick={() => onTableClick(table.name, zone)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionGroup;

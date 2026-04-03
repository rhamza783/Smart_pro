import React, { useEffect, useState } from 'react';
import { Zone } from '../types';
import SectionGroup from '../components/tables/SectionGroup';
import { Info } from 'lucide-react';
import { useTableOpen } from '../hooks/useTableOpen';
import WaiterModal from '../components/modals/WaiterModal';
import CustomerModal from '../components/modals/CustomerModal';
import ReservationWarningModal from '../components/modals/ReservationWarningModal';

interface TableSectionProps {
  zone: Zone;
}

const TableSection: React.FC<TableSectionProps> = ({ zone }) => {
  // Force re-render every 60 seconds to update timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const {
    handleTableClick,
    waiterModalOpen,
    customerModalOpen,
    reservationWarningOpen,
    waiterModalProps,
    customerModalProps,
    reservationWarningProps
  } = useTableOpen();

  const hasTables = zone.sections.some(s => s.tables.length > 0);

  if (!hasTables) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-10">
        <div className="w-20 h-20 rounded-full shadow-neumorphic flex items-center justify-center mb-6 bg-background">
          <Info size={40} className="text-primary opacity-50" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">No tables configured</h3>
        <p className="text-text-secondary max-w-xs">
          Go to Configuration to add tables for the {zone.name} zone.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-2">
        {zone.sections.map((section, idx) => (
          <SectionGroup
            key={idx}
            sectionName={section.name}
            tables={section.tables}
            zone={zone}
            onTableClick={handleTableClick}
          />
        ))}
      </div>

      {/* Modals */}
      {waiterModalOpen && <WaiterModal {...waiterModalProps} />}
      {customerModalOpen && <CustomerModal {...customerModalProps} />}
      {reservationWarningOpen && <ReservationWarningModal {...reservationWarningProps} />}
    </div>
  );
};

export default TableSection;

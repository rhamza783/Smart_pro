import { useState, useCallback } from 'react';
import { Zone, Customer, ZoneSettings } from '../types';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useLayoutStore } from '../store/layoutStore';
import { useReservationStore } from '../store/reservationStore';

export const useTableOpen = () => {
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [reservationWarningOpen, setReservationWarningOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState<{ name: string; zone: Zone } | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<string>('Staff');

  const { orders, createOrder } = useTableStore();
  const { setTable, loadFromOrder } = useCartStore();
  const setActiveSection = useLayoutStore(state => state.setActiveSection);
  const { isTableBlockedNow, getCurrentReservation } = useReservationStore();

  const finalizeOrder = useCallback((tableName: string, waiter: string, customer: Customer) => {
    const newOrder = createOrder(tableName, waiter, customer);
    setTable(tableName);
    loadFromOrder(newOrder);
    setActiveSection('menu');
    setPendingTable(null);
    setSelectedWaiter('Staff');
  }, [createOrder, setTable, loadFromOrder, setActiveSection]);

  const proceedWithOpening = useCallback((tableName: string, zone: Zone) => {
    setPendingTable({ name: tableName, zone });
    const settings = zone.settings;

    if (settings?.askForWaiter) {
      setWaiterModalOpen(true);
    } else if (settings?.askForClient) {
      setCustomerModalOpen(true);
    } else {
      finalizeOrder(tableName, 'Staff', { name: '', phone: '', address: '' });
    }
  }, [finalizeOrder]);

  const handleTableClick = useCallback((tableName: string, zone: Zone) => {
    // If table already has an active order, load it directly
    if (orders[tableName]) {
      setTable(tableName);
      loadFromOrder(orders[tableName]);
      setActiveSection('menu');
      return;
    }

    // Check if table is blocked by reservation
    if (isTableBlockedNow(tableName)) {
      setPendingTable({ name: tableName, zone });
      setReservationWarningOpen(true);
      return;
    }

    proceedWithOpening(tableName, zone);
  }, [orders, setTable, loadFromOrder, setActiveSection, isTableBlockedNow, proceedWithOpening]);

  const onWaiterSelect = (waiterName: string) => {
    if (!pendingTable) return;
    setSelectedWaiter(waiterName);
    setWaiterModalOpen(false);

    if (pendingTable.zone.settings?.askForClient) {
      setCustomerModalOpen(true);
    } else {
      finalizeOrder(pendingTable.name, waiterName, { name: '', phone: '', address: '' });
    }
  };

  const onCustomerConfirm = (customer: Customer) => {
    if (!pendingTable) return;
    setCustomerModalOpen(false);
    finalizeOrder(pendingTable.name, selectedWaiter, customer);
  };

  const onReservationConfirm = () => {
    if (!pendingTable) return;
    setReservationWarningOpen(false);
    proceedWithOpening(pendingTable.name, pendingTable.zone);
  };

  return {
    handleTableClick,
    waiterModalOpen,
    customerModalOpen,
    reservationWarningOpen,
    setWaiterModalOpen,
    setCustomerModalOpen,
    setReservationWarningOpen,
    waiterModalProps: {
      onSelect: onWaiterSelect,
      onClose: () => setWaiterModalOpen(false),
      zoneSettings: pendingTable?.zone.settings || { askForClient: false, askForWaiter: true, tableSize: 'medium' }
    },
    customerModalProps: {
      onConfirm: onCustomerConfirm,
      onClose: () => setCustomerModalOpen(false)
    },
    reservationWarningProps: {
      reservation: pendingTable ? getCurrentReservation(pendingTable.name) : null,
      onConfirm: onReservationConfirm,
      onClose: () => setReservationWarningOpen(false)
    }
  };
};

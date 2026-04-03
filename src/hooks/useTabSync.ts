import React, { useEffect, useCallback } from 'react';
import { useSyncStore } from '../store/syncStore';
import { useTableStore } from '../store/tableStore';
import { useMenuStore } from '../store/menuStore';
import { useSettingsStore } from '../store/settingsStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useClientStore } from '../store/clientStore';
import { useCartStore } from '../store/cartStore';
import { useHistoryStore } from '../store/historyStore';
import { useReservationStore } from '../store/reservationStore';
import { SyncMessage, TabInfo } from '../types';
import { toast } from 'sonner';

export const useTabSync = () => {
  const { 
    tabId, 
    activeTabs, 
    isLeaderTab, 
    initSync, 
    cleanup, 
    broadcast, 
    channel,
    lastSyncAt
  } = useSyncStore();

  const { orders, updateOrder, removeOrder, createOrder, setOrders } = useTableStore();
  const { menuItems, loadMenu } = useMenuStore();
  const { loadSettings } = useSettingsStore();
  const { adjustStock, setStock } = useInventoryStore();
  const { clients, loadClients } = useClientStore();
  const { currentTable } = useCartStore();
  const { addHistoryOrder } = useHistoryStore();
  const { loadReservations } = useReservationStore();

  // Use a ref for the message handler to avoid re-running useEffect when dependencies change
  const handlerRef = React.useRef<(message: SyncMessage) => void>(() => {});

  const handleIncomingMessage = useCallback((message: SyncMessage) => {
    if (message.tabId === tabId) return;

    switch (message.type) {
      case 'ORDER_CREATED':
      case 'ORDER_UPDATED': {
        const { tableName, order } = message.payload;
        const currentOrders = useTableStore.getState().orders;
        const localOrder = currentOrders[tableName];
        
        // Conflict resolution
        if (!localOrder || (order.lastModified || 0) > (localOrder.lastModified || 0)) {
          setOrders({ ...currentOrders, [tableName]: order });
        } else if (order.lastModified === localOrder.lastModified) {
          // Tie break with tabId
          if (message.tabId > tabId) {
            setOrders({ ...currentOrders, [tableName]: order });
          }
        }
        break;
      }

      case 'ORDER_DELETED':
        removeOrder(message.payload.tableName);
        break;

      case 'ORDER_FINALIZED': {
        const { tableName, order } = message.payload;
        removeOrder(tableName);
        addHistoryOrder(order);
        break;
      }

      case 'MENU_UPDATED':
        toast.info('Menu updated in another tab. Refreshing...');
        loadMenu();
        break;

      case 'SETTINGS_CHANGED':
        toast.info('Settings updated in another tab.');
        loadSettings();
        break;

      case 'STOCK_UPDATED': {
        const { ingredientId, newQty } = message.payload;
        setStock(ingredientId, newQty);
        break;
      }

      case 'STOCK_BATCH_UPDATED':
        // loadInventory();
        break;

      case 'RESERVATION_UPDATED':
        loadReservations();
        break;

      case 'CLIENT_UPDATED':
        loadClients();
        break;

      case 'TABLE_STATUS_CHANGED': {
        const { tableName } = message.payload;
        const currentActiveTabs = useSyncStore.getState().activeTabs;
        // Update the activeTabs entry for the sender
        const updatedTabs = currentActiveTabs.map(t => 
          t.tabId === message.tabId 
            ? { ...t, currentTable: tableName || undefined } 
            : t
        );
        useSyncStore.setState({ activeTabs: updatedTabs });
        break;
      }

      case 'SECTION_CHANGED': {
        const { section } = message.payload;
        const currentActiveTabs = useSyncStore.getState().activeTabs;
        const updatedTabs = currentActiveTabs.map(t => 
          t.tabId === message.tabId 
            ? { ...t, activeSection: section } 
            : t
        );
        useSyncStore.setState({ activeTabs: updatedTabs });
        break;
      }

      case 'USER_LOGGED_IN': {
        const { user } = message.payload;
        const currentActiveTabs = useSyncStore.getState().activeTabs;
        const updatedTabs = currentActiveTabs.map(t => 
          t.tabId === message.tabId 
            ? { ...t, currentUser: user } 
            : t
        );
        useSyncStore.setState({ activeTabs: updatedTabs });
        break;
      }

      case 'USER_LOGGED_OUT': {
        const currentActiveTabs = useSyncStore.getState().activeTabs;
        const updatedTabs = currentActiveTabs.map(t => 
          t.tabId === message.tabId 
            ? { ...t, currentUser: null } 
            : t
        );
        useSyncStore.setState({ activeTabs: updatedTabs });
        break;
      }
    }
  }, [tabId, setOrders, removeOrder, addHistoryOrder, loadMenu, loadSettings, loadClients, loadReservations, setStock]);

  // Update the ref whenever the handler changes
  useEffect(() => {
    handlerRef.current = handleIncomingMessage;
  }, [handleIncomingMessage]);

  useEffect(() => {
    initSync();
    
    const bc = new BroadcastChannel('pos-sync');
    bc.onmessage = (event) => {
      if (handlerRef.current) {
        handlerRef.current(event.data);
      }
    };

    // Tab close warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const activeTable = useCartStore.getState().currentTable;
      if (activeTable) {
        e.preventDefault();
        e.returnValue = 'You have an active order. Are you sure you want to close?';
      }
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
      bc.close();
    };
  }, [initSync, cleanup]); // Only run on mount/unmount

  return {
    isOnline: true,
    activeTabs,
    tabCount: activeTabs.length,
    isLeader: isLeaderTab,
    broadcast,
    tabId,
    lastSyncAt
  };
};

import { create } from 'zustand';
import { SyncMessage, SyncMessageType, TabInfo, SyncError } from '../types';
import { generateTabId, initTabSync, broadcastMessage, isOwnMessage } from '../utils/tabSync';
import { useAuthStore } from './authStore';
import { useCartStore } from './cartStore';
import { useLayoutStore } from './layoutStore';

interface SyncState {
  tabId: string;
  activeTabs: TabInfo[];
  channel: BroadcastChannel | null;
  isLeaderTab: boolean;
  lastSyncAt: number;
  syncErrors: SyncError[];
  
  initSync: () => void;
  broadcast: (type: SyncMessageType, payload: any) => void;
  handleIncoming: (message: SyncMessage) => void;
  registerTab: () => void;
  deregisterTab: () => void;
  electLeader: () => void;
  sendHeartbeat: () => void;
  cleanup: () => void;
  addSyncError: (error: string) => void;
}

export const useSyncStore = create<SyncState>((set, get) => {
  let heartbeatInterval: any = null;
  let tabCleanupInterval: any = null;

  return {
    tabId: generateTabId(),
    activeTabs: [],
    channel: null,
    isLeaderTab: false,
    lastSyncAt: Date.now(),
    syncErrors: [],

    initSync: () => {
      const { tabId, handleIncoming, registerTab, sendHeartbeat, electLeader } = get();
      
      const channel = initTabSync();
      if (channel) {
        channel.onmessage = (event) => handleIncoming(event.data);
      }

      // Fallback for storage events
      window.addEventListener('storage', (e) => {
        if (e.key === 'pos-sync-event' && e.newValue) {
          try {
            const message = JSON.parse(e.newValue);
            handleIncoming(message);
          } catch (err) {
            console.error('Failed to parse sync message from storage', err);
          }
        }
      });

      set({ channel });
      
      registerTab();
      sendHeartbeat();
      electLeader();

      // Start intervals
      heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 15000);

      tabCleanupInterval = setInterval(() => {
        const now = Date.now();
        set((state) => {
          const filtered = state.activeTabs.filter(t => (now - t.lastHeartbeat) < 45000);
          if (filtered.length !== state.activeTabs.length) {
            return { activeTabs: filtered };
          }
          return state;
        });
        electLeader();
      }, 15000);
    },

    broadcast: (type, payload) => {
      const { channel, tabId } = get();
      broadcastMessage(channel, type, payload, tabId);
    },

    handleIncoming: (message) => {
      const { tabId, electLeader } = get();
      if (isOwnMessage(message, tabId)) return;

      set({ lastSyncAt: Date.now() });

      // Handle specific message types that affect sync state
      switch (message.type) {
        case 'TAB_OPENED':
          set((state) => {
            const exists = state.activeTabs.find(t => t.tabId === message.tabId);
            if (exists) return state;
            return { activeTabs: [...state.activeTabs, message.payload] };
          });
          // Respond with own heartbeat so the new tab knows about us
          get().sendHeartbeat();
          electLeader();
          break;

        case 'TAB_CLOSED':
          set((state) => ({
            activeTabs: state.activeTabs.filter(t => t.tabId === message.tabId)
          }));
          electLeader();
          break;

        case 'HEARTBEAT':
          set((state) => {
            const existing = state.activeTabs.find(t => t.tabId === message.tabId);
            if (existing) {
              return {
                activeTabs: state.activeTabs.map(t => 
                  t.tabId === message.tabId ? { ...message.payload, lastHeartbeat: Date.now() } : t
                )
              };
            } else {
              return {
                activeTabs: [...state.activeTabs, { ...message.payload, lastHeartbeat: Date.now() }]
              };
            }
          });
          break;
      }

      // Other stores will listen to these messages via the useTabSync hook or direct subscription
    },

    registerTab: () => {
      const { tabId, broadcast } = get();
      const currentUser = useAuthStore.getState().currentUser?.name || null;
      const currentTable = useCartStore.getState().currentTable;
      const activeSection = useLayoutStore.getState().activeSection;

      const tabInfo: TabInfo = {
        tabId,
        openedAt: Date.now(),
        lastHeartbeat: Date.now(),
        currentTable,
        currentUser,
        activeSection
      };
      broadcast('TAB_OPENED', tabInfo);
      set((state) => ({
        activeTabs: [...state.activeTabs, tabInfo]
      }));
    },

    deregisterTab: () => {
      const { tabId, broadcast, channel } = get();
      broadcast('TAB_CLOSED', { tabId });
      if (channel) channel.close();
    },

    electLeader: () => {
      const { activeTabs, tabId } = get();
      if (activeTabs.length === 0) {
        set({ isLeaderTab: true });
        return;
      }

      const oldestTab = [...activeTabs].sort((a, b) => a.openedAt - b.openedAt)[0];
      set({ isLeaderTab: oldestTab.tabId === tabId });
    },

    sendHeartbeat: () => {
      const { tabId, broadcast } = get();
      const currentUser = useAuthStore.getState().currentUser?.name || null;
      const currentTable = useCartStore.getState().currentTable;
      const activeSection = useLayoutStore.getState().activeSection;
      
      const tabInfo: TabInfo = {
        tabId,
        openedAt: Date.now(), // This should ideally be stored in a ref or state upon init
        lastHeartbeat: Date.now(),
        currentTable,
        currentUser,
        activeSection
      };
      broadcast('HEARTBEAT', tabInfo);
    },

    cleanup: () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (tabCleanupInterval) clearInterval(tabCleanupInterval);
      get().deregisterTab();
    },

    addSyncError: (error) => {
      set((state) => ({
        syncErrors: [{ timestamp: Date.now(), error }, ...state.syncErrors].slice(0, 10)
      }));
    }
  };
});

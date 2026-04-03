import { SyncMessage, SyncMessageType } from '../types';

const CHANNEL_NAME = 'pos-sync';

export const generateTabId = (): string => {
  const existing = sessionStorage.getItem('pos_tab_id');
  if (existing) return existing;
  
  const newId = crypto.randomUUID();
  sessionStorage.setItem('pos_tab_id', newId);
  return newId;
};

export const initTabSync = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
};

export const broadcastMessage = (
  channel: BroadcastChannel | null,
  type: SyncMessageType,
  payload: any,
  tabId: string
): void => {
  const message: SyncMessage = {
    type,
    payload,
    senderId: tabId,
    timestamp: Date.now(),
    tabId
  };

  if (channel) {
    channel.postMessage(message);
  } else {
    // Fallback to localStorage
    localStorage.setItem('pos-sync-event', JSON.stringify(message));
    // Immediately clear it to allow same message again
    localStorage.removeItem('pos-sync-event');
  }
};

export const isOwnMessage = (message: SyncMessage, tabId: string): boolean => {
  return message.tabId === tabId;
};

export const supportsBroadcastChannel = typeof BroadcastChannel !== 'undefined';

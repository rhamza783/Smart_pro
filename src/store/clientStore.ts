import { create } from 'zustand';
import { Client, LedgerEntry, LoyaltySettings, LoyaltyTier, CommunicationEntry, RedemptionEntry } from '../types';
import { useSyncStore } from './syncStore';

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  loyaltySettings: LoyaltySettings;
  setSelectedClient: (client: Client | null) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'ledger'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  recordPayment: (clientId: string, amount: number, method: string) => void;
  getOutstandingBalance: (clientId: string) => number;
  searchClients: (term: string) => Client[];
  blockClient: (id: string) => void;
  unblockClient: (id: string) => void;
  addLedgerEntry: (clientId: string, entry: Omit<LedgerEntry, 'id' | 'date' | 'balance'>) => void;
  
  // Loyalty Functions
  awardPoints: (clientId: string, orderTotal: number) => number;
  redeemPoints: (clientId: string, points: number, orderId: string) => number;
  getClientTier: (points: number) => LoyaltyTier;
  getPointsValue: (points: number) => number;
  getPointsForAmount: (amount: number) => number;
  updateLoyaltySettings: (updates: Partial<LoyaltySettings>) => void;
  
  // CRM Functions
  logCommunication: (clientId: string, entry: Omit<CommunicationEntry, 'id' | 'createdAt'>) => void;
  
  saveClients: () => void;
  loadClients: () => void;
}

const STORAGE_KEY = 'pos_clients';
const LOYALTY_STORAGE_KEY = 'pos_loyalty_settings';

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  pointsPerCurrency: 10,
  redeemRate: 100,
  minRedeem: 500,
  tiers: [
    { name: 'Bronze', minPoints: 0, color: '#9CA3AF', badge: '🥉', perks: [] },
    { name: 'Silver', minPoints: 500, color: '#6B7280', badge: '🥈', perks: ['5% discount perk'] },
    { name: 'Gold', minPoints: 1500, color: '#FBBF24', badge: '🥇', perks: ['10% discount perk', 'Priority service'] },
    { name: 'Platinum', minPoints: 5000, color: '#8B5CF6', badge: '💎', perks: ['15% discount', 'Free delivery'] },
  ]
};

const loadLoyaltySettings = (): LoyaltySettings => {
  const stored = localStorage.getItem(LOYALTY_STORAGE_KEY);
  if (!stored) return DEFAULT_LOYALTY_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_LOYALTY_SETTINGS;
  }
};

const loadClients = (): Client[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse clients', e);
    return [];
  }
};

export const useClientStore = create<ClientState>((set, get) => ({
  clients: loadClients(),
  selectedClient: null,
  loyaltySettings: loadLoyaltySettings(),

  setSelectedClient: (client) => set({ selectedClient: client }),

  addClient: (clientData) => {
    const newClient: Client = {
      ...clientData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      ledger: [],
      totalOrdered: 0,
      totalPaid: 0,
      loyaltyPoints: 0,
      isBlocked: false,
    };

    set((state) => {
      const newClients = [...state.clients, newClient];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));
      return { clients: newClients };
    });

    return newClient;
  },

  updateClient: (id, updates) => {
    set((state) => {
      const newClients = state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));
      
      // Update selected client if it's the one being updated
      const updatedSelected = state.selectedClient?.id === id 
        ? { ...state.selectedClient, ...updates } 
        : state.selectedClient;

      return { clients: newClients, selectedClient: updatedSelected };
    });
  },

  deleteClient: (id) => {
    set((state) => {
      const newClients = state.clients.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));
      const newSelected = state.selectedClient?.id === id ? null : state.selectedClient;
      return { clients: newClients, selectedClient: newSelected };
    });
  },

  recordPayment: (clientId, amount, method) => {
    set((state) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return state;

      const newTotalPaid = client.totalPaid + amount;
      const outstanding = client.totalOrdered - client.totalPaid;
      const newBalance = outstanding - amount;

      const entry: LedgerEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        type: 'payment',
        description: `${method} Payment`,
        debit: 0,
        credit: amount,
        balance: newBalance,
      };

      const updatedClient = {
        ...client,
        totalPaid: newTotalPaid,
        ledger: [entry, ...client.ledger],
      };

      const newClients = state.clients.map((c) => (c.id === clientId ? updatedClient : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));

      const updatedSelected = state.selectedClient?.id === clientId ? updatedClient : state.selectedClient;

      return { clients: newClients, selectedClient: updatedSelected };
    });
  },

  getOutstandingBalance: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return 0;
    return client.totalOrdered - client.totalPaid;
  },

  searchClients: (term) => {
    const lowerTerm = term.toLowerCase();
    return get().clients.filter(
      (c) => c.name.toLowerCase().includes(lowerTerm) || c.phone.includes(term)
    );
  },

  blockClient: (id) => get().updateClient(id, { isBlocked: true }),
  unblockClient: (id) => get().updateClient(id, { isBlocked: false }),

  addLedgerEntry: (clientId, entryData) => {
    set((state) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return state;

      const debit = (entryData as any).debit || 0;
      const credit = (entryData as any).credit || (entryData as any).amount || 0;

      const newTotalOrdered = client.totalOrdered + debit;
      const newTotalPaid = client.totalPaid + credit;
      const newBalance = newTotalOrdered - newTotalPaid;

      const entry: LedgerEntry = {
        ...entryData,
        id: Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        debit,
        credit,
        balance: newBalance,
      } as LedgerEntry;

      const updatedClient = {
        ...client,
        totalOrdered: newTotalOrdered,
        totalPaid: newTotalPaid,
        ledger: [entry, ...client.ledger],
      };

      const newClients = state.clients.map((c) => (c.id === clientId ? updatedClient : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));

      const updatedSelected = state.selectedClient?.id === clientId ? updatedClient : state.selectedClient;

      return { clients: newClients, selectedClient: updatedSelected };
    });
  },

  // Loyalty Implementation
  awardPoints: (clientId, orderTotal) => {
    const { loyaltySettings } = get();
    const points = Math.floor(orderTotal * loyaltySettings.pointsPerCurrency);
    const client = get().clients.find(c => c.id === clientId);
    if (client) {
      get().updateClient(clientId, { loyaltyPoints: (client.loyaltyPoints || 0) + points });
    }
    return points;
  },

  redeemPoints: (clientId, points, orderId) => {
    const { loyaltySettings } = get();
    const value = Math.floor(points / loyaltySettings.redeemRate);
    const client = get().clients.find(c => c.id === clientId);
    
    if (client && client.loyaltyPoints >= points) {
      const redemption: RedemptionEntry = {
        id: `RED-${Date.now()}`,
        date: Date.now(),
        points,
        value,
        orderId
      };
      
      get().updateClient(clientId, {
        loyaltyPoints: client.loyaltyPoints - points,
        redemptions: [redemption, ...(client.redemptions || [])]
      });
      return value;
    }
    return 0;
  },

  getClientTier: (points) => {
    const { tiers } = get().loyaltySettings;
    
    // Sort tiers by minPoints descending to find the highest applicable tier
    const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
    return sortedTiers.find(t => points >= t.minPoints) || tiers[0];
  },

  getPointsValue: (points) => {
    return Math.floor(points / get().loyaltySettings.redeemRate);
  },

  getPointsForAmount: (amount) => {
    return Math.floor(amount * get().loyaltySettings.pointsPerCurrency);
  },

  updateLoyaltySettings: (updates) => {
    set(state => {
      const newSettings = { ...state.loyaltySettings, ...updates };
      localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(newSettings));
      return { loyaltySettings: newSettings };
    });
  },

  // CRM Implementation
  logCommunication: (clientId, entry) => {
    const client = get().clients.find(c => c.id === clientId);
    if (client) {
      const newEntry: CommunicationEntry = {
        ...entry,
        id: `COM-${Date.now()}`,
        createdAt: Date.now()
      };
      get().updateClient(clientId, {
        communications: [newEntry, ...(client.communications || [])]
      });
    }
  },

  saveClients: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().clients));
    useSyncStore.getState().broadcast('CLIENT_UPDATED', null);
  },

  loadClients: () => {
    set({ clients: loadClients() });
  },
}));

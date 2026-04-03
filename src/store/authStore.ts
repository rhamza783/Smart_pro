import { create } from 'zustand';
import { AppUser, AppRole } from '../types';
import { defaultWorkers, defaultRoles } from '../data/initialData';
import { useSyncStore } from './syncStore';

interface AuthState {
  currentUser: AppUser | null;
  appWorkers: AppUser[];
  appRoles: AppRole[];
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  hasPerm: (permName: string) => boolean;
  addWorker: (worker: AppUser) => void;
  updateWorker: (index: number, worker: AppUser) => void;
  deleteWorker: (index: number) => void;
  updateRole: (index: number, role: AppRole) => void;
}

const getStoredWorkers = (): AppUser[] => {
  const stored = localStorage.getItem('pos_workers');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultWorkers;
    }
  }
  return defaultWorkers;
};

const getStoredRoles = (): AppRole[] => {
  const stored = localStorage.getItem('pos_roles');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultRoles;
    }
  }
  return defaultRoles;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  appWorkers: getStoredWorkers(),
  appRoles: getStoredRoles(),
  
  login: (id, pass) => {
    const user = get().appWorkers.find(w => w.login === id && w.pass === pass);
    if (user) {
      set({ currentUser: user });
      useSyncStore.getState().broadcast('USER_LOGGED_IN', { user: user.name });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ currentUser: null });
    useSyncStore.getState().broadcast('USER_LOGGED_OUT', {});
  },
  
  hasPerm: (permName) => {
    const { currentUser, appRoles } = get();
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    
    const role = appRoles.find(r => r.name === currentUser.role);
    if (!role) return false;
    
    return !!role.perms[permName];
  },
  
  addWorker: (worker) => {
    const newWorkers = [...get().appWorkers, worker];
    set({ appWorkers: newWorkers });
    localStorage.setItem('pos_workers', JSON.stringify(newWorkers));
  },
  
  updateWorker: (index, worker) => {
    const newWorkers = [...get().appWorkers];
    newWorkers[index] = worker;
    set({ appWorkers: newWorkers });
    localStorage.setItem('pos_workers', JSON.stringify(newWorkers));
  },
  
  deleteWorker: (index) => {
    const newWorkers = get().appWorkers.filter((_, i) => i !== index);
    set({ appWorkers: newWorkers });
    localStorage.setItem('pos_workers', JSON.stringify(newWorkers));
  },
  
  updateRole: (index, role) => {
    const newRoles = [...get().appRoles];
    newRoles[index] = role;
    set({ appRoles: newRoles });
    localStorage.setItem('pos_roles', JSON.stringify(newRoles));
  },
}));

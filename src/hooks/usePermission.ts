import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const hasPerm = useAuthStore(state => state.hasPerm);

  const requirePerm = (permName: string, onDenied?: () => void): boolean => {
    const allowed = hasPerm(permName);
    if (!allowed && onDenied) {
      onDenied();
    }
    return allowed;
  };

  return { hasPerm, requirePerm };
};

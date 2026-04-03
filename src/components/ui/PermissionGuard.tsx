import React, { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGuardProps {
  perm: string;
  children: ReactNode;
  fallback?: ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ perm, children, fallback = null }) => {
  const { hasPerm } = usePermission();

  if (hasPerm(perm)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGuard;

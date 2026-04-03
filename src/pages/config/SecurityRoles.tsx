import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import RolePermissionCard from '../../components/config/RolePermissionCard';
import { ShieldAlert } from 'lucide-react';

const SecurityRoles: React.FC = () => {
  const { appRoles, updateRole } = useAuthStore();
  const { showToast } = useToastStore();

  const handleSaveRole = (index: number, updatedRole: any) => {
    updateRole(index, updatedRole);
    showToast(`${updatedRole.name} permissions updated successfully`, 'success');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-black text-gray-700 uppercase tracking-tight">Security Roles</h2>
        </div>
        <p className="text-sm text-gray-500 font-medium ml-13">
          Define strict permissions for each system role. Admin permissions are locked and cannot be modified.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {appRoles.map((role, index) => (
          <RolePermissionCard 
            key={role.name}
            role={role}
            onSave={(updated) => handleSaveRole(index, updated)}
          />
        ))}
      </div>
    </div>
  );
};

export default SecurityRoles;

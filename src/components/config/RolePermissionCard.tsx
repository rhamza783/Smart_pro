import React, { useState, useEffect } from 'react';
import { AppRole } from '../../types';
import { Save, AlertCircle, ShieldCheck } from 'lucide-react';

interface RolePermissionCardProps {
  role: AppRole;
  onSave: (updatedRole: AppRole) => void;
}

const PERMISSIONS = [
  { key: 'editRoles', label: 'Edit Roles / Admin' },
  { key: 'createOrder', label: 'Create Orders' },
  { key: 'transferTable', label: 'Transfer Tables' },
  { key: 'transferWaiter', label: 'Transfer Waiter' },
  { key: 'splitOrder', label: 'Split Orders' },
  { key: 'applyDiscount', label: 'Apply Discounts' },
  { key: 'applyTax', label: 'Apply Taxes' },
  { key: 'refund', label: 'Refund' },
  { key: 'deleteActiveOrder', label: 'Delete Active Orders' },
  { key: 'wipeHistory', label: 'Wipe History' },
  { key: 'manageClients', label: 'Manage Clients' },
  { key: 'manageAccounts', label: 'Manage Accounts' },
  { key: 'viewDashboard', label: 'View Dashboard' },
  { key: 'viewReports', label: 'View Reports' },
  { key: 'viewHistory', label: 'View History' },
  { key: 'reprintOrder', label: 'Reprint Orders' },
  { key: 'modifyPrinted', label: 'Modify Printed Items', highSecurity: true },
  { key: 'manageInventory', label: 'Manage Inventory' },
  { key: 'approvePurchase', label: 'Approve Purchases' },
  { key: 'approveWastage', label: 'Approve Wastage' },
];

const RolePermissionCard: React.FC<RolePermissionCardProps> = ({ role, onSave }) => {
  const [localPerms, setLocalPerms] = useState(role.perms);
  const isAdmin = role.name === 'Admin';

  useEffect(() => {
    setLocalPerms(role.perms);
  }, [role]);

  const isDirty = JSON.stringify(localPerms) !== JSON.stringify(role.perms);

  const handleToggle = (key: string) => {
    if (isAdmin) return;
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getRoleColor = (name: string) => {
    switch (name) {
      case 'Admin': return '#6750A4';
      case 'Manager': return '#3182CE';
      case 'Cashier': return '#38a169';
      case 'Waiter': return '#DD6B20';
      default: return '#666';
    }
  };

  const roleColor = getRoleColor(role.name);

  return (
    <div className="bg-[#E0E5EC] rounded-[32px] p-6 shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
            style={{ backgroundColor: roleColor }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: roleColor }}>
            {role.name}
          </h3>
        </div>
        {isDirty && !isAdmin && (
          <div className="flex items-center gap-1 text-orange-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <AlertCircle size={12} />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {PERMISSIONS.map(perm => (
          <div 
            key={perm.key}
            onClick={() => handleToggle(perm.key)}
            className={`
              flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer
              ${isAdmin ? 'opacity-80 cursor-not-allowed' : 'hover:bg-white/20'}
              ${localPerms[perm.key] ? 'bg-white/40 shadow-inner' : 'bg-transparent'}
            `}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">{perm.label}</span>
              {perm.highSecurity && (
                <span className="text-[9px] text-red-500 font-black uppercase tracking-tighter">(High Security)</span>
              )}
            </div>
            <div 
              className={`
                w-10 h-5 rounded-full transition-all duration-300 relative
                ${(isAdmin || localPerms[perm.key]) ? 'bg-purple-600' : 'bg-gray-300'}
              `}
            >
              <div 
                className={`
                  absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300
                  ${(isAdmin || localPerms[perm.key]) ? 'left-6' : 'left-1'}
                `} 
              />
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!isDirty || isAdmin}
        onClick={() => onSave({ ...role, perms: localPerms })}
        className={`
          mt-6 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all
          ${(!isDirty || isAdmin) 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'text-white shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] active:shadow-inner'
          }
        `}
        style={{ backgroundColor: (!isDirty || isAdmin) ? undefined : roleColor }}
      >
        <Save size={18} />
        Save Permissions
      </button>
    </div>
  );
};

export default RolePermissionCard;

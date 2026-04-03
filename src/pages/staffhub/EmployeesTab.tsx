import React, { useState } from 'react';
import { useStaffStore } from '../../store/staffStore';
import { Edit2, Calendar, Power, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';

const EmployeesTab: React.FC = () => {
  const { employees, deactivateEmployee, updateEmployee } = useStaffStore();
  const [showInactive, setShowInactive] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const filteredEmployees = employees.filter(e => showInactive ? true : e.isActive);
  const activeEmployees = filteredEmployees.filter(e => e.isActive);
  const inactiveEmployees = filteredEmployees.filter(e => !e.isActive);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'cashier': return 'bg-green-100 text-green-600 border-green-200';
      case 'waiter': return 'bg-orange-100 text-orange-600 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getAvatarColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-600';
      case 'manager': return 'bg-blue-600';
      case 'cashier': return 'bg-green-600';
      case 'waiter': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const EmployeeCard = ({ employee, ...props }: { employee: any; [key: string]: any }) => (
    <motion.div
      layout
      {...props}
      className={`bg-[#E0E5EC] p-6 rounded-[32px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] flex flex-col items-center text-center relative ${!employee.isActive ? 'opacity-50' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-16 h-16 rounded-full ${getAvatarColor(employee.role)} flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg`}>
        {employee.name.charAt(0).toUpperCase()}
      </div>

      <h3 className="text-xl font-black text-gray-800 mb-1">{employee.name}</h3>
      
      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${getRoleColor(employee.role)}`}>
        {employee.role}
      </div>

      <p className="text-sm font-bold text-gray-400 mb-4">{employee.phone}</p>

      <div className="w-full space-y-1 mb-6">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-gray-400 uppercase tracking-wider">Salary</span>
          <span className="text-gray-700">PKR {employee.salary.toLocaleString()} / {employee.salaryType}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-gray-400 uppercase tracking-wider">Joined</span>
          <span className="text-gray-700">{new Date(employee.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${employee.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full mt-auto">
        <button
          onClick={() => setEditingEmployee(employee)}
          className="flex-1 p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-md hover:scale-[1.02] transition-all flex items-center justify-center"
        >
          <Edit2 size={18} strokeWidth={2.5} />
        </button>
        <button
          className="flex-1 p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-md hover:scale-[1.02] transition-all flex items-center justify-center"
        >
          <Calendar size={18} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to ${employee.isActive ? 'deactivate' : 'activate'} ${employee.name}?`)) {
              if (employee.isActive) deactivateEmployee(employee.id);
              else updateEmployee(employee.id, { isActive: true });
            }
          }}
          className={`flex-1 p-3 rounded-2xl shadow-md hover:scale-[1.02] transition-all flex items-center justify-center ${employee.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
        >
          <Power size={18} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            showInactive
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              : 'bg-[#E0E5EC] text-gray-500 shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff]'
          }`}
        >
          {showInactive ? 'Hide Inactive' : 'Show Inactive'}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {activeEmployees.map(emp => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
          {inactiveEmployees.map(emp => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </AnimatePresence>
      </div>

      {employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <User size={64} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest">No employees added yet</p>
        </div>
      )}

      {editingEmployee && (
        <AddEmployeeModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
        />
      )}
    </div>
  );
};

export default EmployeesTab;

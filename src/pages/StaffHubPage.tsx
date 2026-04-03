import React, { useState } from 'react';
import { Users, Calendar, Clock, BarChart, Settings, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PermissionGuard from '../components/ui/PermissionGuard';
import EmployeesTab from './staffhub/EmployeesTab';
import SchedulesTab from './staffhub/SchedulesTab';
import AttendanceTab from './staffhub/AttendanceTab';
import SummaryTab from './staffhub/SummaryTab';
import StaffSettingsTab from './staffhub/StaffSettingsTab';
import AddEmployeeModal from '../components/modals/AddEmployeeModal';

const StaffHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'schedules' | 'attendance' | 'summary' | 'settings'>('employees');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'summary', label: 'Summary', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'employees': return <EmployeesTab />;
      case 'schedules': return <SchedulesTab />;
      case 'attendance': return <AttendanceTab />;
      case 'summary': return <SummaryTab />;
      case 'settings': return <StaffSettingsTab />;
      default: return null;
    }
  };

  return (
    <PermissionGuard perm="editRoles">
      <div className="min-h-full bg-[#E0E5EC] p-6 flex flex-col gap-6 overflow-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 text-purple-600 mb-1">
              <Users size={28} strokeWidth={2.5} />
              <h1 className="text-3xl font-black uppercase tracking-tight">StaffHub Pro</h1>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all"
          >
            <Plus size={20} strokeWidth={3} />
            ADD EMPLOYEE
          </button>
        </div>

        {/* Tab Row */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-black uppercase tracking-wider text-sm ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-[#E0E5EC] text-gray-500 shadow-[6px_6px_12px_#babecc,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      </div>
    </PermissionGuard>
  );
};

export default StaffHubPage;

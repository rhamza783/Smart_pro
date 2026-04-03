import React, { useState, useEffect } from 'react';
import { X, User, Phone, Briefcase, DollarSign, Calendar, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStaffStore } from '../../store/staffStore';
import { useAuthStore } from '../../store/authStore';
import { Employee } from '../../types';
import { toast } from 'react-hot-toast';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const { addEmployee, updateEmployee } = useStaffStore();
  const { appWorkers } = useAuthStore();
  
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    role: 'Waiter',
    loginId: '',
    salary: 0,
    salaryType: 'monthly',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        loginId: employee.loginId,
        salary: employee.salary,
        salaryType: employee.salaryType,
        joiningDate: employee.joiningDate,
        address: employee.address || '',
        notes: employee.notes || '',
        isActive: employee.isActive,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        role: 'Waiter',
        loginId: '',
        salary: 0,
        salaryType: 'monthly',
        joiningDate: new Date().toISOString().split('T')[0],
        address: '',
        notes: '',
        isActive: true,
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required');
      return;
    }

    if (employee) {
      updateEmployee(employee.id, formData);
      toast.success('Employee updated successfully');
    } else {
      addEmployee(formData);
      toast.success('Employee added successfully');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#E0E5EC] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 flex justify-between items-center border-b border-gray-200/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                <User size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                {employee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
            </div>
            <button onClick={onClose} className="p-3 bg-white/50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all shadow-md">
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-8 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700 appearance-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Waiter">Waiter</option>
                  </select>
                </div>
              </div>

              {/* Login ID */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Login ID (Linked Worker)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.loginId}
                    onChange={e => setFormData({ ...formData, loginId: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700 appearance-none"
                  >
                    <option value="">None</option>
                    {appWorkers.map(w => (
                      <option key={w.login} value={w.login}>{w.name} ({w.login})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Salary Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Salary Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Salary Type</label>
                <div className="flex gap-2">
                  {['monthly', 'daily', 'hourly'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, salaryType: type as any })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.salaryType === type
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                          : 'bg-[#E0E5EC] text-gray-500 shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Joining Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Joining Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700 min-h-[80px]"
                  placeholder="Enter full address"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Notes</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] focus:outline-none font-bold text-gray-700 min-h-[80px]"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-purple-600 text-white rounded-[24px] font-black text-lg uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.01] transition-all"
            >
              {employee ? 'Update Employee' : 'Save Employee'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddEmployeeModal;

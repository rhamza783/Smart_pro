import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useStaffStore } from '../../store/staffStore';
import { 
  User, 
  Phone, 
  Shield, 
  AtSign, 
  Lock, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2, 
  Plus, 
  Save, 
  X 
} from 'lucide-react';
import { usePrompt } from '../../hooks/usePrompt';

const WorkersManagement: React.FC = () => {
  const { appWorkers, currentUser, addWorker, updateWorker, deleteWorker } = useAuthStore();
  const { showToast } = useToastStore();
  const { addEmployee } = useStaffStore();
  const { askConfirm } = usePrompt();
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Waiter',
    login: '',
    pass: '',
    confirmPass: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles = ['Admin', 'Manager', 'Cashier', 'Waiter'];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#6750A4';
      case 'Manager': return '#3182CE';
      case 'Cashier': return '#38a169';
      case 'Waiter': return '#DD6B20';
      default: return '#666';
    }
  };

  const handleEdit = (index: number) => {
    const worker = appWorkers[index];
    setEditingIndex(index);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      role: worker.role,
      login: worker.login,
      pass: worker.pass,
      confirmPass: worker.pass
    });
    setErrors({});
  };

  const handleDeleteClick = async (index: number) => {
    const worker = appWorkers[index];
    
    // Check if last admin
    const adminCount = appWorkers.filter(w => w.role === 'Admin').length;
    if (worker.role === 'Admin' && adminCount <= 1) {
      showToast('Cannot delete the last Admin user', 'error');
      return;
    }

    // Check if current user
    if (worker.login === currentUser?.login) {
      showToast('Cannot delete currently logged in user', 'error');
      return;
    }

    const confirmed = await askConfirm(
      'Delete Worker', 
      'Are you sure you want to remove this staff member? This action cannot be undone.'
    );
    
    if (confirmed) {
      deleteWorker(index);
      showToast('Worker deleted successfully', 'success');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.login) newErrors.login = 'Login ID is required';
    
    // Check unique login
    const duplicate = appWorkers.some((w, i) => w.login === formData.login && i !== editingIndex);
    if (duplicate) newErrors.login = 'Login ID already exists';

    if (editingIndex === null) {
      if (!formData.pass) newErrors.pass = 'Password is required';
      if (formData.pass !== formData.confirmPass) newErrors.confirmPass = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const workerData = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      login: formData.login,
      pass: formData.pass
    };

    if (editingIndex !== null) {
      updateWorker(editingIndex, workerData);
      showToast('Worker updated successfully', 'success');
    } else {
      addWorker(workerData);
      
      // Auto-create employee record in StaffHub
      addEmployee({
        name: workerData.name,
        phone: workerData.phone,
        role: workerData.role,
        loginId: workerData.login,
        salary: 0,
        salaryType: 'monthly',
        joiningDate: new Date().toISOString().split('T')[0],
        address: '',
        notes: 'Auto-created from Workers Management',
        isActive: true
      });

      showToast('Worker created successfully', 'success');
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingIndex(null);
    setFormData({
      name: '',
      phone: '',
      role: 'Waiter',
      login: '',
      pass: '',
      confirmPass: ''
    });
    setErrors({});
  };

  const existingNames = useMemo(() => Array.from(new Set(appWorkers.map(w => w.name))), [appWorkers]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Column: Staff List */}
      <div className="flex-[1.2] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-gray-700 uppercase tracking-tight">Current Staff</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest">
              {appWorkers.length} workers
            </span>
          </div>
        </div>

        <div className="bg-[#E0E5EC] rounded-[32px] shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Name</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Role</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Login ID</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appWorkers.map((worker, index) => (
                  <tr 
                    key={worker.login} 
                    className="group hover:bg-white/20 transition-colors border-b border-gray-100/50 last:border-0"
                  >
                    <td className="p-5">
                      <span className="text-sm font-bold text-gray-700">{worker.name}</span>
                    </td>
                    <td className="p-5">
                      <span 
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ backgroundColor: getRoleColor(worker.role) }}
                      >
                        {worker.role}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="text-xs font-mono text-gray-500">{worker.login}</span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(index)}
                          className="p-2 bg-[#E0E5EC] rounded-xl shadow-[2px_2px_5px_#babecc,-2px_-2px_5px_#ffffff] text-purple-600 hover:shadow-inner transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(index)}
                          className="p-2 bg-[#E0E5EC] rounded-xl shadow-[2px_2px_5px_#babecc,-2px_-2px_5px_#ffffff] text-red-500 hover:shadow-inner transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Add/Edit Form */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-700 uppercase tracking-tight">
            {editingIndex !== null ? 'Edit Worker' : 'Add New Worker'}
          </h2>
        </div>

        <div className="bg-[#E0E5EC] rounded-[32px] p-8 shadow-[inset_8px_8px_16px_#babecc,inset_-8px_-8px_16px_#ffffff] flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  list="worker-names"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className={`w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-bold text-gray-700 ${errors.name ? 'ring-1 ring-red-500' : ''}`}
                />
                <datalist id="worker-names">
                  {existingNames.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Phone Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 234 567 890"
                  className="w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-bold text-gray-700"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">System Role</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Shield size={18} />
                </div>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-10 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-bold text-gray-700 appearance-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRoleColor(formData.role) }}
                  />
                </div>
              </div>
            </div>

            {/* Login ID */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Login ID (Unique)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <AtSign size={18} />
                </div>
                <input
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="e.g. john_d"
                  className={`w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-mono font-bold text-gray-700 ${errors.login ? 'ring-1 ring-red-500' : ''}`}
                />
              </div>
              {errors.login && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">{errors.login}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">
                {editingIndex !== null ? 'New Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.pass}
                  onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-12 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-bold text-gray-700 ${errors.pass ? 'ring-1 ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.pass && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">{errors.pass}</p>}
            </div>

            {/* Confirm Password (only for new) */}
            {editingIndex === null && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPass}
                    onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full bg-[#E0E5EC] rounded-2xl py-4 pl-12 pr-4 shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff] outline-none text-sm font-bold text-gray-700 ${errors.confirmPass ? 'ring-1 ring-red-500' : ''}`}
                  />
                </div>
                {errors.confirmPass && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">{errors.confirmPass}</p>}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {editingIndex !== null ? (
                <>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:bg-purple-700 transition-all active:shadow-inner uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 bg-[#E0E5EC] text-gray-600 font-black py-4 rounded-2xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:text-red-500 transition-all active:shadow-inner uppercase tracking-widest text-sm"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:bg-purple-700 transition-all active:shadow-inner uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Create Worker
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default WorkersManagement;

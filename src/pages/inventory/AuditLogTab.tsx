import React, { useState, useMemo } from 'react';
import { Search, Calendar, Download, User, Activity, FileText } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';

const AuditLogTab: React.FC = () => {
  const { auditLog } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const filteredLogs = useMemo(() => {
    return auditLog
      .filter(log => {
        const matchesSearch = 
          log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = actionFilter === 'All' || log.action === actionFilter;
        
        return matchesSearch && matchesAction;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [auditLog, searchTerm, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ADD': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'APPROVE': return 'bg-orange-100 text-orange-700';
      case 'REJECT': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.userId,
        log.action,
        log.entity,
        log.entityId,
        `"${log.details.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_audit_log_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4 flex-1 w-full lg:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text"
              placeholder="Search logs (user, details, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-xs border-none"
            />
          </div>
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-6 py-3 rounded-2xl bg-background shadow-neumorphic outline-none text-xs font-bold text-primary border-none"
          >
            <option value="All">All Actions</option>
            <option value="ADD">ADD</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
          </select>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-background shadow-neumorphic text-primary font-black text-xs uppercase tracking-widest hover:shadow-neumorphic-inset transition-all"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-background rounded-[32px] p-6 shadow-neumorphic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
                <th className="pb-4 px-4">Timestamp</th>
                <th className="pb-4 px-4">User</th>
                <th className="pb-4 px-4 text-center">Action</th>
                <th className="pb-4 px-4 text-center">Entity</th>
                <th className="pb-4 px-4">Entity ID</th>
                <th className="pb-4 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-primary/5 transition-all">
                    <td className="py-4 px-4 text-[10px] font-bold text-text-secondary uppercase">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                          <User size={12} />
                        </div>
                        <span className="text-xs font-black text-primary">{log.userId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-[9px] font-black uppercase">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-text-primary">
                      {log.entityId}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-text-secondary italic">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-text-secondary font-bold">
                    <div className="flex flex-col items-center gap-4">
                      <FileText size={48} className="text-primary/20" />
                      <p className="text-sm font-black uppercase tracking-widest">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTab;

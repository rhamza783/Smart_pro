import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '../../utils/reportUtils';

interface ReportTableProps {
  columns: string[];
  rows: Record<string, any>[];
  onExport: () => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ columns, rows, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredRows = useMemo(() => {
    let result = rows.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const isNumber = (val: any) => typeof val === 'number';
  const isPercentage = (col: string) => col.includes('%');
  const isCurrency = (col: string) => col.includes('Revenue') || col.includes('Amount') || col.includes('Total') || col.includes('Price') || col.includes('Discount') || col.includes('Udhaar') || col.includes('Recovered') || col.includes('Outstanding') || col.includes('Paid') || col.includes('Ordered') || col.includes('Balance');

  return (
    <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text"
            placeholder="Search report..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background shadow-neumorphic-inset text-sm font-medium focus:outline-none"
          />
        </div>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-background shadow-neumorphic text-primary font-bold hover:shadow-neumorphic-inset transition-all"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-gray-300/30">
              {columns.map(col => (
                <th 
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`pb-4 px-4 cursor-pointer hover:text-primary transition-colors ${isNumber(rows[0]?.[col]) ? 'text-right' : ''}`}
                >
                  <div className={`flex items-center gap-2 ${isNumber(rows[0]?.[col]) ? 'justify-end' : ''}`}>
                    <span>{col}</span>
                    <ArrowUpDown size={12} className="opacity-30" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300/30">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="group hover:bg-primary/5 transition-all">
                {columns.map(col => {
                  const val = row[col];
                  return (
                    <td 
                      key={col} 
                      className={`py-4 px-4 text-sm font-bold ${isNumber(val) ? 'text-right text-primary' : 'text-text-primary'}`}
                    >
                      {isPercentage(col) ? (
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-[10px] text-text-secondary">{Number(val).toFixed(1)}%</span>
                        </div>
                      ) : isCurrency(col) && isNumber(val) ? (
                        formatCurrency(val)
                      ) : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-300/30">
          <p className="text-xs font-bold text-text-secondary">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-background shadow-neumorphic disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                    currentPage === i + 1 ? 'bg-primary text-white shadow-lg' : 'bg-background shadow-neumorphic text-text-secondary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-background shadow-neumorphic disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;

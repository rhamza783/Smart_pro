import React, { useState } from 'react';
import { 
  BarChart2, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Printer, 
  Download, 
  Search,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  CreditCard,
  Tag,
  Package,
  Clock,
  Layout,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReport } from '../hooks/useReport';
import { formatCurrency, exportReportCSV } from '../utils/reportUtils';
import ReportTable from '../components/reports/ReportTable';
import ReportChart from '../components/reports/ReportChart';
import PermissionGuard from '../components/ui/PermissionGuard';

const reportGroups = [
  {
    id: 'core',
    name: '📊 Core Sales',
    reports: [
      'Sale by Menu Items',
      'Sale by Waitress',
      'Sale by Table',
      'Sale by Category',
      'Sale by Payment Method',
      'Sale by Day',
      'Sale by Hour',
      'Sale by Week',
      'Sale by Month',
      'Sale by Order Type',
      'Today\'s Sale by User'
    ]
  },
  {
    id: 'udhaar',
    name: '💰 Client Udhaar (Credit)',
    reports: [
      'Total Food on Credit',
      'Total Credit Recovered',
      'Clients with Outstanding Credit',
      'Top 10 Clients by Udhaar',
      'Longest Standing Udhaar Clients'
    ]
  },
  {
    id: 'deals',
    name: '🏷️ Deals Discounts & Tax',
    reports: [
      'Sale by Deal',
      'Sale by Discount',
      'Sale by Tax'
    ]
  },
  {
    id: 'loyalty',
    name: '🌟 Loyalty & Vouchers',
    reports: [
      'Loyalty Points Summary',
      'Voucher Usage Report'
    ]
  }
];

const ReportsPage: React.FC = () => {
  const { 
    activeReport, 
    setActiveReport, 
    dateFrom, 
    setDateFrom, 
    dateTo, 
    setDateTo, 
    reportData, 
    isLoading, 
    generateReport 
  } = useReport();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(['core', 'udhaar', 'deals', 'loyalty']);
  const [dateFilterType, setDateFilterType] = useState<'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Custom'>('Today');

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleDateFilter = (type: typeof dateFilterType) => {
    setDateFilterType(type);
    const now = new Date();
    let from = new Date(now.setHours(0, 0, 0, 0));
    let to = new Date(now.setHours(23, 59, 59, 999));

    if (type === 'Yesterday') {
      from = new Date(new Date().setDate(new Date().getDate() - 1));
      from.setHours(0, 0, 0, 0);
      to = new Date(new Date().setDate(new Date().getDate() - 1));
      to.setHours(23, 59, 59, 999);
    } else if (type === 'This Week') {
      from = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
      from.setHours(0, 0, 0, 0);
    } else if (type === 'This Month') {
      from = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      from.setHours(0, 0, 0, 0);
    }

    setDateFrom(from);
    setDateTo(to);
  };

  const isUdhaarReport = activeReport.includes('Udhaar') || activeReport.includes('Credit');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full bg-[#E0E5EC] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-[280px] bg-background shadow-neumorphic z-10 flex flex-col print:hidden">
        <div className="p-6 border-b border-gray-300/30">
          <div className="flex items-center gap-3 text-primary">
            <BarChart2 size={24} className="font-black" />
            <h1 className="text-xl font-black uppercase tracking-tight">Reports Suite</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {reportGroups.map(group => (
            <div key={group.id} className="space-y-2">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-text-secondary uppercase tracking-widest hover:text-primary transition-colors"
              >
                <span>{group.name}</span>
                {expandedGroups.includes(group.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedGroups.includes(group.id) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-1"
                  >
                    {group.reports.map(report => (
                      <button
                        key={report}
                        onClick={() => setActiveReport(report)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-l-4 ${
                          activeReport === report 
                            ? 'bg-[#EADDFF] text-primary border-primary shadow-neumorphic-inset' 
                            : 'text-text-secondary border-transparent hover:bg-primary/5'
                        }`}
                      >
                        {report}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Date Filter Bar */}
        {!isUdhaarReport && (
          <div className="bg-background p-6 shadow-neumorphic z-10 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl shadow-neumorphic-inset">
              {['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleDateFilter(type as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dateFilterType === type ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {dateFilterType === 'Custom' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                    <input 
                      type="date" 
                      value={dateFrom.toISOString().split('T')[0]}
                      onChange={(e) => setDateFrom(new Date(e.target.value))}
                      className="pl-10 pr-4 py-2 rounded-xl bg-background shadow-neumorphic-inset text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <span className="text-text-secondary font-bold">to</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                    <input 
                      type="date" 
                      value={dateTo.toISOString().split('T')[0]}
                      onChange={(e) => setDateTo(new Date(e.target.value))}
                      className="pl-10 pr-4 py-2 rounded-xl bg-background shadow-neumorphic-inset text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <button 
                onClick={generateReport}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <BarChart2 size={18} />}
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Report Display Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar print:p-0 print:overflow-visible">
          {/* Report Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-primary uppercase tracking-tight">{activeReport}</h2>
              <p className="text-sm font-bold text-text-secondary italic">
                {isUdhaarReport ? 'Live data from client ledger' : `Data from ${dateFrom.toLocaleDateString()} to ${dateTo.toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex gap-4 print:hidden">
              <button 
                onClick={handlePrint}
                className="p-3 rounded-2xl bg-background shadow-neumorphic text-text-secondary hover:text-primary transition-all"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic border-l-4 border-purple-500">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic border-l-4 border-blue-500">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-2xl font-black text-primary">{reportData.summary.totalOrders}</p>
                </div>
                <div className="bg-background rounded-3xl p-6 shadow-neumorphic border-l-4 border-green-500">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                    {reportData.summary.topItem ? 'Top Performer' : 'Avg Order Value'}
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {reportData.summary.topItem || formatCurrency(reportData.summary.avgOrder)}
                  </p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="print:break-inside-avoid">
                <ReportChart 
                  data={reportData.chartData} 
                  chartType={reportData.chartType} 
                  xKey={reportData.xKey} 
                  yKey={reportData.yKey} 
                />
              </div>

              {/* Table Section */}
              <div className="print:break-inside-avoid">
                <ReportTable 
                  columns={reportData.columns} 
                  rows={reportData.rows} 
                  onExport={() => exportReportCSV(reportData)} 
                />
              </div>
            </>
          )}

          {!reportData && !isLoading && (
            <div className="h-[400px] flex flex-col items-center justify-center text-text-secondary gap-4 bg-background rounded-[32px] shadow-neumorphic-inset">
              <BarChart2 size={64} className="opacity-10" />
              <p className="font-bold">Click "Generate Report" to view data</p>
            </div>
          )}

          {isLoading && (
            <div className="h-[400px] flex flex-col items-center justify-center text-primary gap-4 bg-background rounded-[32px] shadow-neumorphic-inset">
              <RefreshCw size={64} className="animate-spin opacity-20" />
              <p className="font-bold animate-pulse">Computing report data...</p>
            </div>
          )}
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          main { overflow: visible !important; height: auto !important; }
          .shadow-neumorphic, .shadow-neumorphic-inset { box-shadow: none !important; border: 1px solid #eee !important; }
          .bg-background { background: white !important; }
          .bg-\\[\\#E0E5EC\\] { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;

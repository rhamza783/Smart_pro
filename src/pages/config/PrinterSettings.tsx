import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, 
  Plus, 
  Wifi, 
  Usb, 
  Bluetooth, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Play, 
  Star, 
  Copy,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePrinterStore } from '../../store/printerStore';
import { useSettingsStore } from '../../store/settingsStore';
import { PrinterConfig, PrintJob } from '../../types';
import AddPrinterModal from '../../components/modals/AddPrinterModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PrinterSettings: React.FC = () => {
  const { 
    printers, 
    printJobs, 
    deletePrinter, 
    updatePrinter, 
    testPrint, 
    clearHistory,
    updateJobStatus
  } = usePrinterStore();
  const { propertySettings } = useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);

  // Auto-refresh simulation for active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      const activeJobs = printJobs.filter(j => j.status === 'printing');
      if (activeJobs.length > 0) {
        activeJobs.forEach(job => {
          // Simulate completion after 3 seconds
          if (Date.now() - job.createdAt > 3000) {
            updateJobStatus(job.id, 'done');
          }
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [printJobs, updateJobStatus]);

  const getPrinterIcon = (printer: PrinterConfig) => {
    if (printer.connectionType === 'browser') return <Globe size={20} />;
    if (printer.connectionType === 'network') return <Wifi size={20} />;
    if (printer.connectionType === 'usb') return <Usb size={20} />;
    if (printer.connectionType === 'bluetooth') return <Bluetooth size={20} />;
    return <Printer size={20} />;
  };

  const getStatusColor = (printer: PrinterConfig) => {
    if (!printer.isActive) return 'bg-red-500';
    if (printer.connectionType === 'browser') return 'bg-gray-400';
    return 'bg-green-500';
  };

  const getDestinationBadge = (dest: PrinterConfig['destination']) => {
    switch (dest) {
      case 'bill': return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase">Bill</span>;
      case 'kot': return <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase">KOT</span>;
      case 'advance': return <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase">Advance</span>;
      case 'report': return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Report</span>;
    }
  };

  const handleRetry = (job: PrintJob) => {
    const printer = printers.find(p => p.id === job.printerId);
    if (printer) {
      testPrint(printer);
      toast.info('Retrying print job...');
    } else {
      toast.error('Printer not found');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Printer Management Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Configured Printers</h2>
            <p className="text-sm text-text-secondary">Manage your thermal and network printers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white shadow-neumorphic hover:shadow-neumorphic-inset font-black uppercase tracking-widest transition-all"
          >
            <Plus size={20} />
            Add Printer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <motion.div
              key={printer.id}
              layout
              className="bg-background rounded-2xl p-6 shadow-neumorphic flex flex-col gap-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-background shadow-neumorphic relative`}>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(printer)}`} />
                    <div className="text-primary">
                      {getPrinterIcon(printer)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-lg">{printer.name}</h3>
                    <div className="text-[10px] text-text-secondary font-bold uppercase flex items-center gap-2">
                      {printer.connectionType === 'browser' ? 'Browser Print' : 
                       printer.connectionType === 'network' ? `Network: ${printer.ipAddress}:${printer.port}` :
                       printer.connectionType.toUpperCase()}
                      <span className="px-1.5 py-0.5 rounded bg-background shadow-neumorphic-inset text-[8px]">
                        {printer.paperWidth}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    {getDestinationBadge(printer.destination)}
                  </div>
                  {printer.isDefault && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-black uppercase">
                      <Star size={10} fill="currentColor" /> Default
                    </span>
                  )}
                  {printer.copies > 1 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background shadow-neumorphic-inset text-text-secondary text-[10px] font-black uppercase">
                      <Copy size={10} /> {printer.copies}x copies
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => testPrint(printer)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-yellow-500 transition-all"
                >
                  <Play size={16} />
                  <span className="text-[10px] font-black uppercase">Test</span>
                </button>
                <button
                  onClick={() => setEditingPrinter(printer)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-purple-500 transition-all"
                >
                  <Edit3 size={16} />
                  <span className="text-[10px] font-black uppercase">Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this printer?')) deletePrinter(printer.id);
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                  <span className="text-[10px] font-black uppercase">Delete</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold uppercase text-text-secondary">
                  {printer.isActive ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={() => updatePrinter(printer.id, { isActive: !printer.isActive })}
                  className={`w-10 h-5 rounded-full transition-all relative ${
                    printer.isActive ? 'bg-primary' : 'bg-background shadow-neumorphic-inset'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
                    printer.isActive ? 'left-5.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Print Job History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Recent Print Jobs</h2>
            <p className="text-sm text-text-secondary">Monitor your printing activity</p>
          </div>
          <button
            onClick={clearHistory}
            className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Clear History
          </button>
        </div>

        <div className="bg-background rounded-2xl shadow-neumorphic overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background shadow-neumorphic-inset">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Time</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Order ID</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Printer</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Copies</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {printJobs.slice(0, 20).map((job) => (
                  <tr key={job.id} className="hover:bg-background-dark/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Clock size={12} className="text-text-secondary" />
                        {format(job.createdAt, 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-background shadow-neumorphic-inset">
                        {job.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-black text-primary">#{job.orderId}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-bold text-text-secondary">
                        {printers.find(p => p.id === job.printerId)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs font-bold">{job.copies}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {job.status === 'done' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase">
                            <CheckCircle2 size={12} /> Done
                          </span>
                        )}
                        {job.status === 'printing' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <RotateCcw size={12} />
                            </motion.div>
                            Printing
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRetry(job)}
                              className="p-1.5 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-primary transition-all"
                              title="Retry"
                            >
                              <RotateCcw size={12} />
                            </button>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black uppercase group relative">
                              <XCircle size={12} /> Failed
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-background shadow-2xl text-[10px] font-bold text-red-500 hidden group-hover:block z-10 border border-red-500/20">
                                <AlertTriangle size={10} className="inline mr-1" />
                                {job.errorMessage || 'Unknown error'}
                              </div>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {printJobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary italic text-sm">
                      No print history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {(showAddModal || editingPrinter) && (
          <AddPrinterModal
            printer={editingPrinter || undefined}
            onClose={() => {
              setShowAddModal(false);
              setEditingPrinter(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrinterSettings;

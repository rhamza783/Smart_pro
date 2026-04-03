import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Wifi, Bluetooth, Usb, Check, AlertCircle, Plus, Minus } from 'lucide-react';
import { PrinterConfig } from '../../types';
import { usePrinterStore } from '../../store/printerStore';
import { toast } from 'sonner';

interface AddPrinterModalProps {
  printer?: PrinterConfig;
  onClose: () => void;
}

const AddPrinterModal: React.FC<AddPrinterModalProps> = ({ printer, onClose }) => {
  const { addPrinter, updatePrinter } = usePrinterStore();
  const [formData, setFormData] = useState<Omit<PrinterConfig, 'id'>>({
    name: '',
    type: 'browser',
    destination: 'bill',
    paperWidth: '80mm',
    isDefault: false,
    isActive: true,
    connectionType: 'browser',
    copies: 1,
    autocut: false,
    beepOnPrint: false,
    encoding: 'UTF-8',
    ipAddress: '',
    port: 9100
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (printer) {
      const { id, ...rest } = printer;
      setFormData(rest);
    }
  }, [printer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Printer name is required');
      return;
    }

    if (printer) {
      updatePrinter(printer.id, formData);
      toast.success('Printer updated successfully');
    } else {
      addPrinter(formData);
      toast.success('Printer added successfully');
    }
    onClose();
  };

  const handleTestConnection = async () => {
    if (formData.connectionType !== 'network' || !formData.ipAddress) return;
    
    setTestStatus('testing');
    // Mock connection test
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for mock
      setTestStatus(success ? 'success' : 'failed');
      if (success) toast.success('Connection successful!');
      else toast.error('Printer unreachable');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-background shadow-neumorphic-inset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Printer size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {printer ? 'Edit Printer' : 'Add Printer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-dark rounded-full transition-colors shadow-neumorphic active:shadow-neumorphic-inset"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
                  Printer Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Counter Thermal"
                  className="w-full px-4 py-3 rounded-xl bg-background shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
                  Printer Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value as PrinterConfig['type'];
                    setFormData({ 
                      ...formData, 
                      type,
                      connectionType: type === 'browser' ? 'browser' : formData.connectionType === 'browser' ? 'usb' : formData.connectionType
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-background shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  <option value="browser">Browser Print</option>
                  <option value="thermal">Thermal Printer</option>
                  <option value="inkjet">Inkjet Printer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
                  Destination
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value as PrinterConfig['destination'] })}
                  className="w-full px-4 py-3 rounded-xl bg-background shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  <option value="bill">Bill Printer</option>
                  <option value="kot">KOT Printer</option>
                  <option value="advance">Advance Receipt Printer</option>
                  <option value="report">Report Printer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
                  Connection Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'browser', label: 'Browser', icon: Printer, disabled: formData.type !== 'browser' },
                    { id: 'usb', label: 'USB', icon: Usb, disabled: formData.type === 'browser' },
                    { id: 'network', label: 'Network', icon: Wifi, disabled: formData.type === 'browser' },
                    { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth, disabled: formData.type === 'browser' }
                  ].map((conn) => (
                    <button
                      key={conn.id}
                      type="button"
                      disabled={conn.disabled}
                      onClick={() => setFormData({ ...formData, connectionType: conn.id as any })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        formData.connectionType === conn.id
                          ? 'bg-primary text-white shadow-neumorphic'
                          : 'bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      <conn.icon size={16} />
                      {conn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
                  Paper Width
                </label>
                <div className="flex gap-2 p-1 rounded-xl bg-background shadow-neumorphic-inset">
                  {['58mm', '80mm', '112mm'].map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => setFormData({ ...formData, paperWidth: width as any })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        formData.paperWidth === width
                          ? 'bg-primary text-white shadow-neumorphic'
                          : 'hover:bg-background-dark text-text-secondary'
                      }`}
                    >
                      {width}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-background shadow-neumorphic">
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight">Set as Default</div>
                  <div className="text-[10px] text-text-secondary">Primary printer for {formData.destination}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData.isDefault ? 'bg-primary' : 'bg-background shadow-neumorphic-inset'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
                    formData.isDefault ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-background shadow-neumorphic">
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight">Copies</div>
                  <div className="text-[10px] text-text-secondary">Number of prints per job</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, copies: Math.max(1, formData.copies - 1) })}
                    className="p-1 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-black">{formData.copies}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, copies: Math.min(5, formData.copies + 1) })}
                    className="p-1 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic">
                  <span className="text-xs font-bold uppercase">Auto-cut</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, autocut: !formData.autocut })}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      formData.autocut ? 'bg-primary' : 'bg-background shadow-neumorphic-inset'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
                      formData.autocut ? 'left-5.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic">
                  <span className="text-xs font-bold uppercase">Beep</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, beepOnPrint: !formData.beepOnPrint })}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      formData.beepOnPrint ? 'bg-primary' : 'bg-background shadow-neumorphic-inset'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
                      formData.beepOnPrint ? 'left-5.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Network Settings */}
          <AnimatePresence>
            {formData.connectionType === 'network' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 rounded-2xl bg-background shadow-neumorphic space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi size={18} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-tight">Network Configuration</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 ml-1">
                        IP Address
                      </label>
                      <input
                        type="text"
                        value={formData.ipAddress}
                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                        placeholder="192.168.1.100"
                        className="w-full px-4 py-2 rounded-xl bg-background shadow-neumorphic-inset focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 ml-1">
                        Port
                      </label>
                      <input
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                        placeholder="9100"
                        className="w-full px-4 py-2 rounded-xl bg-background shadow-neumorphic-inset focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 rounded-lg bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-xs font-bold uppercase tracking-wider text-primary transition-all flex items-center gap-2"
                    >
                      {testStatus === 'testing' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Printer size={14} />
                        </motion.div>
                      ) : (
                        <Wifi size={14} />
                      )}
                      Test Connection
                    </button>
                    <div className="flex items-center gap-2">
                      {testStatus === 'success' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                          <Check size={12} /> Connected
                        </span>
                      )}
                      {testStatus === 'failed' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                          <AlertCircle size={12} /> Unreachable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 ml-1">
              Character Encoding
            </label>
            <div className="flex gap-4">
              {['UTF-8', 'Windows-1252'].map((enc) => (
                <label key={enc} className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    onClick={() => setFormData({ ...formData, encoding: enc as any })}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      formData.encoding === enc ? 'bg-primary shadow-neumorphic' : 'bg-background shadow-neumorphic-inset'
                    }`}
                  >
                    {formData.encoding === enc && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">{enc}</span>
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-border bg-background shadow-neumorphic-inset flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-background shadow-neumorphic hover:shadow-neumorphic-inset text-text-secondary font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-primary text-white shadow-neumorphic hover:shadow-neumorphic-inset font-black uppercase tracking-widest transition-all"
          >
            Save Printer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddPrinterModal;

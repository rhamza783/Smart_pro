import React from 'react';
import { PrinterConfig } from '../../types';
import { Printer, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrinterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (printer: PrinterConfig) => void;
  printers: PrinterConfig[];
  jobType: string;
}

const PrinterSelectionModal: React.FC<PrinterSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  printers,
  jobType
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#E0E5EC] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-gray-700 uppercase tracking-tighter">Select Printer</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Job Type: {jobType}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:text-red-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {printers.length === 0 ? (
              <div className="text-center py-8">
                <Printer size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-bold">No active printers found for this destination.</p>
              </div>
            ) : (
              printers.map((printer) => (
                <button
                  key={printer.id}
                  onClick={() => onSelect(printer)}
                  className="w-full group p-4 bg-[#E0E5EC] rounded-2xl shadow-neumorphic hover:shadow-neumorphic-inset transition-all flex items-center gap-4 text-left"
                >
                  <div className={`p-3 rounded-xl shadow-neumorphic ${printer.type === 'browser' ? 'text-blue-600' : 'text-primary'}`}>
                    <Printer size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-gray-700 uppercase text-sm">{printer.name}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {printer.type} • {printer.paperWidth} • {printer.connectionType}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={20} className="text-green-600" />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-6 bg-background-dark/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PrinterSelectionModal;

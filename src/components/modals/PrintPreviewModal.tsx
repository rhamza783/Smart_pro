import React from 'react';
import { X, Printer } from 'lucide-react';

interface PrintPreviewModalProps {
  html: string;
  onPrint: () => void;
  onClose: () => void;
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ html, onPrint, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-[450px] h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-gray-300/30 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-2">
            <Printer size={20} className="text-primary" />
            <h3 className="font-bold text-lg text-primary">Print Preview</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex justify-center">
          <div 
            className="bg-white shadow-xl p-4 origin-top transform scale-90 sm:scale-100"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        
        <div className="p-4 border-t border-gray-300/30 bg-white/50 grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="py-3 rounded-xl font-bold text-text-secondary shadow-neumorphic active:shadow-neumorphic-inset transition-all"
          >
            Close
          </button>
          <button 
            onClick={onPrint}
            className="py-3 rounded-xl font-bold text-white bg-primary shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;

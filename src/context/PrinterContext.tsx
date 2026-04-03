import React, { createContext, useContext, useState, useCallback } from 'react';
import { PrinterConfig, HistoryOrder, Order, BillConfig, KOTConfig, PropertySettings, SplitPortion } from '../types';
import { usePrinterStore } from '../store/printerStore';
import { useSettingsStore } from '../store/settingsStore';
import PrinterSelectionModal from '../components/modals/PrinterSelectionModal';
import * as printUtils from '../utils/printUtils';
import { toast } from 'sonner';

interface PrinterContextType {
  printBill: (order: HistoryOrder) => Promise<void>;
  printKOT: (order: Order | HistoryOrder, isReprint?: boolean) => Promise<void>;
  printAdvanceReceipt: (advance: any) => Promise<void>;
  printRefundReceipt: (advance: any) => Promise<void>;
  printSplitBillPortion: (order: Order, portion: SplitPortion, index: number, total: number) => Promise<void>;
  printSplitBillSummary: (order: Order, splits: SplitPortion[]) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getDefaultPrinter, getPrintersByDestination, addPrintJob } = usePrinterStore();
  const { billConfig, kotConfig, propertySettings } = useSettingsStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<{
    type: 'bill' | 'kot' | 'advance' | 'report';
    data: any;
    execute: (printer: PrinterConfig) => void;
  } | null>(null);

  const startPrint = useCallback((type: 'bill' | 'kot' | 'advance' | 'report', data: any, execute: (printer: PrinterConfig) => void) => {
    const defaultPrinter = getDefaultPrinter(type);
    
    if (defaultPrinter && defaultPrinter.isActive) {
      execute(defaultPrinter);
      addPrintJob({
        printerId: defaultPrinter.id,
        type: type === 'bill' ? 'bill' : type === 'kot' ? 'kot' : 'advance',
        orderId: data.id || 'N/A',
        status: 'done',
        copies: defaultPrinter.copies || 1
      });
    } else {
      const availablePrinters = getPrintersByDestination(type).filter(p => p.isActive);
      if (availablePrinters.length === 1) {
        execute(availablePrinters[0]);
        addPrintJob({
          printerId: availablePrinters[0].id,
          type: type === 'bill' ? 'bill' : type === 'kot' ? 'kot' : 'advance',
          orderId: data.id || 'N/A',
          status: 'done',
          copies: availablePrinters[0].copies || 1
        });
      } else {
        setPendingJob({ type, data, execute });
        setModalOpen(true);
      }
    }
  }, [getDefaultPrinter, getPrintersByDestination, addPrintJob]);

  const handleSelectPrinter = (printer: PrinterConfig) => {
    if (pendingJob) {
      pendingJob.execute(printer);
      addPrintJob({
        printerId: printer.id,
        type: pendingJob.type === 'bill' ? 'bill' : pendingJob.type === 'kot' ? 'kot' : 'advance',
        orderId: pendingJob.data.id || 'N/A',
        status: 'done',
        copies: printer.copies || 1
      });
      setModalOpen(false);
      setPendingJob(null);
    }
  };

  const value = {
    printBill: async (order: HistoryOrder) => {
      startPrint('bill', order, (printer) => printUtils.printBill(order, billConfig, propertySettings, printer));
    },
    printKOT: async (order: Order | HistoryOrder, isReprint = false) => {
      startPrint('kot', order, (printer) => printUtils.printKOT(order, kotConfig, propertySettings, printer, isReprint));
    },
    printAdvanceReceipt: async (advance: any) => {
      startPrint('advance', advance, (printer) => printUtils.printAdvanceReceipt(advance, propertySettings, printer));
    },
    printRefundReceipt: async (advance: any) => {
      startPrint('advance', advance, (printer) => printUtils.printRefundReceipt(advance, propertySettings, printer));
    },
    printSplitBillPortion: async (order: Order, portion: SplitPortion, index: number, total: number) => {
      startPrint('bill', order, (printer) => printUtils.printSplitBillPortion(order, portion, index, total, billConfig, propertySettings, printer));
    },
    printSplitBillSummary: async (order: Order, splits: SplitPortion[]) => {
      startPrint('bill', order, (printer) => printUtils.printSplitBillSummary(order, splits, billConfig, propertySettings, printer));
    }
  };

  return (
    <PrinterContext.Provider value={value}>
      {children}
      <PrinterSelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectPrinter}
        printers={pendingJob ? getPrintersByDestination(pendingJob.type).filter(p => p.isActive) : []}
        jobType={pendingJob?.type || ''}
      />
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};

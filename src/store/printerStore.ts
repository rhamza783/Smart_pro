import { create } from 'zustand';
import { PrinterConfig, PrintJob } from '../types';
import { toast } from 'sonner';

interface PrinterState {
  printers: PrinterConfig[];
  printJobs: PrintJob[];
  activeJobs: PrintJob[];
  addPrinter: (printer: Omit<PrinterConfig, 'id'>) => PrinterConfig;
  updatePrinter: (id: string, updates: Partial<PrinterConfig>) => void;
  deletePrinter: (id: string) => void;
  setDefaultPrinter: (id: string, destination: PrinterConfig['destination']) => void;
  getDefaultPrinter: (destination: PrinterConfig['destination']) => PrinterConfig | null;
  getPrintersByDestination: (destination: PrinterConfig['destination']) => PrinterConfig[];
  addPrintJob: (job: Omit<PrintJob, 'id' | 'createdAt'>) => PrintJob;
  updateJobStatus: (id: string, status: PrintJob['status'], error?: string) => void;
  getPrintHistory: () => PrintJob[];
  clearHistory: () => void;
  testPrint: (printer: PrinterConfig) => void;
  savePrinters: () => void;
}

const STORAGE_KEY_PRINTERS = 'pos_printers';
const STORAGE_KEY_JOBS = 'pos_print_jobs';

const DEFAULT_BROWSER_PRINTER: Omit<PrinterConfig, 'id'> = {
  name: 'Default Browser Print',
  type: 'browser',
  destination: 'bill',
  paperWidth: '80mm',
  isDefault: true,
  isActive: true,
  connectionType: 'browser',
  copies: 1,
  autocut: false,
  beepOnPrint: false,
  encoding: 'UTF-8'
};

export const usePrinterStore = create<PrinterState>((set, get) => {
  // Load initial state
  const savedPrinters = localStorage.getItem(STORAGE_KEY_PRINTERS);
  let initialPrinters: PrinterConfig[] = savedPrinters ? JSON.parse(savedPrinters) : [];
  
  if (initialPrinters.length === 0) {
    const defaultPrinter = { ...DEFAULT_BROWSER_PRINTER, id: 'default-browser' } as PrinterConfig;
    initialPrinters = [defaultPrinter];
    localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(initialPrinters));
  }

  const savedJobs = localStorage.getItem(STORAGE_KEY_JOBS);
  const initialJobs: PrintJob[] = savedJobs ? JSON.parse(savedJobs) : [];

  return {
    printers: initialPrinters,
    printJobs: initialJobs,
    activeJobs: [],

    addPrinter: (printerData) => {
      const newPrinter: PrinterConfig = {
        ...printerData,
        id: crypto.randomUUID(),
      };
      
      set((state) => {
        const updatedPrinters = [...state.printers, newPrinter];
        localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updatedPrinters));
        return { printers: updatedPrinters };
      });
      
      return newPrinter;
    },

    updatePrinter: (id, updates) => {
      set((state) => {
        const updatedPrinters = state.printers.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updatedPrinters));
        return { printers: updatedPrinters };
      });
    },

    deletePrinter: (id) => {
      set((state) => {
        const updatedPrinters = state.printers.filter((p) => p.id !== id);
        localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updatedPrinters));
        return { printers: updatedPrinters };
      });
    },

    setDefaultPrinter: (id, destination) => {
      set((state) => {
        const updatedPrinters = state.printers.map((p) => {
          if (p.destination === destination) {
            return { ...p, isDefault: p.id === id };
          }
          return p;
        });
        localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updatedPrinters));
        return { printers: updatedPrinters };
      });
    },

    getDefaultPrinter: (destination) => {
      const { printers } = get();
      return printers.find((p) => p.destination === destination && p.isDefault && p.isActive) || 
             printers.find((p) => p.destination === destination && p.isActive) || 
             null;
    },

    getPrintersByDestination: (destination) => {
      const { printers } = get();
      return printers.filter((p) => p.destination === destination);
    },

    addPrintJob: (jobData) => {
      const newJob: PrintJob = {
        ...jobData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      set((state) => {
        const updatedJobs = [newJob, ...state.printJobs].slice(0, 100);
        localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updatedJobs));
        return { 
          printJobs: updatedJobs,
          activeJobs: newJob.status === 'printing' ? [...state.activeJobs, newJob] : state.activeJobs
        };
      });

      return newJob;
    },

    updateJobStatus: (id, status, error) => {
      set((state) => {
        const updatedJobs = state.printJobs.map((j) =>
          j.id === id ? { ...j, status, errorMessage: error, completedAt: status === 'done' || status === 'failed' ? Date.now() : j.completedAt } : j
        );
        localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updatedJobs));
        
        const updatedActiveJobs = state.activeJobs.filter(j => j.id !== id);
        if (status === 'printing') {
          const job = updatedJobs.find(j => j.id === id);
          if (job) updatedActiveJobs.push(job);
        }

        return { 
          printJobs: updatedJobs,
          activeJobs: updatedActiveJobs
        };
      });
    },

    getPrintHistory: () => {
      return get().printJobs;
    },

    clearHistory: () => {
      set({ printJobs: [] });
      localStorage.removeItem(STORAGE_KEY_JOBS);
    },

    testPrint: (printer) => {
      const { addPrintJob, updateJobStatus } = get();
      
      const job = addPrintJob({
        printerId: printer.id,
        type: 'bill',
        orderId: 'TEST-PRINT',
        status: 'printing',
        copies: 1
      });

      if (printer.connectionType === 'browser') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = `
            <html>
              <head>
                <title>Test Print</title>
                <style>
                  body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: ${printer.paperWidth === '58mm' ? '160px' : printer.paperWidth === '80mm' ? '200px' : '280px'};
                    margin: 0 auto;
                    padding: 10px;
                    text-align: center;
                  }
                  .bold { font-weight: bold; }
                  .divider { border-top: 1px dashed #000; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="bold">RESTAURANT NAME</div>
                <div class="bold" style="font-size: 1.2em; margin: 10px 0;">*** PRINTER TEST ***</div>
                <div>Date: ${new Date().toLocaleString()}</div>
                <div class="divider"></div>
                <div style="text-align: left;">
                  <div>Printer: ${printer.name}</div>
                  <div>Type: ${printer.type}</div>
                  <div>Width: ${printer.paperWidth}</div>
                  <div>Encoding: ${printer.encoding}</div>
                </div>
                <div class="divider"></div>
                <div class="bold">Test successful!</div>
              </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
          updateJobStatus(job.id, 'done');
        } else {
          updateJobStatus(job.id, 'failed', 'Popup blocked');
          toast.error('Print popup blocked. Please allow popups.');
        }
      } else {
        // Mock network/USB print
        setTimeout(() => {
          updateJobStatus(job.id, 'done');
          toast.success(`Test sent to ${printer.name} — check printer output`);
        }, 1500);
      }
    },

    savePrinters: () => {
      localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(get().printers));
    }
  };
});

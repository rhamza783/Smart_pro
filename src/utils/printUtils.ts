import { HistoryOrder, Order, BillConfig, KOTConfig, PropertySettings, SplitPortion, PrinterConfig } from '../types';
import { 
  generateBillPreviewHTML, 
  generateKOTPreviewHTML, 
  generateSplitBillPortionHTML, 
  generateSplitBillSummaryHTML,
  generateAdvanceReceiptHTML,
  generateRefundReceiptHTML
} from './receiptPreviewUtils';

const executePrint = (html: string, printer: PrinterConfig) => {
  const printArea = document.getElementById('receipt-print-area');
  if (!printArea) return;

  // Set paper width for browser print
  const width = printer.paperWidth === '58mm' ? '58mm' : printer.paperWidth === '80mm' ? '80mm' : '112mm';
  
  // Inject style for paper width
  const styleId = 'print-paper-style';
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.innerHTML = `
    @media print {
      @page { size: ${width} auto; margin: 0; }
      body { margin: 0; padding: 0; width: ${width}; }
      #receipt-print-area { width: ${width}; margin: 0 auto; }
    }
  `;

  printArea.innerHTML = html;
  
  // Handle multiple copies
  const copies = printer.copies || 1;
  
  const doPrint = () => {
    if (printer.type === 'browser') {
      for (let i = 0; i < copies; i++) {
        window.print();
      }
    } else {
      // Mock for network/USB printers
      console.log(`Printing to ${printer.name} (${printer.type}) - ${copies} copies`);
    }
  };

  setTimeout(doPrint, 100);
};

const defaultBrowserPrinter: PrinterConfig = {
  id: 'default-browser',
  name: 'Default Browser Printer',
  type: 'browser',
  destination: 'bill',
  paperWidth: '80mm',
  isDefault: true,
  isActive: true,
  connectionType: 'browser',
  copies: 1,
  autocut: true,
  beepOnPrint: false,
  encoding: 'UTF-8'
};

export const printBill = (order: HistoryOrder, settings: BillConfig, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter) => {
  const html = generateBillPreviewHTML(settings, property, order);
  executePrint(html, printer);
};

export const printAdvanceReceipt = (advance: any, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter) => {
  const html = generateAdvanceReceiptHTML(property, advance);
  executePrint(html, printer);
};

export const printRefundReceipt = (advance: any, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter) => {
  const html = generateRefundReceiptHTML(property, advance);
  executePrint(html, printer);
};

export const printSplitBillPortion = (order: Order, portion: SplitPortion, portionIndex: number, totalPortions: number, settings: BillConfig, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter) => {
  const html = generateSplitBillPortionHTML(settings, property, order, portion, portionIndex, totalPortions);
  executePrint(html, printer);
};

export const printSplitBillSummary = (order: Order, splits: SplitPortion[], settings: BillConfig, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter) => {
  const html = generateSplitBillSummaryHTML(settings, property, order, splits);
  executePrint(html, printer);
};

export const printKOT = (order: Order | HistoryOrder, settings: KOTConfig, property: PropertySettings, printer: PrinterConfig = defaultBrowserPrinter, isReprint = false) => {
  // For reprinting from history, we print all items.
  // For active orders, we only print items that haven't been printed yet.
  const itemsToPrint = isReprint 
    ? order.items 
    : order.items.filter(item => (item.qty || 0) > (item.printedQty || 0));
    
  if (itemsToPrint.length === 0) return;

  const kotOrder = {
    ...order,
    items: isReprint 
      ? itemsToPrint 
      : itemsToPrint.map(item => ({
          ...item,
          qty: item.qty - (item.printedQty || 0)
        }))
  };

  const html = generateKOTPreviewHTML(settings, property, kotOrder as any);
  executePrint(html, printer);
};

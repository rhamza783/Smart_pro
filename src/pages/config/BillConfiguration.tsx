import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import PrintStyleSection from '../../components/config/PrintStyleSection';
import MetaRowStyler from '../../components/config/MetaRowStyler';
import ReceiptSectionBuilder from '../../components/config/ReceiptSectionBuilder';
import { generateBillPreviewHTML } from '../../utils/receiptPreviewUtils';
import { Save, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrinterStore } from '../../store/printerStore';
import { usePrompt } from '../../hooks/usePrompt';

const BillConfiguration: React.FC = () => {
  const { billConfig, propertySettings, updateBillConfig } = useSettingsStore();
  const { getDefaultPrinter } = usePrinterStore();
  const { askConfirm } = usePrompt();
  const [localConfig, setLocalConfig] = useState(billConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultPrinter = getDefaultPrinter('bill');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm' | '112mm'>(defaultPrinter?.paperWidth || '80mm');

  const handleToggle = (key: keyof typeof localConfig) => {
    if (typeof localConfig[key] === 'boolean') {
      setLocalConfig({ ...localConfig, [key]: !localConfig[key] });
    }
  };

  const handleStyleChange = (key: keyof typeof localConfig.printStyles, newStyle: any) => {
    setLocalConfig({
      ...localConfig,
      printStyles: {
        ...localConfig.printStyles,
        [key]: newStyle
      }
    });
  };

  const handleSave = () => {
    updateBillConfig(localConfig);
  };

  const handleReset = async () => {
    const confirmed = await askConfirm('Reset Settings', 'Are you sure you want to discard unsaved changes?');
    if (confirmed) {
      setLocalConfig(billConfig);
    }
  };

  const previewHTML = generateBillPreviewHTML(localConfig, propertySettings);

  const Toggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-[#E0E5EC] rounded-xl shadow-[2px_2px_5px_#babecc,-5px_-5px_10px_#ffffff]">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <button
        onClick={onClick}
        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${active ? 'bg-purple-600' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      {/* Settings Panel */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Content Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Toggle label="Print Logo" active={localConfig.printLogo} onClick={() => handleToggle('printLogo')} />
            <Toggle label="Print Property Info" active={localConfig.printPropInfo} onClick={() => handleToggle('printPropInfo')} />
            <Toggle label="Print Invoice Number" active={localConfig.printInvoiceNo} onClick={() => handleToggle('printInvoiceNo')} />
            <Toggle label="Print Order Start Time" active={localConfig.printStartTime} onClick={() => handleToggle('printStartTime')} />
            <Toggle label="Print Printing Time" active={localConfig.printPrintTime} onClick={() => handleToggle('printPrintTime')} />
            <Toggle label="Print Waiter Name" active={localConfig.printWaiter} onClick={() => handleToggle('printWaiter')} />
            <Toggle label="Print Cashier Name" active={localConfig.printCashier} onClick={() => handleToggle('printCashier')} />
            <Toggle label="Print Customer Info" active={localConfig.printCustomer} onClick={() => handleToggle('printCustomer')} />
            <Toggle label="Print Breakdown" active={localConfig.printBreakdown} onClick={() => handleToggle('printBreakdown')} />
            <Toggle label="Print Payments" active={localConfig.printPayments} onClick={() => handleToggle('printPayments')} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Logo Settings</h3>
          <div className="p-4 bg-[#E0E5EC] rounded-xl shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff]">
            <label className="text-[10px] text-gray-500 block mb-1 uppercase">Logo Width (px)</label>
            <input
              type="number"
              value={localConfig.logoWidth}
              onChange={(e) => setLocalConfig({ ...localConfig, logoWidth: parseInt(e.target.value) || 80 })}
              className="w-full bg-[#E0E5EC] rounded-lg p-2 text-xs shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none"
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Typography</h3>
          <PrintStyleSection title="Restaurant Name" style={localConfig.printStyles.restaurantName} onChange={(s) => handleStyleChange('restaurantName', s)} />
          <PrintStyleSection title="Restaurant Address" style={localConfig.printStyles.restaurantAddr} onChange={(s) => handleStyleChange('restaurantAddr', s)} />
          <PrintStyleSection title="Restaurant Phone" style={localConfig.printStyles.restaurantPhone} onChange={(s) => handleStyleChange('restaurantPhone', s)} />
          <PrintStyleSection title="Item Name" style={localConfig.printStyles.itemName} onChange={(s) => handleStyleChange('itemName', s)} />
          <PrintStyleSection title="Item Qty" style={localConfig.printStyles.itemQty} onChange={(s) => handleStyleChange('itemQty', s)} />
          <PrintStyleSection title="Item Price" style={localConfig.printStyles.itemPrice} onChange={(s) => handleStyleChange('itemPrice', s)} />
          <PrintStyleSection title="Subtotal Row" style={localConfig.printStyles.subtotal} onChange={(s) => handleStyleChange('subtotal', s)} />
          <PrintStyleSection title="Discount Row" style={localConfig.printStyles.discount} onChange={(s) => handleStyleChange('discount', s)} />
          <PrintStyleSection title="Grand Total Box" style={localConfig.printStyles.grandTotal} onChange={(s) => handleStyleChange('grandTotal', s)} />
        </section>

        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Meta Rows</h3>
          <MetaRowStyler 
            title="Order Number Row" 
            headingStyle={localConfig.printStyles.orderHeading} 
            valueStyle={localConfig.printStyles.orderValue}
            onHeadingChange={(s) => handleStyleChange('orderHeading', s)}
            onValueChange={(s) => handleStyleChange('orderValue', s)}
          />
          <MetaRowStyler 
            title="Table Number Row" 
            headingStyle={localConfig.printStyles.tableHeading} 
            valueStyle={localConfig.printStyles.tableValue}
            onHeadingChange={(s) => handleStyleChange('tableHeading', s)}
            onValueChange={(s) => handleStyleChange('tableValue', s)}
          />
          <MetaRowStyler 
            title="Date Row" 
            headingStyle={localConfig.printStyles.dateHeading} 
            valueStyle={localConfig.printStyles.dateValue}
            onHeadingChange={(s) => handleStyleChange('dateHeading', s)}
            onValueChange={(s) => handleStyleChange('dateValue', s)}
          />
          <MetaRowStyler 
            title="Time Row" 
            headingStyle={localConfig.printStyles.timeHeading} 
            valueStyle={localConfig.printStyles.timeValue}
            onHeadingChange={(s) => handleStyleChange('timeHeading', s)}
            onValueChange={(s) => handleStyleChange('timeValue', s)}
          />
          <MetaRowStyler 
            title="Server Row" 
            headingStyle={localConfig.printStyles.serverHeading} 
            valueStyle={localConfig.printStyles.serverValue}
            onHeadingChange={(s) => handleStyleChange('serverHeading', s)}
            onValueChange={(s) => handleStyleChange('serverValue', s)}
          />
          <MetaRowStyler 
            title="Cashier Row" 
            headingStyle={localConfig.printStyles.cashierHeading} 
            valueStyle={localConfig.printStyles.cashierValue}
            onHeadingChange={(s) => handleStyleChange('cashierHeading', s)}
            onValueChange={(s) => handleStyleChange('cashierValue', s)}
          />
        </section>

        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Footer</h3>
          <div className="p-4 bg-[#E0E5EC] rounded-xl shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Custom Footer Text (HTML Allowed)</label>
              <textarea
                value={localConfig.customFooter}
                onChange={(e) => setLocalConfig({ ...localConfig, customFooter: e.target.value })}
                rows={3}
                className="w-full bg-[#E0E5EC] rounded-lg p-2 text-xs shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none resize-none"
              />
            </div>
            <PrintStyleSection title="Footer Style" style={localConfig.printStyles.footer} onChange={(s) => handleStyleChange('footer', s)} />
          </div>
        </section>

        <section className="bg-[#E0E5EC] rounded-2xl shadow-neumorphic overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between hover:bg-background-dark/10 transition-all"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-600 uppercase tracking-[0.2em]">Advanced Layout</h3>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase">New</span>
            </div>
            {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <AnimatePresence>
            {showAdvanced && (
              <div className="p-4 border-t border-border/50 space-y-4">
                <ReceiptSectionBuilder 
                  sections={localConfig.receiptSections || []} 
                  onUpdate={(sections) => setLocalConfig({ ...localConfig, receiptSections: sections })}
                />
              </div>
            )}
          </AnimatePresence>
        </section>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:bg-purple-700 transition-all active:shadow-inner"
          >
            <Save size={18} />
            <span className="font-bold">Save Settings</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E0E5EC] text-gray-600 rounded-xl shadow-[4px_4px_10px_#babecc,-4px_-4px_10px_#ffffff] hover:text-red-600 transition-all active:shadow-inner"
          >
            <RotateCcw size={18} />
            <span className="font-bold">Reset</span>
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-full lg:w-[400px] h-fit lg:h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Live Preview</h3>
          <div className="flex gap-1 p-1 rounded-lg bg-[#E0E5EC] shadow-neumorphic-inset">
            {['58mm', '80mm', '112mm'].map((w) => (
              <button
                key={w}
                onClick={() => setPaperWidth(w as any)}
                className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                  paperWidth === w ? 'bg-primary text-white shadow-neumorphic' : 'text-gray-500 hover:bg-background-dark/20'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-3xl p-6 shadow-2xl overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div 
            className="bg-white shadow-lg transition-all duration-300 border-2 border-dashed border-gray-400"
            style={{ 
              width: paperWidth === '58mm' ? '160px' : paperWidth === '80mm' ? '200px' : '280px',
              minHeight: '400px'
            }}
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
          <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Paper Edge (Dashed)</p>
        </div>
      </div>
    </div>
  );
};

export default BillConfiguration;

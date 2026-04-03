import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePromptStore } from '../../store/promptStore';
import Numpad from '../ui/Numpad';
import NumpadDisplay from '../ui/NumpadDisplay';
import { hapticSuccess, hapticError } from '../../utils/haptics';

const DynamicPromptModal: React.FC = () => {
  const { isOpen, config, resolvePrompt, closePrompt } = usePromptStore();

  const [priceValue, setPriceValue] = useState('');
  const [qtyValue, setQtyValue] = useState('1');
  const [textValue, setTextValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [activeSection, setActiveSection] = useState<'price' | 'qty'>('price');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen && config) {
      setPriceValue(config.currentPrice?.toString() || '');
      setQtyValue(config.currentQty?.toString() || (config.mode === 'qty' || config.mode === 'weight' ? '0' : '1'));
      setTextValue(config.currentText || '');
      setPasswordValue('');
      setActiveSection('price');
      setHasError(false);
    }
  }, [isOpen, config]);

  const handleDigit = useCallback((digit: string) => {
    if (config?.mode === 'text') return;

    if (config?.mode === 'password') {
      if (passwordValue.length < 8) {
        setPasswordValue(prev => prev + digit);
      }
      return;
    }

    if (config?.mode === 'both') {
      if (activeSection === 'price') {
        setPriceValue(prev => (prev === '0' ? digit : prev + digit));
      } else {
        setQtyValue(prev => (prev === '0' ? digit : prev + digit));
      }
      return;
    }

    if (config?.mode === 'qty' || config?.mode === 'weight') {
      setQtyValue(prev => (prev === '0' ? digit : prev + digit));
      return;
    }

    setPriceValue(prev => (prev === '0' ? digit : prev + digit));
  }, [config, passwordValue, activeSection]);

  const handleBackspace = useCallback(() => {
    if (config?.mode === 'text') return;

    if (config?.mode === 'password') {
      setPasswordValue(prev => prev.slice(0, -1));
      return;
    }

    if (config?.mode === 'both') {
      if (activeSection === 'price') {
        setPriceValue(prev => prev.slice(0, -1) || '0');
      } else {
        setQtyValue(prev => prev.slice(0, -1) || '0');
      }
      return;
    }

    if (config?.mode === 'qty' || config?.mode === 'weight') {
      setQtyValue(prev => prev.slice(0, -1) || '0');
      return;
    }

    setPriceValue(prev => prev.slice(0, -1) || '0');
  }, [config, activeSection]);

  const handleDecimal = useCallback(() => {
    if (config?.mode === 'text' || config?.mode === 'password') return;

    if (config?.mode === 'both') {
      if (activeSection === 'price') {
        if (!priceValue.includes('.')) setPriceValue(prev => prev + '.');
      } else {
        if (!qtyValue.includes('.')) setQtyValue(prev => prev + '.');
      }
      return;
    }

    if (config?.mode === 'qty' || config?.mode === 'weight') {
      if (!qtyValue.includes('.')) setQtyValue(prev => prev + '.');
      return;
    }

    if (!priceValue.includes('.')) setPriceValue(prev => prev + '.');
  }, [config, activeSection, priceValue, qtyValue]);

  const handleConfirm = useCallback(() => {
    if (!config) return;

    if (config.mode === 'confirm') {
      hapticSuccess();
      resolvePrompt({ price: null, qty: null, text: 'confirmed' });
      return;
    }

    const result = {
      price: priceValue ? parseFloat(priceValue) : null,
      qty: qtyValue ? parseFloat(qtyValue) : null,
      text: config.mode === 'text' ? textValue : config.mode === 'password' ? passwordValue : null,
    };

    if (config.mode === 'password') {
      // Auto-verify logic is handled by the hook, but we can add UI feedback here
      // For now, we just resolve and the hook will check the PIN
      hapticSuccess();
      resolvePrompt(result);
      return;
    }

    hapticSuccess();
    resolvePrompt(result);
  }, [config, priceValue, qtyValue, textValue, passwordValue, resolvePrompt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        closePrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, handleDecimal, handleConfirm, closePrompt]);

  if (!isOpen || !config) return null;

  const quickAmounts = [500, 1000, 1500, 2000];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePrompt}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[380px] bg-white rounded-[32px] shadow-2xl overflow-hidden p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-purple-600">{config.title}</h2>
              {config.itemName && (
                <p className="text-sm text-gray-500 font-medium">{config.itemName}</p>
              )}
            </div>
            <button
              onClick={closePrompt}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* PRICE MODE */}
            {config.mode === 'price' && (
              <>
                <NumpadDisplay value={priceValue} prefix="PKR" isActive />
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setPriceValue(amt.toString())}
                      className="px-4 py-2 rounded-xl bg-purple-50 text-purple-600 font-bold text-sm whitespace-nowrap active:scale-95 transition-all"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <Numpad
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  onDecimal={handleDecimal}
                />
              </>
            )}

            {/* QTY MODE */}
            {config.mode === 'qty' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setQtyValue(prev => Math.max(1, parseFloat(prev || '0') - 1).toString())}
                    className="w-16 h-16 rounded-full bg-red-50 text-red-500 shadow-[4px_4px_10px_#d1d1d1,-4px_-4px_10px_#ffffff] flex items-center justify-center active:scale-90 transition-all"
                  >
                    <Minus size={32} />
                  </button>
                  <div className="flex-1">
                    <NumpadDisplay value={qtyValue} prefix="Qty" isActive />
                  </div>
                  <button
                    onClick={() => setQtyValue(prev => (parseFloat(prev || '0') + 1).toString())}
                    className="w-16 h-16 rounded-full bg-green-50 text-green-500 shadow-[4px_4px_10px_#d1d1d1,-4px_-4px_10px_#ffffff] flex items-center justify-center active:scale-90 transition-all"
                  >
                    <Plus size={32} />
                  </button>
                </div>
                <Numpad
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  showDecimal={false}
                />
              </>
            )}

            {/* WEIGHT MODE */}
            {config.mode === 'weight' && (
              <>
                <NumpadDisplay value={qtyValue} suffix="kg" isActive />
                <div className="text-center">
                  <p className="text-gray-500 font-medium">
                    Price: <span className="text-purple-600 font-bold">PKR {(parseFloat(qtyValue || '0') * (config.currentPrice || 0)).toLocaleString()}</span>
                  </p>
                </div>
                <Numpad
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  onDecimal={handleDecimal}
                />
              </>
            )}

            {/* BOTH MODE */}
            {config.mode === 'both' && (
              <>
                <div className="space-y-3">
                  <div onClick={() => setActiveSection('price')}>
                    <NumpadDisplay
                      value={priceValue}
                      prefix="Price: PKR"
                      isActive={activeSection === 'price'}
                    />
                  </div>
                  <div onClick={() => setActiveSection('qty')}>
                    <NumpadDisplay
                      value={qtyValue}
                      prefix="Qty:"
                      isActive={activeSection === 'qty'}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-medium">
                    Total: <span className="text-purple-600 font-bold">PKR {(parseFloat(priceValue || '0') * parseFloat(qtyValue || '0')).toLocaleString()}</span>
                  </p>
                </div>
                <Numpad
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  onDecimal={handleDecimal}
                />
              </>
            )}

            {/* TEXT MODE */}
            {config.mode === 'text' && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    autoFocus
                    rows={4}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value.slice(0, 200))}
                    placeholder="Type a note for this item..."
                    className="w-full p-4 rounded-2xl bg-gray-50 shadow-inner focus:ring-2 focus:ring-purple-500 outline-none resize-none text-gray-700 font-medium"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                    {textValue.length}/200
                  </span>
                </div>
                {textValue && (
                  <button
                    onClick={() => setTextValue('')}
                    className="text-sm text-gray-400 font-medium hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* PASSWORD MODE */}
            {config.mode === 'password' && (
              <div className="space-y-6">
                <NumpadDisplay
                  value={'●'.repeat(passwordValue.length)}
                  isActive
                  hasError={hasError}
                />
                {hasError && (
                  <p className="text-center text-red-500 text-sm font-bold animate-shake">
                    Incorrect PIN — try again
                  </p>
                )}
                <Numpad
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  showDecimal={false}
                />
              </div>
            )}

            {/* CONFIRM MODE */}
            {config.mode === 'confirm' && (
              <div className="py-4 text-center space-y-4">
                <p className="text-gray-600 font-medium leading-relaxed">
                  {config.message}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleConfirm}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  config.mode === 'password' || config.mode === 'text' || config.mode === 'both'
                    ? 'bg-purple-600'
                    : 'bg-green-500'
                }`}
              >
                <Check size={20} />
                {config.mode === 'text' ? 'Save Note' : config.mode === 'password' ? 'Verify' : config.mode === 'both' ? 'Update' : config.mode === 'confirm' ? 'Yes, Confirm' : 'Confirm'}
              </button>
              <button
                onClick={closePrompt}
                className="w-full py-2 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DynamicPromptModal;

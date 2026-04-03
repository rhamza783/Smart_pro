import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PinModalProps {
  title: string;
  onSuccess: () => void;
  onClose: () => void;
}

const PinModal: React.FC<PinModalProps> = ({ title, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    // Simple hardcoded PIN for demo, in real app this would check against manager/admin workers
    if (pin === '1234') {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-[320px] rounded-3xl shadow-2xl p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-text-secondary mb-4">Please enter Manager PIN to proceed.</p>
        
        <input 
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          placeholder="Enter PIN"
          className={`w-full p-4 text-center text-2xl tracking-[1em] rounded-2xl shadow-neumorphic-inset bg-background outline-none mb-4 ${error ? 'border-2 border-danger' : ''}`}
          autoFocus
        />
        
        {error && <p className="text-danger text-xs text-center mb-4">Invalid PIN. Try again.</p>}
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-3 rounded-xl font-bold text-text-secondary shadow-neumorphic active:shadow-neumorphic-inset transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="py-3 rounded-xl font-bold text-white bg-primary shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ClockTimePickerProps {
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  onClose: () => void;
  label: string;
}

const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange, onClose, label }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setIsAM(h < 12);
      setHour(h % 12 || 12);
      setMinute(m);
    }
  }, [value]);

  const handleHourClick = (h: number) => {
    setHour(h);
  };

  const handleConfirm = () => {
    let finalHour = hour % 12;
    if (!isAM) finalHour += 12;
    const timeStr = `${String(finalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(timeStr);
    onClose();
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[380px] overflow-hidden rounded-3xl bg-[#E0E5EC] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"
      >
        <div className="bg-[#6750A4] p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{label}</h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center p-6">
          <div className="mb-4 text-4xl font-bold text-[#6750A4]">
            {hour}:{String(minute).padStart(2, '0')} {isAM ? 'AM' : 'PM'}
          </div>

          <div className="relative h-[300px] w-[300px] rounded-full bg-[#EDE7F6] shadow-inner">
            <svg width="300" height="300" className="cursor-pointer">
              {/* Clock Numbers */}
              {hours.map((h, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const isActive = hour === h;

                return (
                  <g key={h} onClick={() => handleHourClick(h)} className="cursor-pointer">
                    {isActive && (
                      <circle cx={x} cy={y} r="20" fill="#A8D878" />
                    )}
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-sm font-bold ${isActive ? 'fill-[#2D5A2D]' : 'fill-[#6750A4]'}`}
                    >
                      {h}
                    </text>
                  </g>
                );
              })}

              {/* Needle */}
              {(() => {
                const activeIndex = hours.indexOf(hour);
                const angle = (activeIndex * 30 - 90) * (Math.PI / 180);
                const x = centerX + (radius - 20) * Math.cos(angle);
                const y = centerY + (radius - 20) * Math.sin(angle);
                return (
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="#2D5A2D"
                    strokeWidth="2"
                  />
                );
              })()}
              <circle cx={centerX} cy={centerY} r="4" fill="#2D5A2D" />
            </svg>
          </div>

          <div className="mt-6 flex w-full justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setIsAM(true)}
                className={`rounded-full px-4 py-1 text-sm font-bold transition-all ${
                  isAM ? 'bg-[#A8D4E8] text-blue-900 shadow-inner' : 'bg-gray-200 text-gray-500'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setIsAM(false)}
                className={`rounded-full px-4 py-1 text-sm font-bold transition-all ${
                  !isAM ? 'bg-[#A8D4E8] text-blue-900 shadow-inner' : 'bg-gray-200 text-gray-500'
                }`}
              >
                PM
              </button>
            </div>

            <div className="flex gap-2">
              {[0, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinute(m)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                    minute === m ? 'bg-[#6750A4] text-white' : 'bg-white text-[#6750A4] shadow-sm'
                  }`}
                >
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex w-full gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-3 font-bold text-gray-500 shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] active:shadow-inner"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-[#6750A4] py-3 font-bold text-white shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] active:shadow-inner"
            >
              OK
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClockTimePicker;

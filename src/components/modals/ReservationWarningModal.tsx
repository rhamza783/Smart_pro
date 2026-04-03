import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Phone, Clock, Users, FileText } from 'lucide-react';
import { Reservation } from '../../types';

interface ReservationWarningModalProps {
  reservation: Reservation;
  onClose: () => void;
  onProceed: () => void;
}

const ReservationWarningModal: React.FC<ReservationWarningModalProps> = ({
  reservation,
  onClose,
  onProceed,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[420px] overflow-hidden rounded-3xl bg-[#E0E5EC] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="p-6 text-white" 
          style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Table Reserved</h3>
              <p className="text-sm opacity-80">Table {reservation.tableName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-2xl bg-white/50 p-4 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e74c3c]/10 text-[#e74c3c]">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Reserved For</p>
                <h4 className="text-lg font-bold text-gray-800">{reservation.clientName}</h4>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone size={14} /> {reservation.clientPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/50 p-3 text-center shadow-inner">
              <Clock size={16} className="mx-auto mb-1 text-[#e74c3c]" />
              <p className="text-[10px] font-bold uppercase text-gray-400">From</p>
              <p className="text-sm font-bold text-gray-700">{reservation.startTime}</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-3 text-center shadow-inner">
              <Clock size={16} className="mx-auto mb-1 text-[#e74c3c]" />
              <p className="text-[10px] font-bold uppercase text-gray-400">Until</p>
              <p className="text-sm font-bold text-gray-700">{reservation.endTime}</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-3 text-center shadow-inner">
              <Users size={16} className="mx-auto mb-1 text-[#e74c3c]" />
              <p className="text-[10px] font-bold uppercase text-gray-400">Guests</p>
              <p className="text-sm font-bold text-gray-700">{reservation.people}</p>
            </div>
          </div>

          {reservation.notes && (
            <div className="mb-6 rounded-2xl bg-gray-100 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                <FileText size={14} /> Notes
              </div>
              <p className="text-sm text-gray-600 italic">"{reservation.notes}"</p>
            </div>
          )}

          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-gray-600">
              Do you still want to open this table for a new order?
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-3 font-bold text-gray-500 shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] active:shadow-inner"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="flex-1 rounded-xl bg-[#e74c3c] py-3 font-bold text-white shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] active:shadow-inner"
            >
              Yes, Open Table
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReservationWarningModal;

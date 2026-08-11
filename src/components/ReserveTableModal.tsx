import React, { useState, useEffect, useRef } from 'react';
import { Table, TableStatus } from '../types';
import { Calendar, Clock, User, Phone, Mail, Users, CheckCircle2, X, Sparkles, Utensils, MessageSquare } from 'lucide-react';

interface ReserveTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onConfirmReserve?: (
    details: {
      tableId: string;
      guestName: string;
      guestPhone: string;
      guestEmail: string;
      reservationTime: string;
      partySize: number;
    }
  ) => Promise<void> | void;
  onReserveTable?: (
    tableId: string,
    details: {
      guestName: string;
      guestPhone: string;
      guestEmail: string;
      partySize: number;
      reservationTime: string;
      notes?: string;
    }
  ) => Promise<void> | void;
  selectedTableId?: string;
  defaultTableId?: string;
}

export const ReserveTableModal: React.FC<ReserveTableModalProps> = ({
  isOpen,
  onClose,
  tables,
  onConfirmReserve,
  onReserveTable,
  selectedTableId,
  defaultTableId
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [targetTableId, setTargetTableId] = useState('');
  const [reservationTime, setReservationTime] = useState('07:30 PM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const prevIsOpenRef = useRef(false);

  const activeInitialTableId = defaultTableId || selectedTableId;

  // Initialize form ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setPartySize(2);
      setNotes('');
      setSuccessMsg(false);
      setIsSubmitting(false);

      if (activeInitialTableId) {
        setTargetTableId(activeInitialTableId);
      } else {
        const avail = tables.find(t => t.status === 'available') || tables[0];
        if (avail) setTargetTableId(avail.id);
      }

      // Default reservation time to next 30 mins
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const hours = now.getHours();
      const mins = Math.floor(now.getMinutes() / 15) * 15;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedH = hours % 12 || 12;
      const formattedM = String(mins).padStart(2, '0');
      setReservationTime(`${formattedH}:${formattedM} ${ampm}`);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeInitialTableId, tables]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableId || !guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      alert('Please fill in Guest Name, Phone Number, and Email ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onConfirmReserve) {
        await onConfirmReserve({
          tableId: targetTableId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          reservationTime,
          partySize
        });
      } else if (onReserveTable) {
        await onReserveTable(targetTableId, {
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          partySize,
          reservationTime,
          notes: notes.trim()
        });
      }

      setSuccessMsg(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Reservation submit error:', err);
      alert('Failed to save reservation. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedTable = tables.find(t => t.id === targetTableId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Reserve Table</h3>
              <p className="text-xs text-slate-400">Add guest contact info to reserve table and show on front panel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {successMsg ? (
          <div className="p-10 text-center space-y-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">Table Reserved!</h4>
            <p className="text-xs text-slate-400">
              Table {selectedTable?.number} reserved for <span className="text-amber-400 font-bold">{guestName}</span>.
              Displaying details on front panel...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            
            {/* Select Target Table */}
            <div>
              <label className="text-xs font-bold text-amber-400 block mb-1.5 flex items-center justify-between">
                <span>Select Table</span>
                {selectedTable && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    Zone: {selectedTable.zone} • Capacity: {selectedTable.capacity} guests
                  </span>
                )}
              </label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
              >
                {tables.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    Table {t.number} ({t.name}) — {t.zone} [Cap: {t.capacity}] {t.status === 'reserved' ? '(Currently Reserved)' : t.status === 'occupied' ? '(Occupied)' : '(Available)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Name & Party Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Guest Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Wright"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Party Size
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number & Email ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 234-5678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Email ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Reservation Time & Special Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reservation Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07:30 PM"
                    value={reservationTime}
                    onChange={(e) => setReservationTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Special Notes
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Window seat, Birthday"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Saving Reservation...' : 'Confirm & Display Reservation'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Table, WaitlistEntry, RestaurantInfo, UserSession } from '../types';
import {
  Calendar, Clock, User, Phone, Mail, Users, CheckCircle2,
  Sparkles, Utensils, MessageSquare, Search, Filter, Plus,
  Share2, Check, ExternalLink, ArrowRight, X, AlertCircle,
  Tag, MapPin, QrCode, Printer, PhoneCall, Send, ChevronRight,
  ShieldCheck, RefreshCw, BookmarkCheck
} from 'lucide-react';

interface QuickDinerBookingViewProps {
  restaurant: RestaurantInfo;
  tables: Table[];
  waitlist: WaitlistEntry[];
  zones: string[];
  onConfirmReserve: (data: {
    tableId: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    reservationTime: string;
    partySize: number;
    notes?: string;
  }) => Promise<void> | void;
  onUpdateTableStatus: (tableId: string, status: Table['status'], guestName?: string, partySize?: number) => void;
  onCancelReservation: (tableId: string) => void;
  onSwitchToDinerPortal?: () => void;
}

export const QuickDinerBookingView: React.FC<QuickDinerBookingViewProps> = ({
  restaurant,
  tables,
  waitlist,
  zones,
  onConfirmReserve,
  onUpdateTableStatus,
  onCancelReservation,
  onSwitchToDinerPortal,
}) => {
  // Quick Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('07:30 PM');
  const [bookingDate, setBookingDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [specialOccasion, setSpecialOccasion] = useState<string>('Standard Dining');
  const [dietaryTag, setDietaryTag] = useState<string>('None');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter State for Existing Diner Bookings
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reserved' | 'occupied' | 'waitlist'>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Quick Preset Times
  const timePresets = ['12:30 PM', '01:00 PM', '01:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'];
  const occasionPresets = ['Standard Dining', 'Birthday Celebration', 'Anniversary', 'Business Meeting', 'Romantic Dinner', 'VIP Guest'];
  const dietaryPresets = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Nut Allergy', 'Halal', 'Jain'];

  // Filtered available tables based on party size & zone
  const availableTables = useMemo(() => {
    return tables.filter(t => {
      const matchesZone = selectedZone === 'All' || t.zone === selectedZone;
      const isFree = t.status === 'available';
      return matchesZone && isFree;
    });
  }, [tables, selectedZone]);

  // Set default target table if not selected
  React.useEffect(() => {
    if (!targetTableId && availableTables.length > 0) {
      // Find a table that best fits the party size
      const bestFit = availableTables.find(t => t.capacity >= partySize) || availableTables[0];
      if (bestFit) {
        setTargetTableId(bestFit.id);
      }
    }
  }, [availableTables, partySize, targetTableId]);

  // All active diner bookings (reserved tables + occupied tables + waitlist entries)
  const activeBookings = useMemo(() => {
    const list: Array<{
      id: string;
      source: 'table_reserved' | 'table_occupied' | 'waitlist';
      guestName: string;
      guestPhone: string;
      guestEmail?: string;
      partySize: number;
      tableNumber?: string;
      tableName?: string;
      zone?: string;
      time: string;
      status: 'reserved' | 'occupied' | 'waiting';
      notes?: string;
      tableId?: string;
      waitlistId?: string;
    }> = [];

    // Reserved Tables
    tables.filter(t => t.status === 'reserved').forEach(t => {
      list.push({
        id: `t_res_${t.id}`,
        source: 'table_reserved',
        guestName: t.currentGuestName || 'Reserved Guest',
        guestPhone: t.guestPhone || '',
        guestEmail: t.guestEmail || '',
        partySize: t.currentPartySize || t.capacity,
        tableNumber: t.number,
        tableName: t.name,
        zone: t.zone,
        time: t.reservationTime || 'Tonight',
        status: 'reserved',
        notes: t.notes,
        tableId: t.id
      });
    });

    // Currently Occupied Tables
    tables.filter(t => t.status === 'occupied').forEach(t => {
      list.push({
        id: `t_occ_${t.id}`,
        source: 'table_occupied',
        guestName: t.currentGuestName || 'Seated Diner',
        guestPhone: t.guestPhone || '',
        guestEmail: t.guestEmail || '',
        partySize: t.currentPartySize || t.capacity,
        tableNumber: t.number,
        tableName: t.name,
        zone: t.zone,
        time: t.seatedAt ? new Date(t.seatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Seated',
        status: 'occupied',
        notes: t.notes,
        tableId: t.id
      });
    });

    // Waitlist Walk-Ins
    waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').forEach(w => {
      list.push({
        id: `wl_${w.id}`,
        source: 'waitlist',
        guestName: w.customerName,
        guestPhone: w.phone,
        guestEmail: w.email,
        partySize: w.partySize,
        tableNumber: w.assignedTableNumber,
        zone: w.preferredZone,
        time: w.preferredTime || `Wait ~${w.estimatedWaitMinutes}m`,
        status: 'waiting',
        notes: [w.dietaryNotes, w.specialRequests].filter(Boolean).join(' • '),
        waitlistId: w.id
      });
    });

    return list;
  }, [tables, waitlist]);

  // Filtered Bookings for Search
  const filteredBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        b.guestName.toLowerCase().includes(q) ||
        b.guestPhone.toLowerCase().includes(q) ||
        (b.tableNumber && b.tableNumber.toLowerCase().includes(q)) ||
        (b.zone && b.zone.toLowerCase().includes(q));

      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;

      return matchesQuery && matchesStatus;
    });
  }, [activeBookings, searchQuery, filterStatus]);

  // Handle Form Submission
  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert('Please enter the diner / guest name.');
      return;
    }
    if (!targetTableId) {
      alert('Please select an available dining table.');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = [
        specialOccasion !== 'Standard Dining' ? `Occasion: ${specialOccasion}` : null,
        dietaryTag !== 'None' ? `Dietary: ${dietaryTag}` : null,
        notes.trim() || null
      ].filter(Boolean).join(' | ');

      await onConfirmReserve({
        tableId: targetTableId,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || 'Walk-In Phone',
        guestEmail: guestEmail.trim() || 'guest@diner.com',
        reservationTime: `${reservationTime} (${bookingDate})`,
        partySize,
        notes: combinedNotes
      });

      const selectedTable = tables.find(t => t.id === targetTableId);
      const bookedTableName = selectedTable ? `Table #${selectedTable.number}` : 'Table';

      setSuccessToast(`Diner reservation confirmed for ${guestName.trim()} at ${bookedTableName} (${reservationTime})!`);
      setTimeout(() => setSuccessToast(null), 4500);

      // Reset form fields
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setNotes('');
      setSpecialOccasion('Standard Dining');
      setDietaryTag('None');
    } catch (err: any) {
      console.error('Failed to book table:', err);
      alert(err.message || 'Failed to complete diner booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyBookingLink = () => {
    const publicUrl = `${window.location.origin}/reserve`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5" />
              Quick Diner Table Booking & Reservation Hub
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Host Desk Diner Reservations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Instantly book incoming phone reservations, seat walk-in diners, manage party sizes, and oversee all active guest bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleCopyBookingLink}
              id="btn-copy-diner-booking-link"
              className="flex-1 sm:flex-none bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              title="Copy Customer Public Booking URL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Share Booking Link</span>
                </>
              )}
            </button>

            {onSwitchToDinerPortal && (
              <button
                onClick={onSwitchToDinerPortal}
                id="btn-open-diner-front-page"
                className="flex-1 sm:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                title="Switch to Diner Front Page"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Open Diner View</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Available Tables</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-emerald-400">{availableTables.length}</span>
              <span className="text-[10px] text-slate-500">of {tables.length} tables</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Active Bookings</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-amber-400">
                {tables.filter(t => t.status === 'reserved').length}
              </span>
              <span className="text-[10px] text-slate-500">reserved</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Currently Seated</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-blue-400">
                {tables.filter(t => t.status === 'occupied').length}
              </span>
              <span className="text-[10px] text-slate-500">dining</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Waiting Walk-Ins</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-purple-400">
                {waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length}
              </span>
              <span className="text-[10px] text-slate-500">in queue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 cols): Quick Diner Reservation Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Quick Diner Booking Form
                </h2>
                <p className="text-[11px] text-slate-400">
                  Direct phone / front-desk reservation entry
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-slate-800 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700">
              Host Fast-Track
            </span>
          </div>

          <form onSubmit={handleQuickBookSubmit} className="space-y-4">
            {/* Guest Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Diner / Guest Name *
                </label>
                <input
                  type="text"
                  required
                  id="input-quick-diner-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  id="input-quick-diner-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. +91 98200 88299"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email ID (Optional for Confirmation)
              </label>
              <input
                type="email"
                id="input-quick-diner-email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
              />
            </div>

            {/* Party Size Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Party Size: <strong className="text-amber-400 font-extrabold">{partySize} Guests</strong>
                </span>
                <span className="text-[10px] text-slate-400">Select count</span>
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPartySize(num)}
                    className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                      partySize === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {num}{num === 10 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Reservation Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Reservation Time
                </label>
                <input
                  type="text"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  placeholder="07:30 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {timePresets.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReservationTime(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-mono ${
                    reservationTime.includes(t)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Zone & Table Selection */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Select Dining Table *
                </label>

                {/* Zone Filter Pill */}
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-[11px] text-amber-400 font-bold rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="All">All Dining Zones</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {availableTables.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No available tables in this zone. You can still seat guests or select another zone.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableTables.map((tbl) => {
                    const isSelected = targetTableId === tbl.id;
                    const isFit = tbl.capacity >= partySize;
                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setTargetTableId(tbl.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-md ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold text-xs">#{tbl.number}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                            isFit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {tbl.capacity}P
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate mt-1">{tbl.zone}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Special Occasion & Dietary Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Dining Occasion
                </label>
                <select
                  value={specialOccasion}
                  onChange={(e) => setSpecialOccasion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {occasionPresets.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Dietary / Preference
                </label>
                <select
                  value={dietaryTag}
                  onChange={(e) => setDietaryTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {dietaryPresets.map((diet) => (
                    <option key={diet} value={diet}>{diet}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Special Instructions / Table Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Window side requested, VIP regular guest, needs baby high chair."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || !targetTableId}
              id="btn-submit-quick-diner-reservation"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reserving Table...</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4 text-slate-950" />
                  <span>Confirm Diner Reservation Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (7 cols): Active Diner Reservations List & Management */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Live Diner Bookings ({filteredBookings.length})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Real-time guest reservations, seated tables & queue
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'reserved', 'occupied', 'waitlist'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                    filterStatus === st
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'waitlist' ? 'Waitlist' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, phone number, table number, or zone..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bookings List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No Diner Bookings Found</h3>
                  <p className="text-xs text-slate-500">
                    {searchQuery ? 'Try adjusting your search criteria.' : 'Create a new reservation using the quick booking form on the left.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isReserved = b.status === 'reserved';
                const isOccupied = b.status === 'occupied';
                const isWaitlist = b.status === 'waiting';

                return (
                  <div
                    key={b.id}
                    className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 transition hover:border-slate-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    {/* Left: Guest Details & Table */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 border ${
                        isReserved 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                          : isOccupied 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}>
                        {b.tableNumber ? `#${b.tableNumber}` : 'WL'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm truncate">
                            {b.guestName}
                          </span>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                            isReserved 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                              : isOccupied 
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}>
                            {b.status}
                          </span>

                          <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                            {b.partySize} Guests
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {b.guestPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {b.guestPhone}
                            </span>
                          )}

                          <span className="flex items-center gap-1 font-mono text-amber-400">
                            <Clock className="w-3 h-3" />
                            {b.time}
                          </span>

                          {b.zone && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3 h-3" />
                              {b.zone}
                            </span>
                          )}
                        </div>

                        {b.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800/60 mt-1">
                            {b.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      {isReserved && b.tableId && (
                        <>
                          <button
                            onClick={() => onUpdateTableStatus(b.tableId!, 'occupied', b.guestName, b.partySize)}
                            className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Seat this diner now"
                          >
                            <Utensils className="w-3 h-3" />
                            <span>Seat Now</span>
                          </button>

                          <button
                            onClick={() => onCancelReservation(b.tableId!)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer"
                            title="Cancel reservation"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isOccupied && b.tableId && (
                        <button
                          onClick={() => onUpdateTableStatus(b.tableId!, 'cleaning')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                          title="Finish dining & mark for cleaning"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Clear Table</span>
                        </button>
                      )}

                      {b.guestPhone && (
                        <a
                          href={`tel:${b.guestPhone}`}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                          title="Call Diner"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { RestaurantInfo, Table, WaitlistEntry, UserSession } from '../types';
import { getRestaurantOperatingStatus } from '../utils/dateUtils';
import {
  Utensils, Calendar, Clock, Users, User, Phone, Mail,
  CheckCircle2, Sparkles, MapPin, QrCode, Tag, Heart,
  ShieldCheck, LogOut, RefreshCw, Check
} from 'lucide-react';

interface CustomerFrontPageProps {
  restaurant: RestaurantInfo;
  user: UserSession;
  tables: Table[];
  waitlist: WaitlistEntry[];
  zones: string[];
  onReserveTable: (data: {
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    reservationTime: string;
    partySize: number;
    preferredZone?: string;
    notes?: string;
    tableId?: string;
  }) => Promise<void>;
  onSubmitWalkIn: (data: {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    type: 'walkin_immediate' | 'walkin_later';
    preferredZone?: string;
    specialRequests?: string;
  }) => Promise<WaitlistEntry | null>;
  onSwitchToAdmin?: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const CustomerFrontPage: React.FC<CustomerFrontPageProps> = ({
  restaurant,
  user,
  tables,
  waitlist,
  zones,
  onReserveTable,
  onSubmitWalkIn,
  onSwitchToAdmin,
  onLogout,
  onRefresh
}) => {
  // Reservation Form State
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<string>('Any');
  const [reservationTime, setReservationTime] = useState<string>('07:30 PM');
  const [reservationDate, setReservationDate] = useState<string>('Today');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [isSubmittingReservation, setIsSubmittingReservation] = useState<boolean>(false);
  const [reservationSuccessMsg, setReservationSuccessMsg] = useState<string | null>(null);

  // Walk-In Quick Queue State
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2);
  const [walkInType, setWalkInType] = useState<'walkin_immediate' | 'walkin_later'>('walkin_immediate');
  const [walkInNotes, setWalkInNotes] = useState<string>('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);
  const [walkInSuccessMsg, setWalkInSuccessMsg] = useState<string | null>(null);

  // Operating status
  const [operatingStatus, setOperatingStatus] = useState(() =>
    getRestaurantOperatingStatus(restaurant.operatingHours)
  );

  useEffect(() => {
    const update = () => {
      setOperatingStatus(getRestaurantOperatingStatus(restaurant.operatingHours));
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [restaurant.operatingHours]);

  const availableTablesCount = tables.filter((t) => t.status === 'available').length;

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReservation(true);
    try {
      await onReserveTable({
        guestName: user.name,
        guestPhone: user.phone || '(555) 000-0000',
        guestEmail: user.email,
        reservationTime: `${reservationDate} • ${reservationTime}`,
        partySize,
        preferredZone: selectedZone,
        notes: specialNotes.trim() || undefined
      });
      setReservationSuccessMsg(`Table reservation confirmed for ${partySize} guests at ${reservationTime}!`);
      setSpecialNotes('');
    } catch (err: any) {
      console.error('Reservation error:', err);
      alert(err.message || 'Failed to complete reservation. Please try another time or party size.');
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWalkIn(true);
    try {
      const ticket = await onSubmitWalkIn({
        customerName: user.name,
        phone: user.phone || '(555) 000-0000',
        email: user.email,
        partySize: walkInPartySize,
        type: walkInType,
        specialRequests: walkInNotes.trim() || undefined
      });
      setWalkInNotes('');
      setWalkInSuccessMsg(
        ticket
          ? `You have joined the waitlist! Your queue code is #${ticket.confirmationCode}.`
          : 'You have joined the live walk-in queue!'
      );
    } catch (err) {
      console.error('Walk-in error:', err);
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      
      {/* Front Page Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5 gap-3">
            
            {/* Restaurant Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold overflow-hidden shrink-0 border border-amber-400/30">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-5 h-5" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-base text-white tracking-tight">{restaurant.name}</h1>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{restaurant.tagline}</p>
              </div>
            </div>

            {/* Right User & Controls */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                  <User className="w-3 h-3 text-emerald-400" />
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                  {user.email}
                </div>
              </div>

              {onSwitchToAdmin && (
                <button
                  onClick={onSwitchToAdmin}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5"
                  title="Switch to Restaurant Admin Host Desk"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Admin Desk</span>
                </button>
              )}

              <button
                onClick={onRefresh}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Front Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Welcome, {user.name}!
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Reserve Your Table at {restaurant.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {restaurant.welcomeMessage || 'Instant real-time dining reservations, live table confirmations, and queue priority.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> {restaurant.address}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> {restaurant.phone}
                </span>
              </div>
            </div>

            {/* Live Status Cards */}
            <div className="flex flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
              <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Tables</span>
                <span className="text-lg font-black text-emerald-400">{availableTablesCount} Tables Open</span>
              </div>

              <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Hours</span>
                <span className="text-xs font-bold text-amber-400">{restaurant.operatingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert Banners */}
        {reservationSuccessMsg && (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 text-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{reservationSuccessMsg}</span>
            </div>
            <button
              onClick={() => setReservationSuccessMsg(null)}
              className="text-xs text-emerald-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {walkInSuccessMsg && (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 text-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{walkInSuccessMsg}</span>
            </div>
            <button
              onClick={() => setWalkInSuccessMsg(null)}
              className="text-xs text-emerald-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Reservation & Walk-In Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table Reservation Form (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" /> Book a Dining Table
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct table reservation linked to your account ({user.email}).
                </p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
                Instant Confirmation
              </span>
            </div>

            <form onSubmit={handleReserveSubmit} className="space-y-5">
              
              {/* Party Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Number of Guests / Party Size
                  </span>
                  <span className="text-amber-400 font-mono font-bold text-sm">{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</span>
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                        partySize === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Reservation Date
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Today', 'Tomorrow', 'This Weekend'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setReservationDate(d)}
                        className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                          reservationDate === d
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Preferred Time Slot
                  </label>
                  <select
                    value={reservationTime}
                    onChange={(e) => setReservationTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="12:00 PM">12:00 PM (Lunch)</option>
                    <option value="12:30 PM">12:30 PM (Lunch)</option>
                    <option value="01:00 PM">01:00 PM (Lunch)</option>
                    <option value="01:30 PM">01:30 PM (Lunch)</option>
                    <option value="06:00 PM">06:00 PM (Dinner)</option>
                    <option value="06:30 PM">06:30 PM (Dinner)</option>
                    <option value="07:00 PM">07:00 PM (Dinner)</option>
                    <option value="07:30 PM">07:30 PM (Prime Dinner)</option>
                    <option value="08:00 PM">08:00 PM (Dinner)</option>
                    <option value="08:30 PM">08:30 PM (Dinner)</option>
                    <option value="09:00 PM">09:00 PM (Late Dinner)</option>
                  </select>
                </div>
              </div>

              {/* Seating Section Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Preferred Seating Zone / Atmosphere
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Any', ...zones].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSelectedZone(z)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        selectedZone === z
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests / Dietary Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Special Requests & Dietary Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anniversary celebration, window table requested, 1 high chair needed"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Guest Details Pill */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span><strong>Guest:</strong> {user.name}</span>
                  <span>•</span>
                  <span><strong>Email:</strong> {user.email}</span>
                </div>
                <span className="text-emerald-400 font-semibold text-[11px]">Instant Confirmation</span>
              </div>

              {/* Confirm Booking Button */}
              <button
                type="submit"
                disabled={isSubmittingReservation}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmittingReservation ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Securing Table Reservation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Table Reservation for {partySize} Guests</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Side Column: Walk-In Queue Check-In */}
          <div className="space-y-6">
            
            {/* Instant Walk-In Check-In Card */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" /> Walk-In Queue Check-In
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Live Queue
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Arrived or on your way? Join the digital queue for instant seating when a table opens.
              </p>

              <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Party Size</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 6].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setWalkInPartySize(sz)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          walkInPartySize === sz
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {sz} {sz === 1 ? 'pax' : 'pax'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Arrival Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkInType('walkin_immediate')}
                      className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                        walkInType === 'walkin_immediate'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Here at Restaurant
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalkInType('walkin_later')}
                      className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                        walkInType === 'walkin_later'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Arriving in 15m
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  {isSubmittingWalkIn ? 'Joining Waitlist...' : 'Join Live Walk-In Waitlist'}
                </button>
              </form>
            </div>

            {/* Host Desk Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Host Desk Information
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {restaurant.deskInstructions || 'Please check in with the host when you arrive. Reserved tables are held for up to 15 minutes past booking time.'}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Assistance Hotline</span>
                <span className="font-mono text-amber-400 font-bold">{restaurant.phone}</span>
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

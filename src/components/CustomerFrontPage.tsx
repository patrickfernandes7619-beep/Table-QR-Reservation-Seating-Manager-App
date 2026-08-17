import React, { useState, useEffect } from 'react';
import { RestaurantInfo, Table, WaitlistEntry, UserSession, AppOwnerGatewayConfig, RestaurantTenant } from '../types';
import { getRestaurantOperatingStatus } from '../utils/dateUtils';
import { CustomerPortalManager } from './CustomerPortalManager';
import { IndexLandingPage } from './IndexLandingPage';
import { getAppOwnerGatewayConfig } from '../lib/gatewayStorage';
import {
  Utensils, Calendar, Clock, Users, User, Phone, Mail,
  CheckCircle2, Sparkles, MapPin, QrCode, Tag, Heart,
  ShieldCheck, LogOut, RefreshCw, Check, Copy, Share2, ArrowRight, LayoutDashboard, Sliders,
  CreditCard, Smartphone, Building2, Info, Image as ImageIcon,
  ChefHat, Flame, Coffee, Store, Layers, X, Sparkle
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
  onUpdateTable?: (table: Table) => void;
  onCancelReservation?: (tableId: string) => void;
  onCancelWaitlist?: (waitlistId: string) => void;
  onSwitchToAdmin?: () => void;
  onSwitchToOwnerDashboard?: () => void;
  onLoginAsRestaurantAdmin?: (email: string, tenant?: RestaurantTenant) => void;
  onLoginAsOwner?: (email: string) => void;
  onUpdateRestaurant?: (updated: RestaurantInfo) => void;
  onLogout?: () => void;
  onRefresh: () => void;
  isDirectCustomerUrl?: boolean;
}

export const CustomerFrontPage: React.FC<CustomerFrontPageProps> = ({
  restaurant,
  user,
  tables,
  waitlist,
  zones,
  onReserveTable,
  onSubmitWalkIn,
  onUpdateTable,
  onCancelReservation,
  onCancelWaitlist,
  onSwitchToAdmin,
  onSwitchToOwnerDashboard,
  onLoginAsRestaurantAdmin,
  onLoginAsOwner,
  onUpdateRestaurant,
  onLogout,
  onRefresh,
  isDirectCustomerUrl = false
}) => {
  // Navigation mode in customer view: 'index_landing', 'portal_manager', or 'booking'
  const [customerViewSection, setCustomerViewSection] = useState<'index_landing' | 'portal_manager' | 'booking'>('index_landing');

  // Reservation Form State
  const [guestName, setGuestName] = useState<string>(user?.name || '');
  const [guestPhone, setGuestPhone] = useState<string>(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState<string>(user?.email || '');
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<string>('Any');
  const [reservationTime, setReservationTime] = useState<string>('07:30 PM');
  const [reservationDate, setReservationDate] = useState<string>('Today');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [isSubmittingReservation, setIsSubmittingReservation] = useState<boolean>(false);
  const [reservationSuccessMsg, setReservationSuccessMsg] = useState<string | null>(null);

  // Walk-In Quick Queue State
  const [walkInName, setWalkInName] = useState<string>(user?.name || '');
  const [walkInPhone, setWalkInPhone] = useState<string>(user?.phone || '');
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2);
  const [walkInType, setWalkInType] = useState<'walkin_immediate' | 'walkin_later'>('walkin_immediate');
  const [walkInNotes, setWalkInNotes] = useState<string>('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);
  const [walkInSuccessMsg, setWalkInSuccessMsg] = useState<string | null>(null);

  // Share booking link state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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

  // Customer booking URL for sharing
  const customerBookingUrl = `${window.location.origin}/reserve`;

  // App Owner Master Payment Gateway Configuration
  const [gatewayConfig, setGatewayConfig] = useState<AppOwnerGatewayConfig>(getAppOwnerGatewayConfig);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customerPaidAdvance, setCustomerPaidAdvance] = useState<boolean>(false);
  const [customerTxnRef, setCustomerTxnRef] = useState<string>('');

  useEffect(() => {
    const handleGatewayUpdated = (e: any) => {
      if (e.detail) setGatewayConfig(e.detail);
    };
    window.addEventListener('smarthost:gateway_updated', handleGatewayUpdated);
    return () => window.removeEventListener('smarthost:gateway_updated', handleGatewayUpdated);
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyBookingUrl = () => {
    navigator.clipboard.writeText(customerBookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = guestName.trim() || user?.name || 'Guest Diner';
    const finalPhone = guestPhone.trim() || user?.phone || '(555) 000-0000';
    const finalEmail = guestEmail.trim() || user?.email || `${finalName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    setIsSubmittingReservation(true);
    try {
      await onReserveTable({
        guestName: finalName,
        guestPhone: finalPhone,
        guestEmail: finalEmail,
        reservationTime: `${reservationDate} • ${reservationTime}`,
        partySize,
        preferredZone: selectedZone,
        notes: specialNotes.trim() || undefined
      });
      setReservationSuccessMsg(`Table reservation confirmed for ${partySize} guests at ${reservationTime}! Confirmation sent to ${finalEmail}.`);
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
    const finalName = walkInName.trim() || guestName.trim() || user?.name || 'Walk-In Guest';
    const finalPhone = walkInPhone.trim() || guestPhone.trim() || user?.phone || '(555) 000-0000';

    setIsSubmittingWalkIn(true);
    try {
      const ticket = await onSubmitWalkIn({
        customerName: finalName,
        phone: finalPhone,
        email: guestEmail.trim() || user?.email,
        partySize: walkInPartySize,
        type: walkInType,
        specialRequests: walkInNotes.trim() || undefined
      });
      setWalkInNotes('');
      setWalkInSuccessMsg(
        ticket
          ? `You have joined the waitlist! Your queue code is #${ticket.confirmationCode}. We will send an SMS when your table is ready.`
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
          {customerViewSection === 'index_landing' && !isDirectCustomerUrl ? (
            /* Index Page Header: Clean App Logo and Name (Managed exclusively from Owner Admin Dashboard) */
            <div className="flex items-center justify-between py-3.5 sm:py-4 gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* App Logo */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold overflow-hidden shrink-0 border border-amber-400/30">
                  {restaurant.logoUrl ? (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>

                {/* App Name and Tagline */}
                <div className="min-w-0">
                  <h1 className="font-extrabold text-base sm:text-xl text-white tracking-tight truncate">
                    {restaurant.name}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-sm sm:max-w-xl">
                    {restaurant.tagline}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Platform
                </span>
              </div>
            </div>
          ) : (
            /* Non-Index Header (Booking / Portal Manager) */
            <div className="flex items-center justify-between py-3.5 gap-3">
              {/* Restaurant Brand */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold overflow-hidden shrink-0 border border-amber-400/30">
                  {restaurant.logoUrl ? (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-base text-white tracking-tight truncate">{restaurant.name}</h1>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">{restaurant.tagline}</p>
                </div>
              </div>

              {/* Right User & Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Share/Copy Booking Link Button */}
                <button
                  onClick={handleCopyBookingUrl}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5"
                  title="Copy Customer Booking Panel Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share Booking Link'}</span>
                </button>

                {user?.name && !isDirectCustomerUrl && (
                  <div className="hidden md:block text-right">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                      <User className="w-3 h-3 text-emerald-400" />
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {user.email}
                    </div>
                  </div>
                )}

                {onSwitchToOwnerDashboard && (
                  <button
                    onClick={onSwitchToOwnerDashboard}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                    title="Open Master App Owner Dashboard"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Owner Dashboard</span>
                  </button>
                )}

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

                {onLogout && !isDirectCustomerUrl && (
                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Front Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Mode Switcher Bar (Only in Booking / Portal Manager sub-views, hidden on Index page) */}
        {!isDirectCustomerUrl && customerViewSection !== 'index_landing' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2 gap-2 shadow-lg">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCustomerViewSection('index_landing')}
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>← Back to Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerViewSection('portal_manager')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  customerViewSection === 'portal_manager'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Customer Portal Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerViewSection('booking')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  customerViewSection === 'booking'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Table / Queue</span>
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 pr-2 font-mono">
              <span>Account:</span>
              <span className="text-amber-400 font-bold">{user?.email || 'Guest'}</span>
            </div>
          </div>
        )}

        {/* Section View Routing */}
        {customerViewSection === 'index_landing' && !isDirectCustomerUrl ? (
          <IndexLandingPage
            restaurant={restaurant}
            user={user}
            tables={tables}
            waitlist={waitlist}
            zones={zones}
            onOpenCustomerBooking={() => setCustomerViewSection('booking')}
            onOpenAdminDesk={onSwitchToAdmin || (() => {})}
            onOpenOwnerDashboard={onSwitchToOwnerDashboard || (() => {})}
            onLoginRestaurantAdmin={onLoginAsRestaurantAdmin}
            onLoginOwnerDashboard={onLoginAsOwner}
          />
        ) : customerViewSection === 'portal_manager' && !isDirectCustomerUrl ? (
          <CustomerPortalManager
            user={user}
            restaurant={restaurant}
            tables={tables}
            waitlist={waitlist}
            zones={zones}
            onUpdateTable={onUpdateTable || (() => {})}
            onCancelReservation={onCancelReservation || (() => {})}
            onCancelWaitlist={onCancelWaitlist || (() => {})}
            onSwitchToAdmin={onSwitchToAdmin}
            onRefresh={onRefresh}
          />
        ) : (
          <>
            {/* Hero Welcome Banner (Clean, without available tables display) */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Online Table Reservation & Walk-In Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Reserve Your Table at {restaurant.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {restaurant.welcomeMessage || 'Instant dining reservations, live table confirmations, and priority digital waitlist queue.'}
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

            {/* Clean Operating Hours & Live Status Banner (No raw tables count exposed) */}
            <div className="flex flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
              <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Status</span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${operatingStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className={`text-xs font-black ${operatingStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {operatingStatus.statusText}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Hours</span>
                <span className="text-xs font-bold text-amber-400 mt-1 block">{restaurant.operatingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert Banners */}
        {reservationSuccessMsg && (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 text-emerald-200 flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{reservationSuccessMsg}</span>
            </div>
            <button
              onClick={() => setReservationSuccessMsg(null)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 bg-emerald-500/30 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}

        {walkInSuccessMsg && (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 text-emerald-200 flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{walkInSuccessMsg}</span>
            </div>
            <button
              onClick={() => setWalkInSuccessMsg(null)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 bg-emerald-500/30 rounded-lg"
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
                  Select your party size, date, and preferred dining time for instant booking.
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
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
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

              {/* Guest Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-amber-400" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3 text-amber-400" /> Phone (for SMS) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3 text-amber-400" /> Email (for Confirmation) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
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

              {/* Google Pay & UPI Payment Gateway for Booking (Configured by App Owner) */}
              <div className="bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-4 space-y-3 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Table Guarantee & Google Pay Gateway
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {gatewayConfig.depositInstructions || 'Advance payment / bill settlement accepted via Google Pay, UPI & Bank Transfer'}
                      </span>
                    </div>
                  </div>
                  {gatewayConfig.enableBookingDeposit && (
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                      ₹{gatewayConfig.depositAmountINR} Deposit
                    </span>
                  )}
                </div>

                {/* Gateway Credentials Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Google Pay / UPI ID</span>
                      <span className="text-xs font-bold text-amber-400 font-mono truncate block">{gatewayConfig.upiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(gatewayConfig.upiId, 'upi')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">GPay Mobile Number</span>
                      <span className="text-xs font-bold text-slate-200 font-mono truncate block">{gatewayConfig.gpayNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(gatewayConfig.gpayNumber, 'gpay')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                      title="Copy GPay Number"
                    >
                      {copiedKey === 'gpay' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Optional Payment Reference Input */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paid via GPay? Enter UTR / Transaction Reference (Optional)"
                    value={customerTxnRef}
                    onChange={(e) => setCustomerTxnRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Confirm Booking Button */}
              <button
                type="submit"
                disabled={isSubmittingReservation}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
                        {sz} pax
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Guest Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Arrival Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkInType('walkin_immediate')}
                      className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                        walkInType === 'walkin_immediate'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
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
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
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
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
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
        </>
      )}

      </main>

      {/* Branded Customer View Footer */}
      {customerViewSection !== 'index_landing' && (
        <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-8 text-slate-400 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold overflow-hidden shadow-md shrink-0 border border-amber-400/30">
                  {restaurant.logoUrl ? (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-4 h-4 text-slate-950" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">{restaurant.name}</span>
                  <p className="text-[11px] text-slate-500">
                    {restaurant.address} • {restaurant.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setCustomerViewSection('index_landing')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Home & Overview
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerViewSection('portal_manager')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  My Reservations
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerViewSection('booking')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Book Table
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
};


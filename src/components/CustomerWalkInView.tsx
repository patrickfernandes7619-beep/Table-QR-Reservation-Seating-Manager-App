import React, { useState, useEffect } from 'react';
import { RestaurantInfo, WaitlistEntry } from '../types';
import { generateQrDataUrl } from '../lib/qrUtils';
import {
  Smartphone, Users, Clock, CheckCircle2, Utensils,
  Phone, ShieldCheck, QrCode, Copy, Check, ExternalLink, Camera,
  User, Mail, ChevronRight, Sparkles, ArrowRight, ArrowLeft
} from 'lucide-react';

interface CustomerWalkInViewProps {
  restaurant: RestaurantInfo;
  onSubmitWalkIn: (data: {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    type: 'walkin_immediate' | 'walkin_later';
  }) => Promise<WaitlistEntry | null>;
  activeCustomerTicket: WaitlistEntry | null;
  onClearTicket: () => void;
}

export const CustomerWalkInView: React.FC<CustomerWalkInViewProps> = ({
  restaurant,
  onSubmitWalkIn,
  activeCustomerTicket,
  onClearTicket
}) => {
  // Counter QR Code state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showFullQrModal, setShowFullQrModal] = useState<boolean>(false);

  // Walk-In Form State
  const [partySize, setPartySize] = useState<number>(2);
  const [bookingType, setBookingType] = useState<'walkin_immediate' | 'walkin_later'>('walkin_immediate');
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live mobile booking URL encoded into the QR code
  const walkInUrl = `${window.location.origin}?mode=customer&scan=true`;

  // Determine if viewing as scanned customer or counter stand
  const [isScannedView, setIsScannedView] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('scan') === 'true';
  });

  const [redirectCount, setRedirectCount] = useState<number | null>(null);

  const returnToCounterView = () => {
    setIsScannedView(false);
    setRedirectCount(null);
    onClearTicket();
    if (window.location.search.includes('scan=true')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('scan');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  useEffect(() => {
    if (redirectCount === null) return;
    if (redirectCount <= 0) {
      returnToCounterView();
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCount((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCount]);

  useEffect(() => {
    async function loadQr() {
      const url = await generateQrDataUrl(walkInUrl, '#0f172a', '#ffffff');
      setQrDataUrl(url);
    }
    loadQr();
  }, [walkInUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(walkInUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) {
      alert('Please enter your name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitWalkIn({
        customerName,
        phone,
        email: email || undefined,
        partySize,
        type: bookingType
      });
      // Reset form fields after successful check-in
      setCustomerName('');
      setPhone('');
      setEmail('');

      // Start 4-second countdown to automatically redirect back to counter QR view
      setRedirectCount(4);
    } catch (err) {
      console.error('Walk-in registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 space-y-8">
      
      {/* COUNTER DISPLAY MODE: SHOW ONLY QR CODE SCAN STAND */}
      {!isScannedView ? (
        <div className="space-y-6">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40">
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest flex items-center gap-1 shadow">
              <Camera className="w-3.5 h-3.5" /> Counter QR Code
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* High-Resolution QR Code Stand Frame */}
              <div 
                className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-slate-800 text-center shrink-0 group relative cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => setShowFullQrModal(true)}
              >
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan QR Code to Check In" className="w-48 h-48 mx-auto rounded-xl" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xs">
                    Generating QR...
                  </div>
                )}
                <div className="mt-2 text-[11px] font-extrabold font-mono text-slate-800 flex items-center justify-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" /> TAP TO ENLARGE
                </div>
              </div>

              {/* Instructions and Guidance */}
              <div className="space-y-4 text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-1.5 rounded-full">
                  <Smartphone className="w-4 h-4" />
                  Scan at Counter with Phone Camera
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Scan QR Code to Check In
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  Guests at the reception counter can scan this QR code with their mobile phone camera to open the walk-in check-in form directly on their device.
                </p>

                {/* Step-by-step guidance pill */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">1</span>
                    <span className="font-medium">Open Phone Camera</span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">2</span>
                    <span className="font-medium">Scan Counter QR</span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">3</span>
                    <span className="font-medium">Fill Form on Phone</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                  <button
                    onClick={() => setIsScannedView(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    Simulate QR Scan (Open Form)
                  </button>

                  <a
                    href={walkInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Mobile Tab
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </button>

                  <button
                    onClick={() => setShowFullQrModal(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow transition"
                  >
                    <QrCode className="w-4 h-4" />
                    Fullscreen Stand View
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      ) : (
        /* SCANNED MOBILE FORM VIEW (APPEARS WHEN CUSTOMER SCANS QR CODE) */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4">
            <button
              onClick={returnToCounterView}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Counter QR View
            </button>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Scanned via Counter QR
            </span>
          </div>

          {/* Auto Redirect Banner after form submission */}
          {redirectCount !== null && (
            <div className="max-w-xl mx-auto bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 p-4 rounded-2xl font-bold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Form Submitted! Returning to Counter QR View in <strong className="text-white text-base font-black px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-lg">{redirectCount}s</strong></span>
              </div>
              <button
                onClick={returnToCounterView}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shrink-0 shadow"
              >
                Return Now
              </button>
            </div>
          )}

          {activeCustomerTicket ? (
            /* ACTIVE TICKET PASS IF GUEST IS CHECKED IN */
            <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100">
                <div className="bg-slate-950 py-3 text-center text-[10px] text-slate-400 font-mono tracking-widest uppercase border-b border-slate-800 flex items-center justify-between px-6">
                  <span>Active Customer Queue Ticket</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4 relative">
                    <div className="text-xs uppercase font-bold text-slate-400">Confirmation Code</div>
                    <div className="text-4xl font-black text-amber-400 tracking-wider font-mono">
                      {activeCustomerTicket.confirmationCode}
                    </div>

                    {activeCustomerTicket.status === 'notified' || activeCustomerTicket.assignedTableNumber ? (
                      <div className="bg-emerald-500 text-slate-950 font-black p-3.5 rounded-xl shadow text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Table {activeCustomerTicket.assignedTableNumber || 'Ready'} is Ready!
                      </div>
                    ) : (
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-spin" />
                        <div>Estimated Wait Time</div>
                        <div className="text-2xl font-black text-amber-400">~{activeCustomerTicket.estimatedWaitMinutes} mins</div>
                        <p className="text-[11px] text-slate-400">We will send an SMS when your table is ready</p>
                      </div>
                    )}

                    <div className="text-xs text-slate-300 pt-3 border-t border-amber-500/20 text-left space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Guest Name:</span>
                        <strong className="text-white">{activeCustomerTicket.customerName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Party Size:</span>
                        <strong className="text-white">{activeCustomerTicket.partySize} Guests</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone Number:</span>
                        <strong className="text-white">{activeCustomerTicket.phone}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={returnToCounterView}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-xl text-xs transition"
                  >
                    Done / Return to Counter QR View
                  </button>
                </div>

                <div className="bg-slate-950 p-3 text-center border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {restaurant.name} Reception Kiosk
                </div>
              </div>
            </div>
          ) : (
            /* WALK-IN CHECK-IN FORM (APPEARS ONLY AFTER SCANNING) */
            <div className="max-w-xl mx-auto bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Guest Walk-In Check-In Form</h3>
                    <p className="text-xs text-slate-400">Enter details to join the live waitlist</p>
                  </div>
                </div>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Self Check-In
                </span>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* Party Size Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Number of Guests *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPartySize(num)}
                        className={`h-11 rounded-xl text-xs font-extrabold transition ${
                          partySize === num
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {num}{num === 10 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Seating Time</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingType('walkin_immediate')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition flex flex-col justify-between ${
                        bookingType === 'walkin_immediate'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-extrabold text-white text-sm">Seat Me Now</span>
                      <span className="text-[10px] text-slate-400 mt-1">Immediate Walk-In Queue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingType('walkin_later')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition flex flex-col justify-between ${
                        bookingType === 'walkin_later'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-extrabold text-white text-sm">Reserve Later</span>
                      <span className="text-[10px] text-slate-400 mt-1">For later today/tonight</span>
                    </button>
                  </div>
                </div>

                {/* Guest Contact Details */}
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Connor"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" /> Mobile Phone (for SMS notifications) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="sarah@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !customerName || !phone}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-95"
                >
                  {isSubmitting ? (
                    <span>Registering Walk-In...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Walk-In Check-In
                    </>
                  )}
                </button>

              </form>
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN QR CODE COUNTER STAND MODAL */}
      {showFullQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowFullQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-bold text-lg"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">
                Counter Scan Kiosk
              </span>
              <h3 className="text-xl font-black">{restaurant.name}</h3>
              <p className="text-xs text-slate-500">Scan to check in for a table on smartphone</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Walk-In QR Code" className="w-56 h-56 mx-auto rounded-xl shadow-md" />
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <p className="flex items-center justify-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Point phone camera to open self check-in
              </p>
            </div>

            <button
              onClick={() => setShowFullQrModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition"
            >
              Close Counter Stand
            </button>
          </div>
        </div>
      )}

    </div>
  );
};



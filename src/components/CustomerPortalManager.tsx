import React, { useState } from 'react';
import { Table, WaitlistEntry, RestaurantInfo, UserSession } from '../types';
import { generateQrDataUrl } from '../lib/qrUtils';
import {
  QrCode, Calendar, Clock, Users, User, Phone, Mail, Edit3, Trash2, CheckCircle2,
  AlertCircle, Sparkles, Sliders, Armchair, ShieldCheck, Download, Printer, ExternalLink, RefreshCw, X, Save
} from 'lucide-react';

interface CustomerPortalManagerProps {
  user: UserSession;
  restaurant: RestaurantInfo;
  tables: Table[];
  waitlist: WaitlistEntry[];
  zones: string[];
  onUpdateTable: (table: Table) => void;
  onCancelReservation: (tableId: string) => void;
  onCancelWaitlist: (waitlistId: string) => void;
  onSwitchToAdmin?: () => void;
  onRefresh: () => void;
}

export const CustomerPortalManager: React.FC<CustomerPortalManagerProps> = ({
  user,
  restaurant,
  tables,
  waitlist,
  zones,
  onUpdateTable,
  onCancelReservation,
  onCancelWaitlist,
  onSwitchToAdmin,
  onRefresh
}) => {
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = user.name || 'Valued Guest';

  // Sub-tabs in Customer Portal
  const [activeTab, setActiveTab] = useState<'my_bookings' | 'qr_seating' | 'quick_book'>('my_bookings');

  // Filter bookings and waitlist entries matching this customer's email or phone
  const myReservedTables = tables.filter(t => 
    t.status === 'reserved' && (
      (t.guestEmail && t.guestEmail.toLowerCase().trim() === userEmail) ||
      (t.currentGuestName && t.currentGuestName.toLowerCase().includes(userName.toLowerCase()))
    )
  );

  const myWaitlistEntries = waitlist.filter(w => 
    (w.status === 'waiting' || w.status === 'notified') && (
      (w.email && w.email.toLowerCase().trim() === userEmail) ||
      (w.customerName && w.customerName.toLowerCase().includes(userName.toLowerCase()))
    )
  );

  // QR Customizer State for Customer
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(tables[0] || null);
  const [qrStandTitle, setQrStandTitle] = useState(`${restaurant.name} Table Seating`);
  const [qrStandSubtitle, setQrStandSubtitle] = useState('Scan to reserve this table or check dining menu');
  const [qrPrimaryColor, setQrPrimaryColor] = useState('#1e293b');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // Edit Table Seating Modal (for customer to customize preferred seating or notes)
  const [editingBookingTable, setEditingBookingTable] = useState<Table | null>(null);
  const [editGuestName, setEditGuestName] = useState<string>('');
  const [editGuestPhone, setEditGuestPhone] = useState<string>('');
  const [editPartySize, setEditPartySize] = useState<number>(2);
  const [editReservationTime, setEditReservationTime] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSavedToast, setEditSavedToast] = useState<string | null>(null);

  // QR Generation Effect
  React.useEffect(() => {
    async function makeQr() {
      setIsGeneratingQr(true);
      const targetUrl = selectedTableForQr 
        ? `${window.location.origin}/reserve?table=${selectedTableForQr.number}&email=${encodeURIComponent(userEmail)}`
        : `${window.location.origin}/reserve?email=${encodeURIComponent(userEmail)}`;
      const url = await generateQrDataUrl(targetUrl, qrPrimaryColor, '#ffffff');
      setQrDataUrl(url);
      setIsGeneratingQr(false);
    }
    makeQr();
  }, [selectedTableForQr, qrPrimaryColor, userEmail]);

  const handleOpenEditBooking = (table: Table) => {
    setEditingBookingTable(table);
    setEditGuestName(table.currentGuestName || userName);
    setEditGuestPhone(table.guestPhone || user.phone || '');
    setEditPartySize(table.currentPartySize || table.capacity || 2);
    setEditReservationTime(table.reservationTime || '07:30 PM');
    setEditNotes(table.notes || '');
  };

  const handleSaveBookingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookingTable) return;

    const updatedTable: Table = {
      ...editingBookingTable,
      currentGuestName: editGuestName.trim(),
      guestPhone: editGuestPhone.trim(),
      currentPartySize: editPartySize,
      reservationTime: editReservationTime,
      notes: editNotes.trim()
    };

    onUpdateTable(updatedTable);
    setEditingBookingTable(null);
    setEditSavedToast(`Table #${updatedTable.number} reservation updated successfully!`);
    setTimeout(() => setEditSavedToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Customer Status & Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Portal & Seating Manager Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {userName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Logged in as <strong className="text-amber-400 font-mono">{userEmail}</strong>. Modify your reservations, customize your table QR stands, or manage seating preferences below.
            </p>
          </div>

          {/* Quick Stats / Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Restaurant Admin Desk
              </button>
            )}
            <button
              onClick={onRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition"
              title="Refresh Bookings"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'my_bookings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            My Bookings & Reservations ({myReservedTables.length + myWaitlistEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('qr_seating')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'qr_seating'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Modify QR Seating & Printable Stands
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {editSavedToast && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{editSavedToast}</span>
          </div>
          <button onClick={() => setEditSavedToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB 1: MY BOOKINGS & RESERVATIONS */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-6">
          
          {/* Active Reserved Tables */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Your Table Reservations
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bookings matching {userEmail}
                </p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
                {myReservedTables.length} Active
              </span>
            </div>

            {myReservedTables.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                <Armchair className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No active table reservations under {userEmail}</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Reserve a table using the form below to see your live table status and customize your seating.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReservedTables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 shadow-lg space-y-3 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {table.zone || 'Main Dining'}
                        </span>
                        <h4 className="text-lg font-black text-white mt-1">Table #{table.number}</h4>
                      </div>
                      <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow">
                        {table.reservationTime || 'Reserved'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2 border-y border-slate-900 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Guest Name</span>
                        <span className="font-bold text-white">{table.currentGuestName || userName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Party Size</span>
                        <span className="font-bold text-amber-400">{table.currentPartySize || table.capacity} Guests</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Phone</span>
                        <span>{table.guestPhone || user.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Email</span>
                        <span className="truncate block">{table.guestEmail || userEmail}</span>
                      </div>
                    </div>

                    {table.notes && (
                      <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-amber-400 font-semibold">Special Requests:</span> {table.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEditBooking(table)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Modify Reservation
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Cancel reservation for Table #${table.number}?`)) {
                            onCancelReservation(table.id);
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Waitlist Entries */}
          {myWaitlistEntries.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Live Waitlist Queues
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your active digital waitlist tickets
                  </p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
                  {myWaitlistEntries.length} In Queue
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myWaitlistEntries.map((w) => (
                  <div
                    key={w.id}
                    className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Ticket #{w.confirmationCode}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{w.customerName}</h4>
                      </div>
                      <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full">
                        {w.status === 'notified' ? 'Table Ready!' : 'Waiting in Queue'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2 border-y border-slate-900 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Party Size</span>
                        <span className="font-bold text-white">{w.partySize} Guests</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Est. Wait</span>
                        <span className="font-bold text-emerald-400">~{w.estimatedWaitMinutes} mins</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('Cancel your waitlist queue spot?')) {
                          onCancelWaitlist(w.id);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold transition"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MODIFY QR SEATING & PRINTABLE STANDS */}
      {activeTab === 'qr_seating' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                QR Seating Stand Designer & Modifier
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize your table QR signs for direct customer self-checkin, table reservations, and digital waitlists.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Controls Column */}
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Select Table to Generate QR For</label>
                  <select
                    value={selectedTableForQr?.id || ''}
                    onChange={(e) => {
                      const t = tables.find(tbl => tbl.id === e.target.value);
                      setSelectedTableForQr(t || null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Tables / Reception Stand (General Booking)</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table #{t.number} ({t.zone} - {t.capacity} seats) - Status: {t.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Stand Display Header</label>
                  <input
                    type="text"
                    value={qrStandTitle}
                    onChange={(e) => setQrStandTitle(e.target.value)}
                    placeholder="e.g. Reserve This Table"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Instructions Subtitle</label>
                  <input
                    type="text"
                    value={qrStandSubtitle}
                    onChange={(e) => setQrStandSubtitle(e.target.value)}
                    placeholder="e.g. Scan with your phone camera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">QR Code Accent Color</label>
                  <div className="flex items-center gap-3">
                    {['#1e293b', '#0f172a', '#d97706', '#059669', '#2563eb'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setQrPrimaryColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          qrPrimaryColor === color ? 'border-amber-400 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    Print Table QR Stand
                  </button>

                  <a
                    href={qrDataUrl}
                    download={`table-qr-${selectedTableForQr ? selectedTableForQr.number : 'stand'}.png`}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition text-center"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </a>
                </div>

              </div>

              {/* QR Stand Preview Card */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800">
                <div className="w-full max-w-xs bg-white text-slate-900 rounded-2xl p-6 shadow-2xl text-center space-y-4 border-4 border-amber-500">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                      {restaurant.name}
                    </span>
                    <h4 className="text-base font-black text-slate-900 leading-tight">
                      {qrStandTitle}
                    </h4>
                    {selectedTableForQr && (
                      <div className="inline-block bg-slate-900 text-amber-400 text-xs font-black px-3 py-1 rounded-full mt-1">
                        Table #{selectedTableForQr.number} ({selectedTableForQr.zone})
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200 inline-block shadow-inner">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Table QR" className="w-44 h-44 mx-auto object-contain" />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {qrStandSubtitle}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBookingTable && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Modify Reservation</h3>
                <p className="text-xs text-amber-400">Table #{editingBookingTable.number} ({editingBookingTable.zone})</p>
              </div>
              <button
                onClick={() => setEditingBookingTable(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Guest Name</label>
                <input
                  type="text"
                  required
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  value={editGuestPhone}
                  onChange={(e) => setEditGuestPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editPartySize}
                    onChange={(e) => setEditPartySize(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Time Slot</label>
                  <input
                    type="text"
                    value={editReservationTime}
                    onChange={(e) => setEditReservationTime(e.target.value)}
                    placeholder="e.g. 07:30 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Special Notes / Requests</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBookingTable(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

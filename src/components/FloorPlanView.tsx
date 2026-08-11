import React, { useState } from 'react';
import { Table, TableStatus, WaitlistEntry } from '../types';
import { Users, Clock, Sparkles, CheckCircle2, UserCheck, AlertCircle, RefreshCw, QrCode, Filter, Plus, Layers, Trash2, Settings, Armchair, Calendar, Phone, Mail, User } from 'lucide-react';

interface FloorPlanViewProps {
  tables: Table[];
  waitlist: WaitlistEntry[];
  zones?: string[];
  onUpdateTableStatus: (tableId: string, status: TableStatus, guestName?: string, partySize?: number) => void;
  onSeatWaitlistGuest: (waitlistId: string, tableId: string) => void;
  onOpenAiSuggest: (partySize?: number) => void;
  onSelectTableForQr: (table: Table) => void;
  onAddTableClick: (defaultZone?: string) => void;
  onOpenReserveModal?: (tableId?: string) => void;
  onEditTableClick?: (table: Table) => void;
  onDeleteTable?: (tableId: string) => void;
  onOpenManageZones?: () => void;
}

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  tables,
  waitlist,
  zones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'],
  onUpdateTableStatus,
  onSeatWaitlistGuest,
  onOpenAiSuggest,
  onSelectTableForQr,
  onAddTableClick,
  onOpenReserveModal,
  onEditTableClick,
  onDeleteTable,
  onOpenManageZones
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [activeTableModal, setActiveTableModal] = useState<Table | null>(null);
  const [selectedWaitlistId, setSelectedWaitlistId] = useState<string>('');
  const [confirmDeleteTableId, setConfirmDeleteTableId] = useState<string | null>(null);

  const zoneTabs = ['All', ...Array.from(new Set(zones.map(z => z.trim()).filter(Boolean)))];

  const filteredTables = selectedZone === 'All' 
    ? tables 
    : tables.filter(t => t.zone && t.zone.trim().toLowerCase() === selectedZone.trim().toLowerCase());

  // Status counts
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  const cleaningCount = tables.filter(t => t.status === 'cleaning').length;

  const reservedTables = tables.filter(t => t.status === 'reserved');

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 hover:border-emerald-500 shadow-emerald-500/10';
      case 'occupied':
        return 'bg-rose-500/10 border-rose-500/40 text-rose-700 hover:border-rose-500 shadow-rose-500/10';
      case 'reserved':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-700 hover:border-amber-500 shadow-amber-500/10';
      case 'cleaning':
        return 'bg-purple-500/10 border-purple-500/40 text-purple-700 hover:border-purple-500 shadow-purple-500/10';
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Available</span>;
      case 'occupied':
        return <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Occupied</span>;
      case 'reserved':
        return <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Reserved</span>;
      case 'cleaning':
        return <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Cleaning</span>;
    }
  };

  // Helper to calculate seated time string
  const getSeatedTime = (seatedAtISO?: string) => {
    if (!seatedAtISO) return null;
    const diffMs = Date.now() - new Date(seatedAtISO).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  // Active waiting guests
  const waitingGuests = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified');

  return (
    <div className="space-y-6">
      
      {/* Top Quick Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Tables</div>
            <div className="text-xl font-extrabold text-white">{tables.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-emerald-400">Available</div>
            <div className="text-xl font-extrabold text-emerald-400">{availableCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {Math.round((availableCount / (tables.length || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-rose-400">Occupied</div>
            <div className="text-xl font-extrabold text-rose-400">{occupiedCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
            {Math.round((occupiedCount / (tables.length || 1)) * 100)}%
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-amber-400">Reserved</div>
            <div className="text-xl font-extrabold text-amber-400">{reservedCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-purple-500/20 rounded-xl p-3.5 flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <div className="text-[11px] font-medium text-purple-400">Cleaning</div>
            <div className="text-xl font-extrabold text-purple-400">{cleaningCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Gemini AI Smart Seating Assistant
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-semibold">
                Live Host Helper
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically matches walk-in guest party sizes to available tables and calculates accurate turnover times.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onOpenAiSuggest()}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            AI Table Matcher
          </button>
        </div>
      </div>

      {/* Zone Selector & Floor Map Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Section:</span>
          {zoneTabs.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                selectedZone === zone
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenReserveModal && (
            <button
              onClick={() => onOpenReserveModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <Calendar className="w-4 h-4" />
              Reserve Table
            </button>
          )}

          {onOpenManageZones && (
            <button
              onClick={onOpenManageZones}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4" />
              Manage Sections
            </button>
          )}

          <button
            onClick={() => onAddTableClick(selectedZone === 'All' ? undefined : selectedZone)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Reserved Tables Front Panel Ticker */}
      {reservedTables.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Front Panel Reserved Tables ({reservedTables.length})
            </h3>
            <span className="text-[10px] text-amber-300/80 font-mono">Live Display</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reservedTables.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTableModal(t)}
                className="bg-slate-950/80 hover:bg-slate-900 border border-amber-500/40 rounded-xl p-3 text-xs space-y-1.5 cursor-pointer transition shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-300">Table #{t.number} ({t.zone})</span>
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {t.reservationTime || 'Reserved'}
                  </span>
                </div>

                <div className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  {t.currentGuestName || 'Reserved Guest'}
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-3 flex-wrap">
                  {t.guestPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {t.guestPhone}
                    </span>
                  )}
                  {t.guestEmail && (
                    <span className="flex items-center gap-1 truncate max-w-[160px]" title={t.guestEmail}>
                      <Mail className="w-3 h-3 text-slate-400" />
                      {t.guestEmail}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Floor Plan Map Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden min-h-[460px] shadow-2xl">
        {/* Floor Plan Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

        {/* Section Label Overlay */}
        <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          {selectedZone === 'All' ? 'Full Restaurant Layout' : `${selectedZone} Section`}
        </div>

        {/* Floor Map Interactive Grid / Cards */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-8">
            {filteredTables.map((table) => {
              const seatedTime = getSeatedTime(table.seatedAt);

              return (
                <div
                  key={table.id}
                  onClick={() => setActiveTableModal(table)}
                  className={`relative group cursor-pointer border rounded-2xl p-4 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${getStatusColor(
                    table.status
                  )} ${table.status === 'occupied' ? 'ring-2 ring-rose-500/30' : ''}`}
                >
                  {/* Top Number & Capacity */}
                  <div className="flex items-start justify-between">
                    <div className="font-extrabold text-base tracking-tight text-slate-100 flex items-center gap-1">
                      {table.number}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                      <Users className="w-3 h-3 text-slate-400" />
                      {table.capacity}
                    </div>
                  </div>

                  {/* Table Shape Icon Representation */}
                  <div className="my-3 flex flex-col items-center justify-center">
                    <div
                      className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition ${
                        table.status === 'available'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                          : table.status === 'occupied'
                          ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                          : table.status === 'reserved'
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                          : 'border-purple-500/60 bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{table.shape.slice(0, 3)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{table.zone.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Bottom Details & Guest Tag */}
                  <div className="mt-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      {getStatusBadge(table.status)}
                      {seatedTime && (
                        <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {seatedTime}
                        </span>
                      )}
                    </div>

                    {table.currentGuestName ? (
                      <div className="text-xs font-semibold text-slate-200 truncate mt-1">
                        {table.currentGuestName} ({table.currentPartySize || table.capacity}p)
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 truncate mt-1">{table.name}</div>
                    )}
                  </div>

                  {/* Hover overlay indicator */}
                  <div className="absolute inset-0 bg-slate-950/80 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2 text-center text-xs font-bold text-white backdrop-blur-[2px]">
                    Manage Table #{table.number}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 my-4 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Armchair className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-slate-200">No tables configured in {selectedZone} section.</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Add your first table to the {selectedZone} section to configure seating and QR codes.
            </p>
            <button
              onClick={() => onAddTableClick(selectedZone === 'All' ? undefined : selectedZone)}
              className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" />
              Add Table to {selectedZone === 'All' ? 'Layout' : selectedZone}
            </button>
          </div>
        )}
      </div>

      {/* Table Detail & Action Modal */}
      {activeTableModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{activeTableModal.number}</span>
                  {getStatusBadge(activeTableModal.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTableModal.name} • {activeTableModal.zone} • Capacity: {activeTableModal.capacity} guests
                </p>
              </div>

              <button
                onClick={() => setActiveTableModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Current Guest Information if Occupied */}
            {activeTableModal.status === 'occupied' && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                  <span>Currently Seated</span>
                  <span className="font-mono text-xs">
                    Seated {getSeatedTime(activeTableModal.seatedAt) || 'Just now'}
                  </span>
                </div>
                <div className="text-base font-bold text-white">
                  {activeTableModal.currentGuestName || 'Walk-In Guest'}
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  Party Size: {activeTableModal.currentPartySize || activeTableModal.capacity} people
                </div>
              </div>
            )}

            {/* Current Reservation Details if Reserved */}
            {activeTableModal.status === 'reserved' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Table Reserved</span>
                  <span className="font-mono text-xs font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                    {activeTableModal.reservationTime || 'Reserved'}
                  </span>
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  {activeTableModal.currentGuestName || 'Reserved Guest'}
                </div>
                <div className="text-xs text-slate-300 space-y-1 pt-1">
                  {activeTableModal.guestPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeTableModal.guestPhone}</span>
                    </div>
                  )}
                  {activeTableModal.guestEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeTableModal.guestEmail}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdateTableStatus(
                        activeTableModal.id,
                        'occupied',
                        activeTableModal.currentGuestName,
                        activeTableModal.currentPartySize || activeTableModal.capacity
                      );
                      setActiveTableModal(null);
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition"
                  >
                    Seat Reserved Party Now
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTableStatus(activeTableModal.id, 'available');
                      setActiveTableModal(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition"
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            )}

            {/* Action 1: Seat Guest from Waitlist directly */}
            {activeTableModal.status === 'available' && waitingGuests.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Seat Waiting Customer Now
                </h4>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedWaitlistId}
                    onChange={(e) => setSelectedWaitlistId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Guest in Waitlist --</option>
                    {waitingGuests.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.customerName} ({w.partySize}p) - Waiting {w.estimatedWaitMinutes}m
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!selectedWaitlistId}
                    onClick={() => {
                      if (selectedWaitlistId) {
                        onSeatWaitlistGuest(selectedWaitlistId, activeTableModal.id);
                        setActiveTableModal(null);
                        setSelectedWaitlistId('');
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition"
                  >
                    Seat Guest
                  </button>
                </div>
              </div>
            )}

            {/* Action 2: Change Table Status Buttons */}
            <div>
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quick Status Change</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onUpdateTableStatus(activeTableModal.id, 'available');
                    setActiveTableModal(null);
                  }}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Available
                </button>

                <button
                  onClick={() => {
                    const guestName = prompt('Enter guest or party name:', 'Walk-In Customer');
                    const party = prompt('Enter party size:', String(activeTableModal.capacity));
                    if (guestName) {
                      onUpdateTableStatus(
                        activeTableModal.id,
                        'occupied',
                        guestName,
                        party ? parseInt(party) : activeTableModal.capacity
                      );
                      setActiveTableModal(null);
                    }
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Occupy / Manual Walk-In
                </button>

                <button
                  onClick={() => {
                    const guestName = prompt('Enter reservation name:', 'Reserved Guest');
                    if (guestName) {
                      onUpdateTableStatus(activeTableModal.id, 'reserved', guestName);
                      setActiveTableModal(null);
                    }
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Reserve Table
                </button>

                <button
                  onClick={() => {
                    onUpdateTableStatus(activeTableModal.id, 'cleaning');
                    setActiveTableModal(null);
                  }}
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Needs Cleaning
                </button>
              </div>
            </div>

            {/* Table QR Code Shortcut & Delete Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onSelectTableForQr(activeTableModal);
                    setActiveTableModal(null);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  Table QR
                </button>

                {onEditTableClick && (
                  <button
                    onClick={() => {
                      const t = activeTableModal;
                      setActiveTableModal(null);
                      onEditTableClick(t);
                    }}
                    className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Configure
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onDeleteTable && (
                  confirmDeleteTableId === activeTableModal.id ? (
                    <button
                      onClick={() => {
                        onDeleteTable(activeTableModal.id);
                        setConfirmDeleteTableId(null);
                        setActiveTableModal(null);
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition animate-pulse"
                    >
                      Confirm Delete Table
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteTableId(activeTableModal.id)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Table
                    </button>
                  )
                )}

                <button
                  onClick={() => {
                    setConfirmDeleteTableId(null);
                    setActiveTableModal(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

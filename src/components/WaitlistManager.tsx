import React, { useState } from 'react';
import { WaitlistEntry, Table, TableStatus } from '../types';
import { Search, Plus, Bell, UserCheck, XCircle, Sparkles, Clock, Phone, Mail, Users, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

interface WaitlistManagerProps {
  waitlist: WaitlistEntry[];
  tables: Table[];
  onUpdateWaitlistStatus: (id: string, status: WaitlistEntry['status'], tableId?: string) => void;
  onOpenNewWalkinModal: () => void;
  onOpenAiSuggest: (partySize: number, preferredZone?: string, guestName?: string) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  waitlist,
  tables,
  onUpdateWaitlistStatus,
  onOpenNewWalkinModal,
  onOpenAiSuggest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'notified' | 'seated' | 'cancelled'>('waiting');
  const [selectedTableForSeating, setSelectedTableForSeating] = useState<{ [id: string]: string }>({});

  const availableTables = tables.filter(t => t.status === 'available');

  const filteredWaitlist = waitlist.filter(item => {
    const matchesSearch = item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.phone.includes(searchTerm) ||
                          item.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'waiting') return matchesSearch && (item.status === 'waiting' || item.status === 'notified');
    return matchesSearch && item.status === statusFilter;
  });

  const waitingCount = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length;

  const getStatusBadge = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'waiting':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Waiting in Line</span>;
      case 'notified':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><Bell className="w-3 h-3" /> SMS Notified - Ready</span>;
      case 'seated':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Seated at Table</span>;
      case 'cancelled':
        return <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'completed':
        return <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
    }
  };

  const getWaitTimeElapsed = (createdAtISO: string) => {
    const diffMs = Date.now() - new Date(createdAtISO).getTime();
    const mins = Math.floor(diffMs / 60000);
    return `${mins} mins ago`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & New Walk-In Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Walk-In & Waitlist Management</h2>
            <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
              {waitingCount} Active Queue
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time digital waitlist. Customers check in via Reception Desk QR Code or Host Stand manual entry.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenNewWalkinModal}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Manual Walk-In
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, phone, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['waiting', 'notified', 'seated', 'cancelled', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Waitlist Entries Grid */}
      <div className="space-y-3">
        {filteredWaitlist.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold flex items-center justify-center text-lg shrink-0">
                  {item.partySize}p
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">{item.customerName}</h3>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      Code: {item.confirmationCode}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {item.phone}
                    </span>
                    {item.preferredZone && (
                      <span className="bg-slate-800 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Prefers: {item.preferredZone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Checked in {getWaitTimeElapsed(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests Tag */}
              {item.specialRequests && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-medium max-w-xs">
                  <strong>Notes:</strong> {item.specialRequests}
                </div>
              )}
            </div>

            {/* Actions Bar for Active Queue Items */}
            {(item.status === 'waiting' || item.status === 'notified') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                
                {/* Left: AI Smart Seating Suggestion trigger */}
                <button
                  onClick={() => onOpenAiSuggest(item.partySize, item.preferredZone, item.customerName)}
                  className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Auto-Match Table
                </button>

                {/* Right: Table Selector & Seat / Notify Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTableForSeating[item.id] || ''}
                    onChange={(e) =>
                      setSelectedTableForSeating({ ...selectedTableForSeating, [item.id]: e.target.value })
                    }
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 min-w-[160px]"
                  >
                    <option value="">-- Assign Table ({availableTables.length} avail) --</option>
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} ({t.zone}) - Cap: {t.capacity}
                      </option>
                    ))}
                  </select>

                  {item.status === 'waiting' && (
                    <button
                      onClick={() => onUpdateWaitlistStatus(item.id, 'notified')}
                      className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition"
                      title="Send simulated SMS notification that table is ready"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Notify SMS
                    </button>
                  )}

                  <button
                    disabled={!selectedTableForSeating[item.id]}
                    onClick={() => {
                      const tId = selectedTableForSeating[item.id];
                      if (tId) {
                        onUpdateWaitlistStatus(item.id, 'seated', tId);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Seat Guest
                  </button>

                  <button
                    onClick={() => onUpdateWaitlistStatus(item.id, 'cancelled')}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="Cancel Walk-In"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* If Already Seated */}
            {item.status === 'seated' && item.assignedTableNumber && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Seated at Table {item.assignedTableNumber}
              </div>
            )}
          </div>
        ))}

        {filteredWaitlist.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300">No waitlist entries found.</p>
            <p className="text-xs text-slate-500 mt-1">New walk-ins will appear here as customers scan the desk QR code.</p>
          </div>
        )}
      </div>

    </div>
  );
};

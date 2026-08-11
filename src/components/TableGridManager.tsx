import React, { useState } from 'react';
import { Table, TableStatus } from '../types';
import { QrCode, Plus, Trash2, Edit3, Users, Filter, CheckCircle2, RefreshCw, Clock, Sparkles, Layers, Armchair, Calendar, Phone, Mail, User } from 'lucide-react';

interface TableGridManagerProps {
  tables: Table[];
  zones?: string[];
  onUpdateStatus: (tableId: string, status: TableStatus) => void;
  onAddTableClick: (defaultZone?: string) => void;
  onOpenReserveModal: (tableId?: string) => void;
  onEditTableClick?: (table: Table) => void;
  onDeleteTable: (tableId: string) => void;
  onSelectTableForQr: (table: Table) => void;
  onOpenManageZones?: () => void;
}

export const TableGridManager: React.FC<TableGridManagerProps> = ({
  tables,
  zones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'],
  onUpdateStatus,
  onAddTableClick,
  onOpenReserveModal,
  onEditTableClick,
  onDeleteTable,
  onSelectTableForQr,
  onOpenManageZones
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const zoneTabs = ['All', ...Array.from(new Set(zones.map(z => z.trim()).filter(Boolean)))];

  const reservedTables = tables.filter(t => t.status === 'reserved');

  const filtered = tables.filter(t => {
    const matchesZone = selectedZone === 'All' || (t.zone && t.zone.trim().toLowerCase() === selectedZone.trim().toLowerCase());
    const matchesSearch = (t.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.currentGuestName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.guestPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.guestEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Table Management & Reservations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Reserve tables with guest details (Name, Phone, Email), manage seating capacity, and export QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenReserveModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Calendar className="w-4 h-4" />
            Reserve Table
          </button>

          <button
            onClick={() => onAddTableClick(selectedZone === 'All' ? undefined : selectedZone)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Table
          </button>
        </div>
      </div>

      {/* Reserved Tables Front Panel Ticker */}
      {reservedTables.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Front Panel Active Table Reservations ({reservedTables.length})
            </h3>
            <span className="text-[10px] text-amber-300/80 font-mono">Live Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reservedTables.map((t) => (
              <div key={t.id} className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 text-xs space-y-1.5 relative overflow-hidden">
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Filter by table, guest name, phone or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {onOpenManageZones && (
            <button
              onClick={onOpenManageZones}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
            >
              <Layers className="w-4 h-4" />
              Manage Sections
            </button>
          )}

          {zoneTabs.map(z => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                selectedZone === z
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Tables List / Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((table) => (
            <div
              key={table.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition ${
                table.status === 'reserved' ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'
              }`}
            >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-white tracking-tight">{table.number}</span>
                <div className="text-xs text-slate-400 mt-0.5">{table.name}</div>
              </div>

              <div className="bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Cap: {table.capacity}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <div><strong>Zone:</strong> {table.zone}</div>
              <div><strong>Shape:</strong> <span className="capitalize">{table.shape}</span></div>
              {table.notes && <div className="text-[11px] text-amber-400/80 italic">{table.notes}</div>}
            </div>

            {/* Reserved Details Display */}
            {table.status === 'reserved' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
                  <span>Reserved Guest</span>
                  <span>{table.reservationTime || ''}</span>
                </div>
                <div className="font-bold text-white truncate">{table.currentGuestName || 'Reserved'}</div>
                {table.guestPhone && (
                  <div className="text-[11px] text-slate-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-400" />
                    {table.guestPhone}
                  </div>
                )}
                {table.guestEmail && (
                  <div className="text-[11px] text-slate-300 flex items-center gap-1 truncate" title={table.guestEmail}>
                    <Mail className="w-3 h-3 text-amber-400" />
                    {table.guestEmail}
                  </div>
                )}
              </div>
            )}

            {/* Status Selector */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Status</label>
                {table.status !== 'reserved' && (
                  <button
                    onClick={() => onOpenReserveModal(table.id)}
                    className="text-[10px] text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Calendar className="w-3 h-3" />
                    Reserve Table
                  </button>
                )}
              </div>
              <select
                value={table.status}
                onChange={(e) => onUpdateStatus(table.id, e.target.value as TableStatus)}
                className={`w-full text-xs font-bold rounded-xl p-2 focus:outline-none border ${
                  table.status === 'available'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : table.status === 'occupied'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                    : table.status === 'reserved'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                }`}
              >
                <option value="available" className="bg-slate-900 text-emerald-400">Available</option>
                <option value="occupied" className="bg-slate-900 text-rose-400">Occupied</option>
                <option value="reserved" className="bg-slate-900 text-amber-400">Reserved</option>
                <option value="cleaning" className="bg-slate-900 text-purple-400">Cleaning</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectTableForQr(table)}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR
                </button>

                {onEditTableClick && (
                  <button
                    onClick={() => onEditTableClick(table)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"
                    title="Configure Table"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    Configure
                  </button>
                )}
              </div>

              {confirmDeleteId === table.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onDeleteTable(table.id);
                      setConfirmDeleteId(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-1 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(table.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition"
                  title="Delete Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Armchair className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-200 text-sm">No tables configured in {selectedZone} section.</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Add a table to this section to customize capacity, table shape, and seating details.
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
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Table, WaitlistEntry, RestaurantInfo, SeatingStats, TableStatus } from './types';
import { initialRestaurantInfo, initialTables, initialWaitlist } from './initialData';
import { Header } from './components/Header';
import { FloorPlanView } from './components/FloorPlanView';
import { WaitlistManager } from './components/WaitlistManager';
import { TableGridManager } from './components/TableGridManager';
import { CustomerWalkInView } from './components/CustomerWalkInView';
import { QrStandGenerator } from './components/QrStandGenerator';
import { AnalyticsView } from './components/AnalyticsView';
import { WalkInFormModal } from './components/WalkInFormModal';
import { AiSeatingModal } from './components/AiSeatingModal';
import { RestaurantSettingsModal } from './components/RestaurantSettingsModal';
import { AddTableModal } from './components/AddTableModal';
import { ManageZonesModal } from './components/ManageZonesModal';
import { EditTableModal } from './components/EditTableModal';
import { ReserveTableModal } from './components/ReserveTableModal';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'floorplan' | 'waitlist' | 'tables' | 'customer' | 'qrstand' | 'analytics'>('floorplan');

  // Server state
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(initialRestaurantInfo);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [zones, setZones] = useState<string[]>(['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room']);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [stats, setStats] = useState<SeatingStats>({
    totalTables: initialTables.length,
    availableTables: initialTables.filter(t => t.status === 'available').length,
    occupiedTables: initialTables.filter(t => t.status === 'occupied').length,
    reservedTables: initialTables.filter(t => t.status === 'reserved').length,
    cleaningTables: initialTables.filter(t => t.status === 'cleaning').length,
    activeWaitlistCount: initialWaitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length,
    todaySeatedCount: 18,
    averageWaitTimeMinutes: 12,
    occupancyPercentage: 40
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeCustomerTicket, setActiveCustomerTicket] = useState<WaitlistEntry | null>(null);

  // Modals state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [addTableDefaultZone, setAddTableDefaultZone] = useState<string>('Main Dining');
  const [isManageZonesOpen, setIsManageZonesOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveModalTableId, setReserveModalTableId] = useState<string | undefined>();

  const handleOpenReserveModal = (tableId?: string) => {
    setReserveModalTableId(tableId);
    setIsReserveModalOpen(true);
  };

  const handleConfirmReserveTable = async (data: {
    tableId: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    reservationTime: string;
    partySize: number;
  }) => {
    try {
      const res = await fetch(`/api/tables/${data.tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'reserved',
          currentGuestName: data.guestName,
          guestPhone: data.guestPhone,
          guestEmail: data.guestEmail,
          reservationTime: data.reservationTime,
          currentPartySize: data.partySize
        })
      });
      if (res.ok) {
        const updatedTable = await res.json();
        setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
      } else {
        const errText = await res.text();
        throw new Error(errText || 'Failed to update table status');
      }
    } catch (err) {
      console.error('Failed to reserve table:', err);
      throw err;
    }
  };

  const handleOpenAddTable = (zone?: string) => {
    if (zone && zone !== 'All') {
      setAddTableDefaultZone(zone);
    } else {
      setAddTableDefaultZone(zones[0] || 'Main Dining');
    }
    setIsAddTableOpen(true);
  };

  // AI Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPartySize, setAiPartySize] = useState(2);
  const [aiGuestName, setAiGuestName] = useState<string | undefined>();
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);

  // Check URL params on initial load (e.g. ?mode=customer)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'customer') {
      setActiveTab('customer');
    }
  }, []);

  // Fetch live state from backend API
  const fetchState = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setIsRefreshing(true);
    }
    try {
      const [resRest, resTables, resWait, resStats, resZones] = await Promise.all([
        fetch('/api/restaurant').then(r => r.ok ? r.json() : null),
        fetch('/api/tables').then(r => r.ok ? r.json() : null),
        fetch('/api/waitlist').then(r => r.ok ? r.json() : null),
        fetch('/api/stats').then(r => r.ok ? r.json() : null),
        fetch('/api/zones').then(r => r.ok ? r.json() : null)
      ]);

      if (resRest) setRestaurant(resRest);
      if (resTables) setTables(resTables);
      if (resWait) {
        setWaitlist(resWait);
        setActiveCustomerTicket((prevTicket) => {
          if (!prevTicket) return null;
          return resWait.find((w: WaitlistEntry) => w.id === prevTicket.id) || prevTicket;
        });
      }
      if (resStats) setStats(resStats);
      if (resZones) setZones(resZones);
    } catch (err) {
      console.warn('API sync fallback to local memory state:', err);
    } finally {
      if (showSpinner) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Real-time updates via SSE stream and fast 2.5s fallback polling
  useEffect(() => {
    // Initial fetch
    fetchState(true);

    // Subscribe to real-time server events
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = () => {
        fetchState(false);
      };
      eventSource.onerror = () => {
        // Fallback gracefully on SSE disconnect
      };
    } catch (e) {
      console.warn('SSE subscription failed, falling back to polling:', e);
    }

    // Fast polling fallback for zero missed updates
    const interval = setInterval(() => {
      fetchState(false);
    }, 2500);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [fetchState]);

  // Handlers for Table operations
  const handleUpdateTableStatus = async (
    tableId: string,
    status: TableStatus,
    guestName?: string,
    partySize?: number
  ) => {
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentGuestName: guestName, currentPartySize: partySize })
      });

      if (res.ok) {
        fetchState();
      } else {
        // Fallback local state update
        setTables(prev =>
          prev.map(t =>
            t.id === tableId ? { ...t, status, currentGuestName: guestName, currentPartySize: partySize } : t
          )
        );
      }
    } catch (err) {
      setTables(prev =>
        prev.map(t =>
          t.id === tableId ? { ...t, status, currentGuestName: guestName, currentPartySize: partySize } : t
        )
      );
    }
  };

  const handleAddTable = async (data: {
    number: string;
    name: string;
    zone: any;
    capacity: number;
    shape: any;
    notes?: string;
  }) => {
    const tempId = `t_${Date.now()}`;
    const newT: Table = {
      id: tempId,
      number: data.number,
      name: data.name || `Table ${data.number}`,
      zone: data.zone,
      capacity: data.capacity,
      status: 'available',
      x: 50,
      y: 50,
      shape: data.shape,
      notes: data.notes
    };

    setTables(prev => [...prev, newT]);
    if (data.zone && !zones.includes(data.zone)) {
      setZones(prev => [...prev, data.zone]);
    }

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const savedTable = await res.json();
        setTables(prev => prev.map(t => t.id === tempId ? savedTable : t));
      }
    } catch (err) {
      console.error("Error adding table:", err);
    }
  };

  const handleSaveTableConfig = async (tableId: string, updatedData: {
    number: string;
    name: string;
    zone: string;
    capacity: number;
    shape: any;
    notes?: string;
  }) => {
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, ...updatedData } : t))
    );
    if (updatedData.zone && !zones.includes(updatedData.zone)) {
      setZones(prev => [...prev, updatedData.zone]);
    }

    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Error updating table config:", err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    try {
      const res = await fetch(`/api/tables/${tableId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Error deleting table:", err);
    }
  };

  // Handlers for Zone operations
  const handleAddZone = async (zoneName: string) => {
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: zoneName })
      });
      if (res.ok) {
        const updatedZones = await res.json();
        setZones(updatedZones);
      } else {
        if (!zones.includes(zoneName)) setZones(prev => [...prev, zoneName]);
      }
    } catch (err) {
      if (!zones.includes(zoneName)) setZones(prev => [...prev, zoneName]);
    }
  };

  const handleDeleteZone = async (zoneName: string) => {
    const remainingZones = zones.filter(z => z !== zoneName);
    const fallbackZone = remainingZones[0] || 'Main Dining';
    setZones(remainingZones);
    setTables(prev => prev.map(t => t.zone === zoneName ? { ...t, zone: fallbackZone } : t));

    try {
      const res = await fetch(`/api/zones/${encodeURIComponent(zoneName)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Error deleting zone:", err);
    }
  };

  const handleRenameZone = async (oldName: string, newName: string) => {
    try {
      const res = await fetch(`/api/zones/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });
      if (res.ok) {
        fetchState();
      } else {
        setZones(prev => prev.map(z => z === oldName ? newName : z));
        setTables(prev => prev.map(t => t.zone === oldName ? { ...t, zone: newName } : t));
      }
    } catch (err) {
      setZones(prev => prev.map(z => z === oldName ? newName : z));
      setTables(prev => prev.map(t => t.zone === oldName ? { ...t, zone: newName } : t));
    }
  };

  // Handlers for Walk-In / Waitlist operations
  const handleAddWalkIn = async (data: {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    preferredZone?: any;
    specialRequests?: string;
    type: 'walkin_immediate' | 'walkin_later';
  }): Promise<WaitlistEntry | null> => {
    try {
      const res = await fetch('/api/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const entry: WaitlistEntry = await res.json();
        setActiveCustomerTicket(entry);
        fetchState();
        return entry;
      }
    } catch (err) {
      console.error(err);
    }

    // Local fallback
    const fallbackEntry: WaitlistEntry = {
      id: `w_${Date.now()}`,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      partySize: data.partySize,
      type: data.type,
      preferredZone: data.preferredZone || 'Any',
      status: 'waiting',
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: 12,
      specialRequests: data.specialRequests || '',
      confirmationCode: `BL-${Math.floor(100 + Math.random() * 900)}`
    };

    setWaitlist(prev => [fallbackEntry, ...prev]);
    setActiveCustomerTicket(fallbackEntry);
    return fallbackEntry;
  };

  const handleUpdateWaitlistStatus = async (
    id: string,
    status: WaitlistEntry['status'],
    assignedTableId?: string
  ) => {
    const tableToAssign = tables.find(t => t.id === assignedTableId);

    try {
      await fetch(`/api/waitlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTableId,
          assignedTableNumber: tableToAssign ? tableToAssign.number : undefined
        })
      });
      fetchState();
    } catch (err) {
      setWaitlist(prev =>
        prev.map(w =>
          w.id === id
            ? {
                ...w,
                status,
                assignedTableId,
                assignedTableNumber: tableToAssign ? tableToAssign.number : undefined
              }
            : w
        )
      );
      if (status === 'seated' && assignedTableId) {
        handleUpdateTableStatus(assignedTableId, 'occupied');
      }
    }
  };

  // AI Seating Suggestion handler
  const handleOpenAiSuggest = async (partySize = 2, preferredZone?: string, guestName?: string) => {
    setAiPartySize(partySize);
    setAiGuestName(guestName);
    setIsAiModalOpen(true);
    setAiLoading(true);
    setAiRecommendation(null);

    try {
      const res = await fetch('/api/ai/suggest-seating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partySize, preferredZone, guestName })
      });

      if (res.ok) {
        const data = await res.json();
        setAiRecommendation(data);
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveRestaurantSettings = async (updated: RestaurantInfo) => {
    try {
      await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setRestaurant(updated);
    } catch (err) {
      setRestaurant(updated);
    }
  };

  const waitingCount = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* App Header Bar */}
      <Header
        restaurant={restaurant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={fetchState}
        isRefreshing={isRefreshing}
        waitingCount={waitingCount}
      />

      {/* Main Body View Switching */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'floorplan' && (
          <FloorPlanView
            tables={tables}
            waitlist={waitlist}
            zones={zones}
            onUpdateTableStatus={handleUpdateTableStatus}
            onSeatWaitlistGuest={(wId, tId) => handleUpdateWaitlistStatus(wId, 'seated', tId)}
            onOpenAiSuggest={handleOpenAiSuggest}
            onSelectTableForQr={(table) => {
              setSelectedTableForQr(table);
              setActiveTab('qrstand');
            }}
            onAddTableClick={handleOpenAddTable}
            onOpenReserveModal={handleOpenReserveModal}
            onEditTableClick={(table) => setEditingTable(table)}
            onDeleteTable={handleDeleteTable}
            onOpenManageZones={() => setIsManageZonesOpen(true)}
          />
        )}

        {activeTab === 'waitlist' && (
          <WaitlistManager
            waitlist={waitlist}
            tables={tables}
            onUpdateWaitlistStatus={handleUpdateWaitlistStatus}
            onOpenNewWalkinModal={() => setIsWalkInModalOpen(true)}
            onOpenAiSuggest={handleOpenAiSuggest}
          />
        )}

        {activeTab === 'tables' && (
          <TableGridManager
            tables={tables}
            zones={zones}
            onUpdateStatus={(tId, st) => handleUpdateTableStatus(tId, st)}
            onAddTableClick={handleOpenAddTable}
            onOpenReserveModal={handleOpenReserveModal}
            onEditTableClick={(table) => setEditingTable(table)}
            onDeleteTable={handleDeleteTable}
            onSelectTableForQr={(table) => {
              setSelectedTableForQr(table);
              setActiveTab('qrstand');
            }}
            onOpenManageZones={() => setIsManageZonesOpen(true)}
          />
        )}

        {activeTab === 'customer' && (
          <CustomerWalkInView
            restaurant={restaurant}
            onSubmitWalkIn={handleAddWalkIn}
            activeCustomerTicket={activeCustomerTicket}
            onClearTicket={() => setActiveCustomerTicket(null)}
          />
        )}

        {activeTab === 'qrstand' && (
          <QrStandGenerator
            restaurant={restaurant}
            selectedTableForQr={selectedTableForQr}
            onClearSelectedTableQr={() => setSelectedTableForQr(null)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView stats={stats} tables={tables} />
        )}

      </main>

      {/* Global Modals */}
      <WalkInFormModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleAddWalkIn}
      />

      <AiSeatingModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isLoading={aiLoading}
        partySize={aiPartySize}
        guestName={aiGuestName}
        recommendation={aiRecommendation}
        onConfirmSeat={(tableId) => {
          handleUpdateTableStatus(tableId, 'occupied', aiGuestName || 'Walk-In Guest', aiPartySize);
        }}
      />

      <RestaurantSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        restaurant={restaurant}
        onSave={handleSaveRestaurantSettings}
      />

      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        zones={zones}
        defaultZone={addTableDefaultZone}
        onAddTable={handleAddTable}
        onAddZone={handleAddZone}
      />

      <ManageZonesModal
        isOpen={isManageZonesOpen}
        onClose={() => setIsManageZonesOpen(false)}
        zones={zones}
        tables={tables}
        onAddZone={handleAddZone}
        onRenameZone={handleRenameZone}
        onDeleteZone={handleDeleteZone}
      />

      <EditTableModal
        isOpen={!!editingTable}
        table={editingTable}
        zones={zones}
        onClose={() => setEditingTable(null)}
        onSaveTable={handleSaveTableConfig}
        onAddZone={handleAddZone}
      />

      <ReserveTableModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        tables={tables}
        defaultTableId={reserveModalTableId}
        onConfirmReserve={handleConfirmReserveTable}
      />

    </div>
  );
}

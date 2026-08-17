import React, { useState, useEffect, useCallback } from 'react';
import { Table, WaitlistEntry, RestaurantInfo, SeatingStats, TableStatus, UserSession, RestaurantTenant } from './types';
import { initialRestaurantInfo, initialTables, initialWaitlist } from './initialData';
import { getRestaurantTenants } from './lib/gatewayStorage';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { CustomerFrontPage } from './components/CustomerFrontPage';
import { AppOwnerDashboard } from './components/AppOwnerDashboard';
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
import { BottomSettingsBar } from './components/BottomSettingsBar';

export default function App() {
  // Authentication & Role Session State with persistent local storage
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('restaurant_session');
      if (saved) return JSON.parse(saved);
      // Default initial session for Patrick Ferns so user is never lost on refresh
      const defaultUser: UserSession = {
        id: 'usr_default',
        email: 'patrickferns17@gmail.com',
        name: 'Patrick Ferns',
        phone: '(555) 890-1234',
        role: 'customer',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Patrick%20Ferns'
      };
      localStorage.setItem('restaurant_session', JSON.stringify(defaultUser));
      return defaultUser;
    } catch {
      return null;
    }
  });

  // Helper to check if current URL is a dedicated customer route
  const checkIsCustomerUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.startsWith('/customer') ||
      path.startsWith('/reserve') ||
      path.startsWith('/book') ||
      path.startsWith('/booking') ||
      search.includes('mode=customer') ||
      search.includes('view=customer') ||
      search.includes('view=booking') ||
      search.includes('customer=true')
    );
  };

  const [isDirectCustomerUrl, setIsDirectCustomerUrl] = useState<boolean>(() => checkIsCustomerUrl());

  // Top level view routing: 'customer_portal' | 'admin_panel' | 'owner_dashboard'
  const [viewMode, setViewMode] = useState<'customer_portal' | 'admin_panel' | 'owner_dashboard'>(() => {
    if (checkIsCustomerUrl()) {
      return 'customer_portal';
    }
    try {
      const savedMode = localStorage.getItem('restaurant_view_mode');
      if (savedMode === 'admin_panel' || savedMode === 'customer_portal' || savedMode === 'owner_dashboard') {
        return savedMode as any;
      }
      const savedSession = localStorage.getItem('restaurant_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.role === 'owner') return 'owner_dashboard';
        return parsed.role === 'admin' ? 'admin_panel' : 'customer_portal';
      }
    } catch {}
    return 'customer_portal';
  });

  // Keep viewMode and isDirectCustomerUrl in sync with browser URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const isCust = checkIsCustomerUrl();
      setIsDirectCustomerUrl(isCust);
      if (isCust) {
        setViewMode('customer_portal');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Admin Desk sub-tab state
  const [activeTab, setActiveTab] = useState<'floorplan' | 'waitlist' | 'tables' | 'customer' | 'qrstand' | 'analytics'>(() => {
    try {
      const savedTab = localStorage.getItem('restaurant_active_tab');
      if (savedTab && ['floorplan', 'waitlist', 'tables', 'customer', 'qrstand', 'analytics'].includes(savedTab)) {
        return savedTab as any;
      }
    } catch {}
    return 'floorplan';
  });

  // Cached initial state from localStorage fallback before network sync
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => {
    try {
      const saved = localStorage.getItem('restaurant_cached_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialRestaurantInfo;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem('restaurant_cached_tables');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialTables;
  });

  const [zones, setZones] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('restaurant_cached_zones');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'];
  });

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    try {
      const saved = localStorage.getItem('restaurant_cached_waitlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialWaitlist;
  });

  const [stats, setStats] = useState<SeatingStats>(() => {
    try {
      const saved = localStorage.getItem('restaurant_cached_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      totalTables: initialTables.length,
      availableTables: initialTables.filter(t => t.status === 'available').length,
      occupiedTables: initialTables.filter(t => t.status === 'occupied').length,
      reservedTables: initialTables.filter(t => t.status === 'reserved').length,
      cleaningTables: initialTables.filter(t => t.status === 'cleaning').length,
      activeWaitlistCount: initialWaitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length,
      todaySeatedCount: 18,
      todayTableTurnovers: 18,
      todayTotalGuests: 54,
      monthlyTableTurnovers: 412,
      monthlyTotalGuests: 1240,
      averageWaitTimeMinutes: 12,
      averageTurnTimeMinutes: 55,
      occupancyPercentage: 40,
      currentBusinessDate: '2026-08-10'
    };
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeCustomerTicket, setActiveCustomerTicket] = useState<WaitlistEntry | null>(null);

  // Sync state helper to write local caches
  const cacheLocalState = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const handleSetActiveTab = (tab: 'floorplan' | 'waitlist' | 'tables' | 'customer' | 'qrstand' | 'analytics' | 'packages') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('restaurant_active_tab', tab);
    } catch {}
  };

  const handleSetViewMode = (mode: 'customer_portal' | 'admin_panel' | 'owner_dashboard') => {
    setViewMode(mode);
    try {
      localStorage.setItem('restaurant_view_mode', mode);
    } catch {}

    if (mode === 'customer_portal') {
      if (!window.location.pathname.startsWith('/reserve') && !window.location.search.includes('mode=customer')) {
        try {
          window.history.pushState({}, '', '/reserve');
        } catch {}
      }
    } else {
      setIsDirectCustomerUrl(false);
      if (window.location.pathname.startsWith('/reserve') || window.location.pathname.startsWith('/customer') || window.location.search.includes('mode=customer')) {
        try {
          window.history.pushState({}, '', '/');
        } catch {}
      }
    }
  };

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

      if (resRest) {
        setRestaurant((prevRest) => {
          const merged: RestaurantInfo = {
            ...prevRest,
            ...resRest,
            name: resRest.name || prevRest?.name || 'QR Seating Restaurant Manager',
            logoUrl: resRest.logoUrl !== undefined ? resRest.logoUrl : (prevRest?.logoUrl || '')
          };
          cacheLocalState('restaurant_cached_info', merged);
          return merged;
        });
      }
      if (resTables) {
        setTables(resTables);
        cacheLocalState('restaurant_cached_tables', resTables);
      }
      if (resWait) {
        setWaitlist(resWait);
        cacheLocalState('restaurant_cached_waitlist', resWait);
        setActiveCustomerTicket((prevTicket) => {
          if (!prevTicket) return null;
          return resWait.find((w: WaitlistEntry) => w.id === prevTicket.id) || prevTicket;
        });
      }
      if (resStats) {
        setStats(resStats);
        cacheLocalState('restaurant_cached_stats', resStats);
      }
      if (resZones) {
        setZones(resZones);
        cacheLocalState('restaurant_cached_zones', resZones);
      }
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

    const handleBrandingUpdated = (e: any) => {
      if (e.detail) {
        setRestaurant(e.detail);
        cacheLocalState('restaurant_cached_info', e.detail);
      }
    };
    window.addEventListener('smarthost:branding_updated', handleBrandingUpdated as EventListener);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
      window.removeEventListener('smarthost:branding_updated', handleBrandingUpdated as EventListener);
    };
  }, [fetchState]);

  // Handlers for Table operations
  const handleUpdateTableStatus = async (
    tableId: string,
    status: TableStatus,
    guestName?: string,
    partySize?: number
  ) => {
    const updatedTables = tables.map(t =>
      t.id === tableId ? { ...t, status, currentGuestName: guestName, currentPartySize: partySize } : t
    );
    setTables(updatedTables);
    cacheLocalState('restaurant_cached_tables', updatedTables);

    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentGuestName: guestName, currentPartySize: partySize })
      });

      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.warn("Table status updated locally:", err);
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

    const updatedTables = [...tables, newT];
    setTables(updatedTables);
    cacheLocalState('restaurant_cached_tables', updatedTables);

    if (data.zone && !zones.includes(data.zone)) {
      const updatedZones = [...zones, data.zone];
      setZones(updatedZones);
      cacheLocalState('restaurant_cached_zones', updatedZones);
    }

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const savedTable = await res.json();
        setTables(prev => {
          const mapped = prev.map(t => t.id === tempId ? savedTable : t);
          cacheLocalState('restaurant_cached_tables', mapped);
          return mapped;
        });
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
    const updatedTables = tables.map(t => (t.id === tableId ? { ...t, ...updatedData } : t));
    setTables(updatedTables);
    cacheLocalState('restaurant_cached_tables', updatedTables);

    if (updatedData.zone && !zones.includes(updatedData.zone)) {
      const updatedZones = [...zones, updatedData.zone];
      setZones(updatedZones);
      cacheLocalState('restaurant_cached_zones', updatedZones);
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
    const updatedTables = tables.filter(t => t.id !== tableId);
    setTables(updatedTables);
    cacheLocalState('restaurant_cached_tables', updatedTables);

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
    if (!zones.includes(zoneName)) {
      const updatedZones = [...zones, zoneName];
      setZones(updatedZones);
      cacheLocalState('restaurant_cached_zones', updatedZones);
    }
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: zoneName })
      });
      if (res.ok) {
        const updated = await res.json();
        setZones(updated);
        cacheLocalState('restaurant_cached_zones', updated);
      }
    } catch (err) {
      console.error("Error adding zone:", err);
    }
  };

  const handleDeleteZone = async (zoneName: string) => {
    const remainingZones = zones.filter(z => z !== zoneName);
    const fallbackZone = remainingZones[0] || 'Main Dining';
    setZones(remainingZones);
    cacheLocalState('restaurant_cached_zones', remainingZones);

    const remappedTables = tables.map(t => t.zone === zoneName ? { ...t, zone: fallbackZone } : t);
    setTables(remappedTables);
    cacheLocalState('restaurant_cached_tables', remappedTables);

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
    const updatedZones = zones.map(z => z === oldName ? newName : z);
    setZones(updatedZones);
    cacheLocalState('restaurant_cached_zones', updatedZones);

    const remappedTables = tables.map(t => t.zone === oldName ? { ...t, zone: newName } : t);
    setTables(remappedTables);
    cacheLocalState('restaurant_cached_tables', remappedTables);

    try {
      const res = await fetch(`/api/zones/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });
      if (res.ok) {
        fetchState();
      }
    } catch (err) {
      console.error("Error renaming zone:", err);
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

    const prefix = (restaurant.name || 'RS')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 2)
      .toUpperCase() || 'RS';

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
      confirmationCode: `${prefix}-${Math.floor(100 + Math.random() * 900)}`
    };

    const updatedWaitlist = [fallbackEntry, ...waitlist];
    setWaitlist(updatedWaitlist);
    cacheLocalState('restaurant_cached_waitlist', updatedWaitlist);
    setActiveCustomerTicket(fallbackEntry);
    return fallbackEntry;
  };

  const handleUpdateWaitlistStatus = async (
    id: string,
    status: WaitlistEntry['status'],
    assignedTableId?: string
  ) => {
    const tableToAssign = tables.find(t => t.id === assignedTableId);

    const updatedWaitlist = waitlist.map(w =>
      w.id === id
        ? {
            ...w,
            status,
            assignedTableId,
            assignedTableNumber: tableToAssign ? tableToAssign.number : undefined
          }
        : w
    );
    setWaitlist(updatedWaitlist);
    cacheLocalState('restaurant_cached_waitlist', updatedWaitlist);

    if (status === 'seated' && assignedTableId) {
      handleUpdateTableStatus(assignedTableId, 'occupied');
    }

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
      console.warn("Waitlist status saved locally:", err);
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
    setRestaurant(updated);
    cacheLocalState('restaurant_cached_info', updated);
    try {
      await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      // Synchronize in background without aggressive loading flicker
      setTimeout(() => fetchState(false), 200);
    } catch (err) {
      console.error('Failed to save settings to server:', err);
    }
  };

  // Customer Portal Direct Reservation Handler
  const handleCustomerDirectReserve = async (data: {
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    reservationTime: string;
    partySize: number;
    preferredZone?: string;
    notes?: string;
    tableId?: string;
  }) => {
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.table) {
          setTables(prev => {
            const mapped = prev.map(t => t.id === result.table.id ? result.table : t);
            cacheLocalState('restaurant_cached_tables', mapped);
            return mapped;
          });
        }
        fetchState(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete reservation');
      }
    } catch (err) {
      console.error('Reservation failed:', err);
      throw err;
    }
  };

  // Auth Handlers
  const handleLogin = (newSession: UserSession) => {
    cacheLocalState('restaurant_session', newSession);
    setSession(newSession);
    const targetMode = newSession.role === 'customer' ? 'customer_portal' : 'admin_panel';
    handleSetViewMode(targetMode);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('restaurant_session');
      localStorage.removeItem('restaurant_view_mode');
    } catch {}
    setSession(null);
  };

  const waitingCount = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length;

  // Handle Customer Post-Payment Launch to Customer Portal
  const handlePaymentCompleteDirectToCustomer = (clientData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    planId: string;
    invoiceId: string;
  }) => {
    const customerSession: UserSession = {
      id: `usr_${Date.now()}`,
      email: clientData.clientEmail.toLowerCase().trim(),
      name: clientData.clientName.trim() || clientData.clientEmail.split('@')[0],
      phone: clientData.clientPhone.trim(),
      role: 'customer',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientData.clientName || 'Customer')}`
    };

    cacheLocalState('restaurant_session', customerSession);
    setSession(customerSession);
    handleSetViewMode('customer_portal');
  };

  // Direct administrative login handlers from Index page
  const handleDirectRestaurantAdminLogin = (email: string, tenantMatch?: RestaurantTenant) => {
    let matchedRest = tenantMatch;
    if (!matchedRest) {
      const tenants = getRestaurantTenants();
      matchedRest = tenants.find(t => t.ownerEmail.toLowerCase() === email.toLowerCase().trim());
    }
    if (matchedRest) {
      setRestaurant(prev => ({
        ...prev,
        id: matchedRest!.id,
        name: matchedRest!.name,
        tagline: matchedRest!.tagline,
        address: matchedRest!.address,
        phone: matchedRest!.phone
      }));
    }
    const adminSession: UserSession = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase().trim(),
      name: matchedRest ? matchedRest.ownerName : email.split('@')[0],
      phone: matchedRest ? matchedRest.phone : '',
      role: 'admin',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`
    };
    cacheLocalState('restaurant_session', adminSession);
    setSession(adminSession);
    handleSetViewMode('admin_panel');
  };

  const handleDirectOwnerLogin = (email: string) => {
    const ownerEmail = email.toLowerCase().trim() || 'patrickferns17@gmail.com';
    const ownerSession: UserSession = {
      id: `owner_${Date.now()}`,
      email: ownerEmail,
      name: 'App Master Owner',
      phone: '+91 98200 12345',
      role: 'owner',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=App%20Owner`
    };
    cacheLocalState('restaurant_session', ownerSession);
    setSession(ownerSession);
    handleSetViewMode('owner_dashboard');
  };

  // 1. App Owner Master Control Center View Mode
  if (viewMode === 'owner_dashboard') {
    const ownerUser: UserSession = session || {
      id: 'owner_master',
      email: 'owner@smarthost.com',
      name: 'Master Platform Owner',
      phone: '+91 98200 12345',
      role: 'owner'
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <AppOwnerDashboard
            currentRestaurant={restaurant}
            user={ownerUser}
            onSwitchToHostDesk={() => handleSetViewMode('admin_panel')}
            onSwitchToCustomerPortal={() => handleSetViewMode('customer_portal')}
            onUpdateRestaurant={handleSaveRestaurantSettings}
            onSelectRestaurant={(tenant: RestaurantTenant) => {
              setRestaurant((prev) => ({
                ...prev,
                id: tenant.id,
                name: tenant.name,
                tagline: tenant.tagline,
                phone: tenant.phone,
                address: tenant.address
              }));
              handleSetViewMode('admin_panel');
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Customer View Mode or Direct Customer Booking URL -> Render Customer Front Page
  if (viewMode === 'customer_portal' || isDirectCustomerUrl) {
    const activeCustomerUser: UserSession = session || {
      id: 'guest_customer',
      email: '',
      name: 'Guest Diner',
      phone: '',
      role: 'customer'
    };

    return (
      <CustomerFrontPage
        restaurant={restaurant}
        user={activeCustomerUser}
        tables={tables}
        waitlist={waitlist}
        zones={zones}
        onReserveTable={handleCustomerDirectReserve}
        onSubmitWalkIn={handleAddWalkIn}
        onUpdateTable={handleSaveTableConfig}
        onCancelReservation={(tableId) => handleUpdateTableStatus(tableId, 'available')}
        onCancelWaitlist={(waitlistId) => handleUpdateWaitlistStatus(waitlistId, 'cancelled')}
        onSwitchToAdmin={() => handleSetViewMode('admin_panel')}
        onSwitchToOwnerDashboard={() => handleSetViewMode('owner_dashboard')}
        onLoginAsRestaurantAdmin={handleDirectRestaurantAdminLogin}
        onLoginAsOwner={handleDirectOwnerLogin}
        onUpdateRestaurant={handleSaveRestaurantSettings}
        onLogout={session ? handleLogout : undefined}
        onRefresh={() => fetchState(true)}
        isDirectCustomerUrl={isDirectCustomerUrl}
      />
    );
  }

  // 3. Unauthenticated Staff/Admin -> Render Staff Login Page
  if (!session) {
    return (
      <LoginPage
        restaurant={restaurant}
        onLogin={handleLogin}
        defaultEmail="patrickferns17@gmail.com"
      />
    );
  }

  // 4. Restaurant Staff / Admin Desk View Mode
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 pb-24 sm:pb-28">
      
      {/* App Header Bar with top navigation tabs */}
      <Header
        restaurant={restaurant}
        user={session}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onRefresh={fetchState}
        isRefreshing={isRefreshing}
        waitingCount={waitingCount}
        onSwitchToCustomer={() => handleSetViewMode('customer_portal')}
        onSwitchToOwnerDashboard={() => handleSetViewMode('owner_dashboard')}
        onLogout={handleLogout}
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
              handleSetActiveTab('qrstand');
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
              handleSetActiveTab('qrstand');
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

      {/* iPhone Style Bottom Settings Dock */}
      <BottomSettingsBar
        restaurant={restaurant}
        user={session}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={fetchState}
        isRefreshing={isRefreshing}
        onSwitchToCustomer={() => handleSetViewMode('customer_portal')}
        onSwitchToOwnerDashboard={() => handleSetViewMode('owner_dashboard')}
        onLogout={handleLogout}
      />

    </div>
  );
}

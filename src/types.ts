export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type TableZone = string;

export type TableShape = 'rectangle' | 'round' | 'square';

export interface Table {
  id: string;
  number: string;
  name: string;
  zone: TableZone;
  capacity: number;
  status: TableStatus;
  currentGuestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  reservationTime?: string;
  currentPartySize?: number;
  seatedAt?: string; // ISO string
  estimatedVacantAt?: string; // ISO string
  x: number; // percentage 0-100 for floor plan positioning
  y: number; // percentage 0-100 for floor plan positioning
  shape: TableShape;
  notes?: string;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'seated' | 'cancelled' | 'completed';

export interface WaitlistEntry {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  type: 'walkin_immediate' | 'walkin_later';
  preferredTime?: string;
  preferredZone?: TableZone | 'Any';
  status: WaitlistStatus;
  assignedTableId?: string;
  assignedTableNumber?: string;
  createdAt: string; // ISO string
  estimatedWaitMinutes: number;
  dietaryNotes?: string;
  specialRequests?: string;
  confirmationCode: string;
}

export interface GuestTurnoverRecord {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  partySize: number;
  tableId: string;
  tableNumber: string;
  zone: TableZone;
  date: string; // YYYY-MM-DD
  seatedAt: string; // ISO string
  completedAt?: string; // ISO string
  durationMinutes?: number;
  type: 'walkin_immediate' | 'walkin_later' | 'reservation' | 'direct_seated';
  status: 'seated' | 'completed' | 'cancelled';
  specialRequests?: string;
}

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  tagline: string;
  logoUrl?: string;
  operatingHours: string;
  deskInstructions: string;
  welcomeMessage: string;
  currentBusinessDate?: string; // YYYY-MM-DD e.g. "2026-08-10"
}

export interface SeatingStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  cleaningTables: number;
  activeWaitlistCount: number;
  todaySeatedCount: number;
  todayTableTurnovers: number;
  todayTotalGuests: number;
  monthlyTableTurnovers: number;
  monthlyTotalGuests: number;
  averageWaitTimeMinutes: number;
  averageTurnTimeMinutes: number;
  occupancyPercentage: number;
  currentBusinessDate: string;
}

export type UserRole = 'customer' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  savedPreferences?: {
    dietaryNotes?: string;
    preferredZone?: string;
    specialRequests?: string;
  };
}

export interface CustomerBooking {
  id: string;
  type: 'reservation' | 'waitlist';
  tableId?: string;
  tableNumber?: string;
  zone?: string;
  guestName: string;
  email: string;
  phone: string;
  partySize: number;
  status: 'reserved' | 'waiting' | 'notified' | 'seated' | 'completed' | 'cancelled';
  reservationTime?: string;
  createdAt: string;
  notes?: string;
  confirmationCode?: string;
}


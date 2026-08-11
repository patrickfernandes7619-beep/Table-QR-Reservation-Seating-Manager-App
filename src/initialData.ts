import { Table, WaitlistEntry, RestaurantInfo, GuestTurnoverRecord } from './types';

export const initialRestaurantInfo: RestaurantInfo = {
  name: "Bistro Lumière",
  address: "742 Evergreen Terrace, Downtown Food District",
  phone: "(555) 234-8901",
  tagline: "Modern French-Italian Dining & Seasonal Artisanal Kitchen",
  operatingHours: "Mon-Sun: 11:30 AM - 10:00 PM",
  deskInstructions: "Scan QR code to check in for immediate walk-in seating or reserve a table today.",
  welcomeMessage: "Welcome to Bistro Lumière! Please scan to join our digital waitlist or select your preferred table.",
  currentBusinessDate: "2026-08-10"
};

export const initialTables: Table[] = [
  // Main Dining Zone
  { id: 't1', number: 'M-01', name: 'Main Table 1', zone: 'Main Dining', capacity: 2, status: 'occupied', currentGuestName: 'Claire & Marcus', currentPartySize: 2, seatedAt: new Date(Date.now() - 35 * 60000).toISOString(), x: 18, y: 22, shape: 'square' },
  { id: 't2', number: 'M-02', name: 'Main Table 2', zone: 'Main Dining', capacity: 2, status: 'available', x: 18, y: 45, shape: 'square' },
  { id: 't3', number: 'M-03', name: 'Main Center Table', zone: 'Main Dining', capacity: 4, status: 'occupied', currentGuestName: 'Dave Smith Party', currentPartySize: 4, seatedAt: new Date(Date.now() - 18 * 60000).toISOString(), x: 42, y: 30, shape: 'round' },
  { id: 't4', number: 'M-04', name: 'Main Center Large', zone: 'Main Dining', capacity: 6, status: 'reserved', currentGuestName: 'Elena Rostova (7:30 PM)', currentPartySize: 5, x: 42, y: 65, shape: 'rectangle', notes: 'Anniversary celebration - champagne set' },
  { id: 't5', number: 'M-05', name: 'Window Front 1', zone: 'Main Dining', capacity: 4, status: 'available', x: 68, y: 22, shape: 'square' },
  { id: 't6', number: 'M-06', name: 'Window Front 2', zone: 'Main Dining', capacity: 4, status: 'cleaning', x: 68, y: 52, shape: 'square' },

  // Patio Outdoor Zone
  { id: 'p1', number: 'P-01', name: 'Garden Umbrella 1', zone: 'Patio Outdoor', capacity: 4, status: 'occupied', currentGuestName: 'Liam Miller', currentPartySize: 3, seatedAt: new Date(Date.now() - 50 * 60000).toISOString(), x: 20, y: 25, shape: 'round' },
  { id: 'p2', number: 'P-02', name: 'Garden Umbrella 2', zone: 'Patio Outdoor', capacity: 4, status: 'available', x: 50, y: 25, shape: 'round' },
  { id: 'p3', number: 'P-03', name: 'Terrace Corner', zone: 'Patio Outdoor', capacity: 6, status: 'available', x: 80, y: 30, shape: 'rectangle', notes: 'Pet friendly patio area' },
  { id: 'p4', number: 'P-04', name: 'Patio Duo', zone: 'Patio Outdoor', capacity: 2, status: 'occupied', currentGuestName: 'Sophia K.', currentPartySize: 2, seatedAt: new Date(Date.now() - 10 * 60000).toISOString(), x: 35, y: 68, shape: 'square' },

  // Private Booths
  { id: 'b1', number: 'B-01', name: 'Cozy Booth Alpha', zone: 'Private Booths', capacity: 4, status: 'occupied', currentGuestName: 'Dr. Harrison', currentPartySize: 4, seatedAt: new Date(Date.now() - 25 * 60000).toISOString(), x: 25, y: 35, shape: 'rectangle' },
  { id: 'b2', number: 'B-02', name: 'Cozy Booth Beta', zone: 'Private Booths', capacity: 4, status: 'available', x: 55, y: 35, shape: 'rectangle' },
  { id: 'b3', number: 'B-03', name: 'Cozy Booth Gamma', zone: 'Private Booths', capacity: 4, status: 'reserved', currentGuestName: 'Sarah Jenkins', currentPartySize: 4, x: 85, y: 35, shape: 'rectangle', notes: 'Requires high chair' },

  // Bar Lounge
  { id: 'l1', number: 'BAR-01', name: 'Bar High Top 1', zone: 'Bar Lounge', capacity: 2, status: 'available', x: 22, y: 40, shape: 'round' },
  { id: 'l2', number: 'BAR-02', name: 'Bar High Top 2', zone: 'Bar Lounge', capacity: 2, status: 'occupied', currentGuestName: 'Tom & Alex', currentPartySize: 2, seatedAt: new Date(Date.now() - 12 * 60000).toISOString(), x: 52, y: 40, shape: 'round' },
  { id: 'l3', number: 'BAR-03', name: 'Lounge Sofa Bench', zone: 'Bar Lounge', capacity: 6, status: 'available', x: 82, y: 40, shape: 'rectangle' },

  // VIP Room
  { id: 'v1', number: 'VIP-01', name: 'Grand VIP Suite', zone: 'VIP Room', capacity: 10, status: 'available', x: 50, y: 50, shape: 'rectangle', notes: 'Private server, AV presentation screen' }
];

export const initialWaitlist: WaitlistEntry[] = [
  {
    id: 'w-101',
    customerName: 'Aria Montgomery',
    phone: '(555) 987-6543',
    email: 'aria.m@example.com',
    partySize: 2,
    type: 'walkin_immediate',
    preferredZone: 'Patio Outdoor',
    status: 'waiting',
    createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
    estimatedWaitMinutes: 10,
    specialRequests: 'Prefers outdoor umbrella table',
    confirmationCode: 'BL-892'
  },
  {
    id: 'w-102',
    customerName: 'Robert Vance',
    phone: '(555) 432-1098',
    partySize: 5,
    type: 'walkin_immediate',
    preferredZone: 'Main Dining',
    status: 'notified',
    createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
    estimatedWaitMinutes: 5,
    specialRequests: 'Needs 1 High Chair for toddler',
    confirmationCode: 'BL-441'
  },
  {
    id: 'w-103',
    customerName: 'Jessica Thorne',
    phone: '(555) 876-5432',
    partySize: 4,
    type: 'walkin_immediate',
    preferredZone: 'Private Booths',
    status: 'waiting',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    estimatedWaitMinutes: 18,
    specialRequests: 'Quiet area preferred for business dinner',
    confirmationCode: 'BL-703'
  }
];

export const initialTurnoverRecords: GuestTurnoverRecord[] = [
  // Today's Seated / Completed Guests (2026-08-10)
  {
    id: 'tr-1001',
    guestName: 'Claire & Marcus',
    phone: '(555) 234-5678',
    email: 'claire.marcus@example.com',
    partySize: 2,
    tableId: 't1',
    tableNumber: 'M-01',
    zone: 'Main Dining',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:18:00.000Z',
    type: 'walkin_immediate',
    status: 'seated',
    specialRequests: 'Window seat preference'
  },
  {
    id: 'tr-1002',
    guestName: 'Dave Smith Party',
    phone: '(555) 876-1234',
    email: 'dave.smith@techcorp.io',
    partySize: 4,
    tableId: 't3',
    tableNumber: 'M-03',
    zone: 'Main Dining',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:35:00.000Z',
    type: 'walkin_later',
    status: 'seated',
    specialRequests: 'Celebrating promotion'
  },
  {
    id: 'tr-1003',
    guestName: 'Liam Miller',
    phone: '(555) 345-6789',
    email: 'liam.m@designstudio.org',
    partySize: 3,
    tableId: 'p1',
    tableNumber: 'P-01',
    zone: 'Patio Outdoor',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:03:00.000Z',
    type: 'walkin_immediate',
    status: 'seated',
    specialRequests: 'Outdoor shaded table'
  },
  {
    id: 'tr-1004',
    guestName: 'Sophia K.',
    phone: '(555) 654-3210',
    email: 'sophia.k@fashionhub.com',
    partySize: 2,
    tableId: 'p4',
    tableNumber: 'P-04',
    zone: 'Patio Outdoor',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:43:00.000Z',
    type: 'walkin_immediate',
    status: 'seated'
  },
  {
    id: 'tr-1005',
    guestName: 'Dr. Harrison',
    phone: '(555) 901-2345',
    email: 'harrison.md@medcenter.org',
    partySize: 4,
    tableId: 'b1',
    tableNumber: 'B-01',
    zone: 'Private Booths',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:28:00.000Z',
    type: 'reservation',
    status: 'seated',
    specialRequests: 'Quiet corner for lunch interview'
  },
  {
    id: 'tr-1006',
    guestName: 'Tom & Alex',
    phone: '(555) 456-7890',
    email: 'tom.alex@creative.net',
    partySize: 2,
    tableId: 'l2',
    tableNumber: 'BAR-02',
    zone: 'Bar Lounge',
    date: '2026-08-10',
    seatedAt: '2026-08-10T12:41:00.000Z',
    type: 'walkin_immediate',
    status: 'seated'
  },

  // Today's Earlier Completed Turnovers (2026-08-10)
  {
    id: 'tr-1007',
    guestName: 'Hannah Abbott',
    phone: '(555) 111-2233',
    email: 'hannah.a@globalnet.com',
    partySize: 4,
    tableId: 't1',
    tableNumber: 'M-01',
    zone: 'Main Dining',
    date: '2026-08-10',
    seatedAt: '2026-08-10T11:00:00.000Z',
    completedAt: '2026-08-10T12:05:00.000Z',
    durationMinutes: 65,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-1008',
    guestName: 'Gregory Peck',
    phone: '(555) 222-3344',
    email: 'greg.peck@archfirm.com',
    partySize: 2,
    tableId: 't2',
    tableNumber: 'M-02',
    zone: 'Main Dining',
    date: '2026-08-10',
    seatedAt: '2026-08-10T11:15:00.000Z',
    completedAt: '2026-08-10T12:10:00.000Z',
    durationMinutes: 55,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-1009',
    guestName: 'Samantha Wu',
    phone: '(555) 333-4455',
    email: 'samantha.wu@biotech.io',
    partySize: 6,
    tableId: 't4',
    tableNumber: 'M-04',
    zone: 'Main Dining',
    date: '2026-08-10',
    seatedAt: '2026-08-10T11:20:00.000Z',
    completedAt: '2026-08-10T12:30:00.000Z',
    durationMinutes: 70,
    type: 'reservation',
    status: 'completed',
    specialRequests: 'Birthday dessert order'
  },
  {
    id: 'tr-1010',
    guestName: 'Oliver Queen',
    phone: '(555) 444-5566',
    email: 'oliver.q@starling.com',
    partySize: 2,
    tableId: 'p2',
    tableNumber: 'P-02',
    zone: 'Patio Outdoor',
    date: '2026-08-10',
    seatedAt: '2026-08-10T11:30:00.000Z',
    completedAt: '2026-08-10T12:15:00.000Z',
    durationMinutes: 45,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-1011',
    guestName: 'Priya Sharma',
    phone: '(555) 555-6677',
    email: 'priya.s@consulting.com',
    partySize: 3,
    tableId: 'b2',
    tableNumber: 'B-02',
    zone: 'Private Booths',
    date: '2026-08-10',
    seatedAt: '2026-08-10T11:10:00.000Z',
    completedAt: '2026-08-10T12:20:00.000Z',
    durationMinutes: 70,
    type: 'walkin_later',
    status: 'completed'
  },

  // August Earlier Days Historical Records (2026-08-09)
  {
    id: 'tr-0901',
    guestName: 'Nathaniel Drake',
    phone: '(555) 666-7788',
    email: 'nathan.drake@uncharted.org',
    partySize: 4,
    tableId: 't3',
    tableNumber: 'M-03',
    zone: 'Main Dining',
    date: '2026-08-09',
    seatedAt: '2026-08-09T18:00:00.000Z',
    completedAt: '2026-08-09T19:15:00.000Z',
    durationMinutes: 75,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-0902',
    guestName: 'Elena Fisher',
    phone: '(555) 777-8899',
    email: 'elena.f@journalism.com',
    partySize: 2,
    tableId: 'p3',
    tableNumber: 'P-03',
    zone: 'Patio Outdoor',
    date: '2026-08-09',
    seatedAt: '2026-08-09T18:30:00.000Z',
    completedAt: '2026-08-09T19:30:00.000Z',
    durationMinutes: 60,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-0903',
    guestName: 'Victor Sullivan',
    phone: '(555) 888-9900',
    email: 'sully@aviation.com',
    partySize: 5,
    tableId: 'v1',
    tableNumber: 'VIP-01',
    zone: 'VIP Room',
    date: '2026-08-09',
    seatedAt: '2026-08-09T19:00:00.000Z',
    completedAt: '2026-08-09T20:45:00.000Z',
    durationMinutes: 105,
    type: 'reservation',
    status: 'completed'
  },
  {
    id: 'tr-0904',
    guestName: 'Chloe Frazer',
    phone: '(555) 999-0011',
    email: 'chloe.f@expeditions.co',
    partySize: 3,
    tableId: 'b3',
    tableNumber: 'B-03',
    zone: 'Private Booths',
    date: '2026-08-09',
    seatedAt: '2026-08-09T19:15:00.000Z',
    completedAt: '2026-08-09T20:20:00.000Z',
    durationMinutes: 65,
    type: 'walkin_later',
    status: 'completed'
  },

  // August Earlier Days Historical Records (2026-08-08)
  {
    id: 'tr-0801',
    guestName: 'Garrus Vakarian',
    phone: '(555) 123-9876',
    email: 'garrus.v@citadel.gov',
    partySize: 6,
    tableId: 't4',
    tableNumber: 'M-04',
    zone: 'Main Dining',
    date: '2026-08-08',
    seatedAt: '2026-08-08T17:30:00.000Z',
    completedAt: '2026-08-08T19:00:00.000Z',
    durationMinutes: 90,
    type: 'reservation',
    status: 'completed'
  },
  {
    id: 'tr-0802',
    guestName: 'Liara T\'Soni',
    phone: '(555) 234-8765',
    email: 'liara.t@shadowbroker.net',
    partySize: 2,
    tableId: 't1',
    tableNumber: 'M-01',
    zone: 'Main Dining',
    date: '2026-08-08',
    seatedAt: '2026-08-08T18:00:00.000Z',
    completedAt: '2026-08-08T19:00:00.000Z',
    durationMinutes: 60,
    type: 'walkin_immediate',
    status: 'completed'
  },

  // July Historical Records (2026-07-28)
  {
    id: 'tr-0701',
    guestName: 'Arthur Dent',
    phone: '(555) 424-2424',
    email: 'arthur.dent@galaxy.com',
    partySize: 2,
    tableId: 'l1',
    tableNumber: 'BAR-01',
    zone: 'Bar Lounge',
    date: '2026-07-28',
    seatedAt: '2026-07-28T12:00:00.000Z',
    completedAt: '2026-07-28T13:00:00.000Z',
    durationMinutes: 60,
    type: 'walkin_immediate',
    status: 'completed'
  },
  {
    id: 'tr-0702',
    guestName: 'Ford Prefect',
    phone: '(555) 424-4242',
    email: 'ford.p@hitchhiker.org',
    partySize: 4,
    tableId: 't3',
    tableNumber: 'M-03',
    zone: 'Main Dining',
    date: '2026-07-28',
    seatedAt: '2026-07-28T13:15:00.000Z',
    completedAt: '2026-07-28T14:30:00.000Z',
    durationMinutes: 75,
    type: 'walkin_later',
    status: 'completed'
  }
];


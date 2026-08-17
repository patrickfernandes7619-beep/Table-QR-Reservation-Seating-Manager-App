import { Table, WaitlistEntry, RestaurantInfo, GuestTurnoverRecord } from './types';

export const initialRestaurantInfo: RestaurantInfo = {
  name: "QR Seating Restaurant Manager",
  address: "742 Evergreen Terrace, Downtown Food District",
  phone: "(555) 234-8901",
  tagline: "Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite",
  operatingHours: "Mon-Sun: 11:30 AM - 10:00 PM",
  deskInstructions: "Scan QR code to check in for immediate walk-in seating or reserve a table today.",
  welcomeMessage: "Welcome to QR Seating Restaurant Manager! Please scan to join our digital waitlist or select your preferred table.",
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

export const defaultPackages: import('./types').PlanDetails[] = [
  {
    id: 'starter',
    name: 'Package 1: Starter Front Desk',
    badge: 'Standard Lifetime License',
    oneTimePriceINR: 3999,
    oneTimePriceUSD: 49,
    idealFor: 'Small Bistros, Cafes, Bakeries & Fast-Casual Bars',
    description: 'One-time setup fee for essential digital table status grid, contactless customer walk-in booking & waitlist manager with instant QR stand generator.',
    features: [
      'One-Time Setup Fee (No Recurring Monthly Charges)',
      'Up to 15 Physical Tables & 2 Dining Zones',
      'Live Table Status Grid (Available, Seated, Billed, Cleaning)',
      'Dedicated Customer Online Booking URL (/reserve)',
      'Contactless QR Waitlist & Live Queue Codes',
      'One-Tap Table Turnover & Billing Tracking',
      'Mobile & Tablet Host Web Access',
      'Standard Setup & Onboarding Support'
    ]
  },
  {
    id: 'pro',
    name: 'Package 2: SmartHost Pro',
    badge: 'Most Popular Choice',
    popular: true,
    oneTimePriceINR: 6999,
    oneTimePriceUSD: 89,
    idealFor: 'Full-Service Dining, Busy Lounges, Steakhouses & Rooftops',
    description: 'Complete high-performance floor management suite with AI seating optimizer, multi-device live sync & printable acrylic stands — one-time investment.',
    features: [
      'One-Time Setup Fee (No Recurring Monthly Charges)',
      'Unlimited Physical Tables & Unlimited Custom Zones',
      'AI Smart Seating Optimizer (Party-to-Capacity Matcher)',
      'Real-Time Multi-Device Sync (Host Desk, Manager Phone, Servers)',
      'Full Custom Restaurant Branding & Logo Integration',
      'Printable Acrylic Counter Stand & Table Tent Card Generator',
      'Daily Turnover, Seated Guests & Peak-Hour Analytics',
      'Commission-Free Direct Online Booking System',
      'Priority Setup, Custom Floor Plan Digitization & 24/7 Support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Package 3: Enterprise Multi-Chain',
    badge: 'Multi-Location Chains',
    oneTimePriceINR: 14999,
    oneTimePriceUSD: 199,
    idealFor: 'Franchises, Hotel Dining Chains & High-Volume Resort Hubs',
    description: 'Multi-branch centralized host system with POS API integration, custom domain routing, dedicated account manager, and VIP white-label branding.',
    features: [
      'Multi-Location Centralized Dashboard',
      'Custom Domain (e.g., reserve.yourbrand.com)',
      'Custom POS & Kitchen Display API Integration',
      'Dedicated Customer Success & Hardware Setup',
      'Unlimited Staff Logins & Host Accounts',
      'White-Label QR Table Acrylic & Wood Stand Kits'
    ]
  }
];

export const defaultAppOwnerGatewayConfig: import('./types').AppOwnerGatewayConfig = {
  upiId: 'smarthost.billing@okhdfcbank',
  gpayNumber: '+91 98200 12345',
  merchantName: 'SmartHost Technologies & Table Billing',
  qrCodeUrl: '',
  bankAccountName: 'SmartHost Technologies Private Limited',
  bankAccountNumber: '50200088991122',
  bankIfscCode: 'HDFC0001234',
  bankName: 'HDFC Bank, Commercial Business Branch',
  bankSwiftCode: 'HDFCINBBXXX',
  bankAccountType: 'Current Corporate Account',
  enableBookingDeposit: true,
  depositAmountINR: 200,
  depositAmountUSD: 5,
  depositInstructions: 'Scan with Google Pay, PhonePe, Paytm or BHIM to confirm table reservation. Deposit is adjusted against your dining bill.'
};

export const initialTenants: import('./types').RestaurantTenant[] = [
  {
    id: 'rest-001',
    name: 'Bistro Lumière',
    tagline: 'Modern French-Italian Dining & Seasonal Artisanal Kitchen',
    ownerName: 'Maitre d\' Host Desk',
    ownerEmail: 'admin@bistrolumiere.com',
    phone: '(555) 234-8901',
    address: '742 Evergreen Terrace, Downtown Food District',
    packageId: 'pro',
    packageName: 'Package 2: SmartHost Pro',
    status: 'active',
    tablesCount: 16,
    totalReservationsCount: 142,
    joinedDate: '2026-07-15',
    lastPaymentDate: '2026-07-15',
    lastInvoiceId: 'INV-882101',
    notes: 'Premium rooftop & main dining zone activated. Acrylic QR stands generated.'
  },
  {
    id: 'rest-002',
    name: 'Trattoria Bella Roma',
    tagline: 'Authentic Woodfired Pizza & Handcrafted Pasta',
    ownerName: 'Marco Bellini',
    ownerEmail: 'marco@bellatromafood.com',
    phone: '+91 98201 55443',
    address: '45 Galleria Boulevard, Bandra West, Mumbai',
    packageId: 'starter',
    packageName: 'Package 1: Starter Front Desk',
    status: 'active',
    tablesCount: 12,
    totalReservationsCount: 89,
    joinedDate: '2026-07-28',
    lastPaymentDate: '2026-07-28',
    lastInvoiceId: 'INV-773412',
    notes: 'Starter lifetime license. Upgraded floor plan with patio tables.'
  },
  {
    id: 'rest-003',
    name: 'The Golden Wok & Bar',
    tagline: 'Pan-Asian Dumplings, Teppanyaki & Craft Cocktails',
    ownerName: 'Kenji Sato',
    ownerEmail: 'kenji@goldenwokbar.com',
    phone: '+91 97699 88123',
    address: 'Level 3, Skyview Mall, Cyber City, Gurugram',
    packageId: 'pro',
    packageName: 'Package 2: SmartHost Pro',
    status: 'active',
    tablesCount: 24,
    totalReservationsCount: 215,
    joinedDate: '2026-08-01',
    lastPaymentDate: '2026-08-01',
    lastInvoiceId: 'INV-990423',
    notes: 'Full multi-zone seating (VIP, Lounge, Dining). Google Pay QR verified.'
  },
  {
    id: 'rest-004',
    name: 'Ocean Breeze Seafood Grill',
    tagline: 'Fresh Catch, Oyster Bar & Coastal Cocktails',
    ownerName: 'Sarah Jenkins',
    ownerEmail: 'sarah@oceanbreezegrill.com',
    phone: '+1 (555) 789-2233',
    address: '102 Marina Promenade, Santa Monica, CA',
    packageId: 'starter',
    packageName: 'Package 1: Starter Front Desk',
    status: 'trial',
    tablesCount: 10,
    totalReservationsCount: 34,
    joinedDate: '2026-08-09',
    lastPaymentDate: '2026-08-09',
    lastInvoiceId: 'INV-441092',
    notes: 'Trial period ending in 7 days. Customer interested in SmartHost Pro upgrade.'
  }
];

export const initialSubscriptionPayments: import('./types').SubscriptionPayment[] = [
  {
    id: 'pay-001',
    invoiceId: 'INV-882101',
    restaurantId: 'rest-001',
    restaurantName: 'Bistro Lumière',
    clientName: 'Maitre d\' Host Desk',
    clientEmail: 'admin@bistrolumiere.com',
    clientPhone: '(555) 234-8901',
    packageId: 'pro',
    packageName: 'Package 2: SmartHost Pro',
    amount: 6999,
    currency: 'INR',
    method: 'Google Pay / UPI (smarthost.billing@okhdfcbank)',
    refNumber: 'UPI-UTR-9821839281',
    date: '2026-07-15',
    time: '02:30 PM',
    status: 'VERIFIED',
    notes: 'Lifetime SmartHost Pro License setup paid via Google Pay.'
  },
  {
    id: 'pay-002',
    invoiceId: 'INV-773412',
    restaurantId: 'rest-002',
    restaurantName: 'Trattoria Bella Roma',
    clientName: 'Marco Bellini',
    clientEmail: 'marco@bellatromafood.com',
    clientPhone: '+91 98201 55443',
    packageId: 'starter',
    packageName: 'Package 1: Starter Front Desk',
    amount: 3999,
    currency: 'INR',
    method: 'Google Pay / UPI (smarthost.billing@okhdfcbank)',
    refNumber: 'UPI-UTR-6629108392',
    date: '2026-07-28',
    time: '11:45 AM',
    status: 'VERIFIED',
    notes: 'Starter front desk package paid via GPay.'
  },
  {
    id: 'pay-003',
    invoiceId: 'INV-990423',
    restaurantId: 'rest-003',
    restaurantName: 'The Golden Wok & Bar',
    clientName: 'Kenji Sato',
    clientEmail: 'kenji@goldenwokbar.com',
    clientPhone: '+91 97699 88123',
    packageId: 'pro',
    packageName: 'Package 2: SmartHost Pro',
    amount: 6999,
    currency: 'INR',
    method: 'Bank Transfer / NEFT (HDFC Bank)',
    refNumber: 'NEFT-HDFC-992019482',
    date: '2026-08-01',
    time: '04:15 PM',
    status: 'VERIFIED',
    notes: 'SmartHost Pro license activated via direct corporate NEFT.'
  },
  {
    id: 'pay-004',
    invoiceId: 'INV-441092',
    restaurantId: 'rest-004',
    restaurantName: 'Ocean Breeze Seafood Grill',
    clientName: 'Sarah Jenkins',
    clientEmail: 'sarah@oceanbreezegrill.com',
    clientPhone: '+1 (555) 789-2233',
    packageId: 'starter',
    packageName: 'Package 1: Starter Front Desk',
    amount: 49,
    currency: 'USD',
    method: 'Google Pay / UPI (smarthost.billing@okhdfcbank)',
    refNumber: 'GPAY-USD-88392019',
    date: '2026-08-09',
    time: '09:10 AM',
    status: 'VERIFIED',
    notes: 'USD Starter Package payment.'
  }
];

export const initialReviews: import('./types').AppReview[] = [
  {
    id: 'rev-01',
    authorName: 'Chef Antoine Laurent',
    role: 'Executive Chef & Owner',
    restaurantName: 'Bistro Lumière',
    location: 'Downtown District',
    rating: 5,
    date: '2026-08-05',
    reviewTitle: 'Eliminated our 3rd-party booking commissions completely!',
    comment: 'Before installing the Table QR Seating Manager, we were paying over ₹40,000 every month in per-cover aggregator commission fees. The QR table stands look stunning on our marble tables, and our walk-in guests love scanning and joining our digital queue directly.',
    verified: true,
    statsHighlight: 'Saved ₹42,000/mo in commissions',
    tag: 'Fine Dining'
  },
  {
    id: 'rev-02',
    authorName: 'Marco Bellini',
    role: 'General Manager',
    restaurantName: 'Trattoria Bella Roma',
    location: 'Bandra West, Mumbai',
    rating: 5,
    date: '2026-08-02',
    reviewTitle: '35% faster table turnover during prime weekend dinner rush',
    comment: 'The live color-coded floor plan and cleaning timer feature made our host desk twice as fast. As soon as a table bills, our bussers are notified and our host seats the next party in under 2 minutes. The Google Pay UPI setup took 30 seconds.',
    verified: true,
    statsHighlight: '+35% Faster Turnover',
    tag: 'Casual Dining'
  },
  {
    id: 'rev-03',
    authorName: 'Kenji Sato',
    role: 'Director of Operations',
    restaurantName: 'The Golden Wok & Bar',
    location: 'Cyber City, Gurugram',
    rating: 5,
    date: '2026-07-29',
    reviewTitle: 'Flawless multi-zone management for 24 tables & VIP rooms',
    comment: 'Managing outdoor rooftop patio tables alongside VIP dining suites used to cause double-bookings on paper. SmartHost resolved everything. The printable acrylic counter stands generated right from the app are crisp and professional.',
    verified: true,
    statsHighlight: 'Zero Double Bookings',
    tag: 'Multi-Zone Lounge'
  },
  {
    id: 'rev-04',
    authorName: 'Sarah Jenkins',
    role: 'Proprietor',
    restaurantName: 'Ocean Breeze Seafood Grill',
    location: 'Santa Monica, CA',
    rating: 5,
    date: '2026-07-22',
    reviewTitle: 'Customers love the contactless SMS waitlist experience',
    comment: 'Guests scan the QR stand at the entrance, receive their queue ticket with live time estimate, and can stroll around while waiting. Walk-in dropoffs dropped by 90% in our first two weeks.',
    verified: true,
    statsHighlight: '90% Fewer Walk-in Dropoffs',
    tag: 'Seafood & Grill'
  },
  {
    id: 'rev-05',
    authorName: 'Priya Sharma',
    role: 'Operations Consultant',
    restaurantName: 'Artisan Cafe & Bakery',
    location: 'Indiranagar, Bangalore',
    rating: 5,
    date: '2026-07-18',
    reviewTitle: 'Patrick Ferns built the ideal solution for modern dining',
    comment: 'The one-time lifetime license model with direct GPay payment gateway is a breath of fresh air compared to predatory SaaS subscriptions. Support from the app maker Patrick Ferns is stellar and responsive.',
    verified: true,
    statsHighlight: '100% Reliable Architecture',
    tag: 'Cafe & Bakery'
  }
];



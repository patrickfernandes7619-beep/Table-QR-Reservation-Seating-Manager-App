import React from 'react';
import {
  LayoutDashboard,
  Utensils,
  QrCode,
  Smartphone,
  Printer,
  BarChart3,
  RefreshCw,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  LogOut,
  BookmarkCheck
} from 'lucide-react';
import { RestaurantInfo, UserSession } from '../types';
import { getRestaurantOperatingStatus } from '../utils/dateUtils';

export type AdminTabType = 'floorplan' | 'waitlist' | 'tables' | 'diner_booking' | 'customer' | 'qrstand' | 'analytics';

interface HeaderProps {
  restaurant: RestaurantInfo;
  user?: UserSession | null;
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  waitingCount: number;
  onSwitchToCustomer?: () => void;
  onSwitchToOwnerDashboard?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  restaurant,
  user,
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  waitingCount,
  onSwitchToCustomer,
  onSwitchToOwnerDashboard,
  onLogout
}) => {
  const [timeStr, setTimeStr] = React.useState<string>('');
  const [operatingStatus, setOperatingStatus] = React.useState(() => 
    getRestaurantOperatingStatus(restaurant.operatingHours)
  );

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setOperatingStatus(getRestaurantOperatingStatus(restaurant.operatingHours, now));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [restaurant.operatingHours]);

  // Use currentBusinessDate from restaurant if manually set, otherwise use live calculated status
  const activeDateDisplay = operatingStatus.formattedDate || restaurant.currentBusinessDate;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between py-2.5 sm:py-3 gap-3">
          
          {/* Restaurant Branding & Maître d' Host Desk Info */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold text-xl overflow-hidden shrink-0">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                {/* 1. Restaurant Name */}
                <h1 className="font-bold text-lg sm:text-xl text-slate-100 tracking-tight">{restaurant.name}</h1>

                {/* 2. Tagline (2 lines) - between restaurant name and real time */}
                {restaurant.tagline && (
                  <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-snug max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                    {restaurant.tagline}
                  </p>
                )}

                {/* 3. Real-Time Digital Clock & Live Status */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                  {/* Real-time Digital Clock */}
                  <span className="bg-slate-950 text-amber-400 border border-slate-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-inner">
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                    {timeStr || '12:00:00 PM'}
                  </span>

                  {/* Real-time Business Date Badge */}
                  <span className="hidden sm:inline-flex bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    {activeDateDisplay}
                  </span>

                  {/* Real-time Operating Status Badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                    operatingStatus.isOpen 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${operatingStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {operatingStatus.statusText}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Logged User Info */}
            <div className="lg:hidden text-right">
              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user ? user.name : 'Host Terminal'}
              </div>
            </div>
          </div>

          {/* Top Navigation Mode Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full w-full lg:w-auto justify-start lg:justify-center">
            <button
              onClick={() => setActiveTab('floorplan')}
              id="top-nav-floorplan"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'floorplan'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Floor Plan
            </button>

            <button
              onClick={() => setActiveTab('waitlist')}
              id="top-nav-waitlist"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap relative ${
                activeTab === 'waitlist'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Waitlist & Walk-Ins
              {waitingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'waitlist' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                }`}>
                  {waitingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              id="top-nav-tables"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Tables & QRs
            </button>

            <button
              onClick={() => setActiveTab('diner_booking')}
              id="top-nav-diner-booking"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'diner_booking'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Quick Diner Booking
            </button>

            <button
              onClick={() => setActiveTab('customer')}
              id="top-nav-counterqr"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'customer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Counter Scan QR
            </button>

            <button
              onClick={() => setActiveTab('qrstand')}
              id="top-nav-qrstand"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'qrstand'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Print Desk Stand
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              id="top-nav-analytics"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>

          {/* Right Quick Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {onSwitchToCustomer && (
              <button
                onClick={onSwitchToCustomer}
                id="top-btn-diner-view"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Quick Diner Booking"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                Diner Booking
              </button>
            )}

            <div className="text-right">
              <div className="text-xs font-medium text-slate-300">
                {user ? user.name : 'Host Terminal'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                {user?.role ? `${user.role.toUpperCase()} SESSION` : 'ADMIN DESK'}
              </div>
            </div>

            <button
              onClick={onRefresh}
              id="top-btn-refresh"
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ${
                isRefreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="Sync live status with server"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                id="top-btn-logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};



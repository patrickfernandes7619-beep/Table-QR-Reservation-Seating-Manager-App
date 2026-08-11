import React from 'react';
import { QrCode, LayoutDashboard, Smartphone, Printer, Settings, BarChart3, Utensils, RefreshCw, Calendar, Clock } from 'lucide-react';
import { RestaurantInfo } from '../types';
import { getRestaurantOperatingStatus } from '../utils/dateUtils';

interface HeaderProps {
  restaurant: RestaurantInfo;
  activeTab: 'floorplan' | 'waitlist' | 'tables' | 'customer' | 'qrstand' | 'analytics';
  setActiveTab: (tab: 'floorplan' | 'waitlist' | 'tables' | 'customer' | 'qrstand' | 'analytics') => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  waitingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  restaurant,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onRefresh,
  isRefreshing,
  waitingCount
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
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Restaurant Branding & Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold text-xl overflow-hidden shrink-0">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-bold text-lg text-slate-100 tracking-tight">{restaurant.name}</h1>
                  
                  {/* Real-time Business Date Badge */}
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    {activeDateDisplay}
                  </span>

                  {/* Real-time Operating Status Badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    operatingStatus.isOpen 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${operatingStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {operatingStatus.statusText}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">{restaurant.tagline}</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onRefresh}
                className={`p-2 text-slate-400 hover:text-white rounded-lg transition ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}
                title="Sync with server"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
                title="Restaurant Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('floorplan')}
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
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'customer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Customer Walk-In Scan
            </button>

            <button
              onClick={() => setActiveTab('qrstand')}
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

          {/* Right Clock & Host Controls */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">{timeStr}</div>
              <div className="text-[10px] text-slate-400">Desk Terminal #01</div>
            </div>

            <button
              onClick={onRefresh}
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ${
                isRefreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="Sync live status with server"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Restaurant & Desk Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

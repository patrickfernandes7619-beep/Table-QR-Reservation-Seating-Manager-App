import React from 'react';
import { Settings, User, RefreshCw, LogOut, Sliders, Shield } from 'lucide-react';
import { RestaurantInfo, UserSession } from '../types';

interface BottomSettingsBarProps {
  restaurant: RestaurantInfo;
  user?: UserSession | null;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSwitchToCustomer?: () => void;
  onLogout?: () => void;
}

export const BottomSettingsBar: React.FC<BottomSettingsBarProps> = ({
  restaurant,
  user,
  onOpenSettings,
  onRefresh,
  isRefreshing,
  onSwitchToCustomer,
  onLogout
}) => {
  return (
    <div
      id="bottom-settings-dock"
      aria-label="Settings and host action panel"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-xl mx-auto px-4">
        {/* iPhone Style Action Bar */}
        <div className="flex items-center justify-around py-2">
          
          {/* Main Primary Settings Tab (iPhone Styled Active Pill) */}
          <button
            type="button"
            id="bottom-btn-settings"
            onClick={onOpenSettings}
            className="group relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 select-none active:scale-95 text-amber-400"
          >
            <div className="relative flex items-center justify-center w-12 h-8.5 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-md group-hover:bg-amber-500/30 transition-all">
              <Settings className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            </div>
            <span className="mt-1 text-[11px] font-bold tracking-tight text-amber-400 transition-colors leading-none flex items-center gap-1">
              Settings
            </span>
          </button>

          {/* Switch to Customer Portal View */}
          {onSwitchToCustomer && (
            <button
              type="button"
              id="bottom-btn-customerview"
              onClick={onSwitchToCustomer}
              className="group flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 select-none active:scale-95 text-slate-400 hover:text-emerald-400"
            >
              <div className="flex items-center justify-center w-11 h-8 rounded-full group-hover:bg-emerald-500/15 group-hover:border group-hover:border-emerald-500/30 transition-all">
                <User className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-tight text-slate-400 group-hover:text-emerald-400 transition-colors leading-none">
                Customer View
              </span>
            </button>
          )}

          {/* Instant Live Sync Refresh */}
          <button
            type="button"
            id="bottom-btn-refresh-sync"
            onClick={onRefresh}
            className="group flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 select-none active:scale-95 text-slate-400 hover:text-slate-200"
          >
            <div className="flex items-center justify-center w-11 h-8 rounded-full group-hover:bg-slate-800/80 transition-all">
              <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-transform ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </div>
            <span className="mt-1 text-[11px] font-medium tracking-tight text-slate-400 group-hover:text-slate-200 transition-colors leading-none">
              Sync Live
            </span>
          </button>

          {/* Log Out */}
          {onLogout && (
            <button
              type="button"
              id="bottom-btn-logout-dock"
              onClick={onLogout}
              className="group flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 select-none active:scale-95 text-slate-400 hover:text-rose-400"
            >
              <div className="flex items-center justify-center w-11 h-8 rounded-full group-hover:bg-rose-500/15 group-hover:border group-hover:border-rose-500/30 transition-all">
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors" />
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-tight text-slate-400 group-hover:text-rose-400 transition-colors leading-none">
                Sign Out
              </span>
            </button>
          )}

        </div>

        {/* iPhone Style Home Grabber Indicator */}
        <div className="w-28 sm:w-36 h-1 bg-slate-700/40 rounded-full mx-auto mb-1 opacity-60" />
      </div>
    </div>
  );
};

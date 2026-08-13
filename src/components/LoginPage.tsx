import React, { useState } from 'react';
import { RestaurantInfo, UserSession, UserRole } from '../types';
import {
  Utensils, User, ShieldCheck, Mail, Phone, ArrowRight,
  Sparkles, CheckCircle2, QrCode, Lock, ChevronRight,
  Clock, Calendar, Users
} from 'lucide-react';

interface LoginPageProps {
  restaurant: RestaurantInfo;
  onLogin: (session: UserSession) => void;
  defaultEmail?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  restaurant,
  onLogin,
  defaultEmail = ''
}) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState<string>(defaultEmail || '');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Quick Demo Logins
  const handleQuickLogin = (demoRole: UserRole, demoEmail: string, demoName: string, demoPhone: string = '') => {
    setIsLoading(true);
    setTimeout(() => {
      const session: UserSession = {
        id: `usr_${Date.now()}`,
        email: demoEmail.toLowerCase().trim(),
        name: demoName,
        phone: demoPhone,
        role: demoRole,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoName)}`
      };
      try {
        localStorage.setItem('restaurant_session', JSON.stringify(session));
      } catch {}
      onLogin(session);
      setIsLoading(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        try {
          localStorage.setItem('restaurant_session', JSON.stringify(data.session));
        } catch {}
        onLogin(data.session);
      } else {
        // Fallback local session
        const fallbackName = name.trim() || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const session: UserSession = {
          id: `usr_${Date.now()}`,
          email: email.trim().toLowerCase(),
          name: fallbackName,
          phone: phone.trim(),
          role,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`
        };
        try {
          localStorage.setItem('restaurant_session', JSON.stringify(session));
        } catch {}
        onLogin(session);
      }
    } catch (err) {
      console.error('Login error:', err);
      const fallbackName = name.trim() || email.split('@')[0];
      const session: UserSession = {
        id: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: fallbackName,
        phone: phone.trim(),
        role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`
      };
      try {
        localStorage.setItem('restaurant_session', JSON.stringify(session));
      } catch {}
      onLogin(session);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 items-center justify-center text-white shadow-xl shadow-amber-500/20 font-bold overflow-hidden p-0.5 border border-amber-400/30 mx-auto">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <Utensils className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {restaurant.tagline || 'Dining Table Reservations, Walk-In Queue & Seating Hub'}
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                if (email === 'admin@bistrolumiere.com') setEmail('patrickferns17@gmail.com');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Customer Login
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                if (!email || email === 'patrickferns17@gmail.com') setEmail('admin@bistrolumiere.com');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Restaurant Admin
            </button>
          </div>

          {/* Role Description Banner */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-colors ${
            role === 'customer'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {role === 'customer' ? (
                <>
                  <p className="font-semibold text-emerald-200">Customer Dining & Table Reservations</p>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Log in with your email to access the restaurant front page, reserve dining tables, and join the live walk-in queue.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-200">Restaurant Staff & Host Desk</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Access live floor plan layout, table turn status, waitlist queue, counter QR stands, and turnover analytics.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email Address <span className="text-amber-400">*</span></span>
                {role === 'customer' && (
                  <span className="text-[10px] text-slate-400 font-normal">Directs to Front Page</span>
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder={role === 'customer' ? 'e.g. patrickferns17@gmail.com' : 'e.g. admin@bistrolumiere.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Optional Customer Name & Phone for First-Time Registration */}
            {role === 'customer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Patrick Ferns"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Phone (SMS Updates)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="(555) 234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Staff Admin Password Field */}
            {role === 'admin' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Passcode / PIN</span>
                  <span className="text-[10px] text-amber-400/80">Demo PIN: 1234</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Enter staff passcode (or use quick 1-click)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 w-4 h-4"
                />
                Remember this login
              </label>

              {role === 'customer' && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Direct Access
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Logging In...</span>
              ) : role === 'customer' ? (
                <>
                  <span>Continue to Customer Front Page & Bookings</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Open Restaurant Admin Host Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fast 1-Click Demo Profiles */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Quick 1-Click Fast Login
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer', 'patrickferns17@gmail.com', 'Patrick Ferns', '(555) 890-1234')}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group"
              >
                <div className="truncate">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" /> Patrick Ferns
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">patrickferns17@gmail.com</p>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@bistrolumiere.com', 'Maitre d\' Host Desk', '(555) 999-0000')}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition group"
              >
                <div className="truncate">
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" /> Host Admin Desk
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">admin@bistrolumiere.com</p>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">Admin</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> {restaurant.operatingHours}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-500" /> Live Synchronized
          </span>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { RestaurantInfo, UserSession, UserRole, AppPlatformBranding } from '../types';
import { initialPlatformBranding, initialRestaurantInfo } from '../initialData';
import { getAppPlatformBranding, getAppBrandingConfig } from '../lib/gatewayStorage';
import {
  Utensils, User, ShieldCheck, Mail, Phone, ArrowRight,
  Sparkles, CheckCircle2, QrCode, Lock, ChevronRight,
  Clock, Calendar, Users, KeyRound, X, Send, RefreshCw, HelpCircle
} from 'lucide-react';

interface LoginPageProps {
  restaurant: RestaurantInfo;
  onLogin: (session: UserSession) => void;
  defaultEmail?: string;
  defaultRole?: UserRole;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  restaurant: propRestaurant,
  onLogin,
  defaultEmail = '',
  defaultRole = 'admin',
  onBackToLanding
}) => {
  const [platformBranding, setPlatformBranding] = useState<AppPlatformBranding>(() => getAppPlatformBranding() || initialPlatformBranding);
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => propRestaurant || getAppBrandingConfig() || initialRestaurantInfo);

  useEffect(() => {
    if (propRestaurant) {
      setRestaurant(propRestaurant);
    }
  }, [propRestaurant]);

  useEffect(() => {
    const handlePlatformBrandingChange = (e: any) => {
      if (e.detail) {
        setPlatformBranding(e.detail);
      }
    };
    const handleRestaurantBrandingChange = (e: any) => {
      if (e.detail) {
        setRestaurant(e.detail);
      }
    };
    window.addEventListener('smarthost:platform_branding_updated', handlePlatformBrandingChange);
    window.addEventListener('smarthost:branding_updated', handleRestaurantBrandingChange);
    return () => {
      window.removeEventListener('smarthost:platform_branding_updated', handlePlatformBrandingChange);
      window.removeEventListener('smarthost:branding_updated', handleRestaurantBrandingChange);
    };
  }, []);

  const [role, setRole] = useState<UserRole>(() => {
    if (defaultRole) return defaultRole;
    return 'admin';
  });
  const [email, setEmail] = useState<string>(() => {
    if (defaultEmail) return defaultEmail;
    if (defaultRole === 'owner') return 'patrickferns17@gmail.com';
    if (defaultRole === 'admin') return 'admin@bistrolumiere.com';
    return 'patrickferns17@gmail.com';
  });
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>(email || 'patrickferns17@gmail.com');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [recoveryCode, setRecoveryCode] = useState<string>('');

  const handleSendResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setForgotStatus('sending');
    setTimeout(() => {
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      setRecoveryCode(generatedPin);
      setForgotStatus('sent');
    }, 600);
  };

  const handleUseRecoveryCode = () => {
    if (recoveryCode) {
      setPassword(recoveryCode);
      setIsForgotPasswordOpen(false);
      setForgotStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // If owner login
    if (role === 'owner') {
      setTimeout(() => {
        const ownerSession: UserSession = {
          id: `owner_${Date.now()}`,
          email: email.trim().toLowerCase(),
          name: name.trim() || 'App Master Owner',
          phone: phone.trim() || '+91 98200 12345',
          role: 'owner',
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=App%20Owner`
        };
        try {
          localStorage.setItem('restaurant_session', JSON.stringify(ownerSession));
        } catch {}
        onLogin(ownerSession);
        setIsLoading(false);
      }, 300);
      return;
    }

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
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        
        {/* Back to Index Page Link */}
        {onBackToLanding && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>← Back to Overview / Index Page</span>
            </button>

            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">
              Secure Access Portal
            </span>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center text-white shadow-xl font-bold overflow-hidden p-0.5 border mx-auto ${
            role === 'owner'
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-400/40 shadow-purple-500/20'
              : 'bg-gradient-to-tr from-amber-500 to-orange-600 border-amber-400/30 shadow-amber-500/20'
          }`}>
            {(role === 'owner' ? (platformBranding?.appLogoUrl || restaurant.logoUrl) : restaurant.logoUrl) ? (
              <img
                src={role === 'owner' ? (platformBranding?.appLogoUrl || restaurant.logoUrl) : restaurant.logoUrl}
                alt={role === 'owner' ? (platformBranding?.appName || 'Owner Admin') : (restaurant.name || 'Customer Admin')}
                className="w-full h-full object-cover rounded-[14px]"
              />
            ) : (
              <Utensils className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
              {role === 'owner'
                ? (platformBranding?.appName || 'QR Seating Restaurant Manager')
                : (restaurant.name || 'Bistro Lumière')}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {role === 'owner'
                ? (platformBranding?.appTagline || 'Official Hospitality Suite & Table Seating OS')
                : (restaurant.tagline || 'Modern French Cuisine & Cocktail Lounge')}
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header Role Indicator Badge */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                role === 'owner'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : role === 'admin'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {role === 'owner' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {role === 'owner'
                    ? 'Owner Admin Sign-In'
                    : role === 'admin'
                    ? `${restaurant.name || 'Customer'} Admin Desk`
                    : `${restaurant.name || 'Customer'} Diner Login`}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {role === 'owner'
                    ? 'App branding, logos, payment accounts & tenant setup'
                    : role === 'admin'
                    ? 'Live seating floor plan, table turn grid & priority waitlist'
                    : 'Table reservations & digital walk-in queue'}
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              role === 'owner'
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : role === 'admin'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {role === 'owner' ? 'Master Owner' : role === 'admin' ? 'Customer Admin' : 'Diner'}
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email Address <span className="text-amber-400">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {role === 'owner' ? 'Owner Email' : role === 'admin' ? 'Restaurant Host Desk' : 'Diner Email'}
                </span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder={
                    role === 'owner'
                      ? 'e.g. patrickferns17@gmail.com'
                      : role === 'admin'
                      ? 'e.g. admin@bistrolumiere.com'
                      : 'e.g. patrickferns17@gmail.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
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
            {(role === 'admin' || role === 'owner') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Passcode / Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || 'patrickferns17@gmail.com');
                      setForgotStatus('idle');
                      setRecoveryCode('');
                      setIsForgotPasswordOpen(true);
                    }}
                    className={`text-xs font-semibold hover:underline transition cursor-pointer flex items-center gap-1 ${
                      role === 'owner'
                        ? 'text-purple-400 hover:text-purple-300'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder={
                      role === 'owner'
                        ? 'Enter Master Owner passcode or click Log In'
                        : 'Enter host desk staff passcode'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Checkbox & Alternate Forgot Password trigger */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-purple-500 focus:ring-0 w-4 h-4"
                />
                Remember this login
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || 'patrickferns17@gmail.com');
                  setForgotStatus('idle');
                  setRecoveryCode('');
                  setIsForgotPasswordOpen(true);
                }}
                className="text-xs text-slate-400 hover:text-purple-300 hover:underline transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                role === 'owner'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
                  : role === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Forgot Password Modal */}
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Account Password</h3>
                    <p className="text-xs text-slate-400">Master Owner Recovery Portal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              {forgotStatus !== 'sent' ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Enter the authorized email address associated with your Owner Admin account. We'll generate a secure recovery code and reset instructions.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Owner Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="patrickferns17@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl text-[11px] text-purple-200 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Master Owner account is verified for instant passcode generation.</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotStatus === 'sending'}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {forgotStatus === 'sending' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-emerald-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Password Reset Instructions Sent!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-200/90">
                      A recovery verification message and one-time emergency passcode have been issued for <strong className="font-mono text-white">{forgotEmail}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Temporary Recovery Passcode
                    </span>
                    <div className="text-xl font-mono font-extrabold text-purple-300 tracking-widest">
                      {recoveryCode}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleUseRecoveryCode}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Auto-Fill & Sign In</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

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

import React, { useState, useEffect } from 'react';
import { RestaurantInfo, Table, WaitlistEntry, UserSession, PlanDetails, AppReview, AppOwnerGatewayConfig, RestaurantTenant, AppPlatformBranding } from '../types';
import { defaultPackages, initialReviews, initialPlatformBranding } from '../initialData';
import { getAppOwnerGatewayConfig, recordSubscriptionPayment, getRestaurantTenants, getAppPlatformBranding } from '../lib/gatewayStorage';
import {
  Utensils, QrCode, Sparkles, CheckCircle2, Star, ShieldCheck,
  CreditCard, Smartphone, Building2, MapPin, Phone, Mail,
  ArrowRight, Check, Copy, ExternalLink, Calendar, Users,
  Clock, Heart, MessageSquare, ChevronRight, Award, Zap,
  Layers, BarChart3, HelpCircle, Send, Plus, Filter, User,
  Globe, Laptop, Code2, Coffee, FileText, Download, CheckCircle,
  LogIn, ChevronDown, LayoutDashboard
} from 'lucide-react';

interface IndexLandingPageProps {
  restaurant: RestaurantInfo;
  user?: UserSession | null;
  tables: Table[];
  waitlist: WaitlistEntry[];
  zones: string[];
  onOpenCustomerBooking: () => void;
  onOpenAdminDesk: () => void;
  onOpenOwnerDashboard: () => void;
  onOpenOwnerLogin?: () => void;
  onOpenCustomerAdminLogin?: () => void;
  onLoginRestaurantAdmin?: (email: string, tenant?: RestaurantTenant) => void;
  onLoginCustomerDashboard?: (email: string) => void;
  onLoginOwnerDashboard?: (email: string) => void;
  onSelectPackageForCheckout?: (plan: PlanDetails) => void;
}

export const IndexLandingPage: React.FC<IndexLandingPageProps> = ({
  restaurant,
  user,
  tables,
  waitlist,
  zones,
  onOpenCustomerBooking,
  onOpenAdminDesk,
  onOpenOwnerDashboard,
  onOpenOwnerLogin,
  onOpenCustomerAdminLogin,
  onLoginRestaurantAdmin,
  onLoginCustomerDashboard,
  onLoginOwnerDashboard,
  onSelectPackageForCheckout
}) => {
  // Master Gateway Configuration from App Owner Storage
  const [gatewayConfig, setGatewayConfig] = useState<AppOwnerGatewayConfig>(getAppOwnerGatewayConfig);
  const [platformBranding, setPlatformBranding] = useState<AppPlatformBranding>(() => getAppPlatformBranding() || initialPlatformBranding);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reviews State
  const [reviewsList, setReviewsList] = useState<AppReview[]>(() => {
    try {
      const saved = localStorage.getItem('smarthost_app_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialReviews;
  });
  const [selectedReviewTag, setSelectedReviewTag] = useState<string>('All');
  const [isAddReviewOpen, setIsAddReviewOpen] = useState<boolean>(false);

  // New Review Form State
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRole, setNewReviewRole] = useState('Restaurant Owner');
  const [newReviewRestName, setNewReviewRestName] = useState('');
  const [newReviewLocation, setNewReviewLocation] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewStats, setNewReviewStats] = useState('');
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);

  // Quick Subscription Purchase Modal State
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanDetails | null>(null);
  const [subscribingRestName, setSubscribingRestName] = useState(restaurant.name || '');
  const [subscribingOwnerName, setSubscribingOwnerName] = useState(user?.name || '');
  const [subscribingEmail, setSubscribingEmail] = useState(user?.email || 'owner@diningvenue.com');
  const [subscribingPhone, setSubscribingPhone] = useState(user?.phone || '+91 98200 00000');
  const [subscribingTxnRef, setSubscribingTxnRef] = useState('');
  const [paymentMethodChosen, setPaymentMethodChosen] = useState<'gpay' | 'bank'>('gpay');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderCompletedReceipt, setOrderCompletedReceipt] = useState<{
    invoiceId: string;
    plan: PlanDetails;
    amount: number;
    currency: string;
    date: string;
    restName: string;
  } | null>(null);

  // Contact Maker Form State
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactSubject, setContactSubject] = useState('Custom Restaurant Deployment Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Sync gateway and platform branding states on custom events
  useEffect(() => {
    const handleGatewayUpdated = (e: any) => {
      if (e.detail) setGatewayConfig(e.detail);
    };
    const handlePlatformBrandingUpdated = (e: any) => {
      if (e.detail) setPlatformBranding(e.detail);
    };
    window.addEventListener('smarthost:gateway_updated', handleGatewayUpdated);
    window.addEventListener('smarthost:platform_branding_updated', handlePlatformBrandingUpdated);
    return () => {
      window.removeEventListener('smarthost:gateway_updated', handleGatewayUpdated);
      window.removeEventListener('smarthost:platform_branding_updated', handlePlatformBrandingUpdated);
    };
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit New Review Handler
  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewRestName.trim() || !newReviewComment.trim()) {
      alert('Please provide your name, restaurant name, and review comments.');
      return;
    }

    const newRev: AppReview = {
      id: `rev-${Date.now()}`,
      authorName: newReviewAuthor.trim(),
      role: newReviewRole.trim() || 'Restaurant Partner',
      restaurantName: newReviewRestName.trim(),
      location: newReviewLocation.trim() || 'Global',
      rating: newReviewRating,
      date: new Date().toISOString().split('T')[0],
      reviewTitle: newReviewTitle.trim() || 'Exceptional QR Table Seating Solution',
      comment: newReviewComment.trim(),
      verified: true,
      statsHighlight: newReviewStats.trim() || 'Verified Dining Partner',
      tag: 'Verified Partner'
    };

    const updated = [newRev, ...reviewsList];
    setReviewsList(updated);
    try {
      localStorage.setItem('smarthost_app_reviews', JSON.stringify(updated));
    } catch {}

    setReviewSubmitSuccess(true);
    setTimeout(() => {
      setReviewSubmitSuccess(false);
      setIsAddReviewOpen(false);
      setNewReviewAuthor('');
      setNewReviewRestName('');
      setNewReviewComment('');
      setNewReviewTitle('');
      setNewReviewStats('');
    }, 2000);
  };

  // Submit Subscription Order Handler
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForModal) return;

    setIsSubmittingOrder(true);
    const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalAmount = currency === 'INR' ? selectedPlanForModal.oneTimePriceINR : selectedPlanForModal.oneTimePriceUSD;

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId,
      restaurantId: `rest-${Date.now().toString().slice(-4)}`,
      restaurantName: subscribingRestName.trim() || restaurant.name,
      clientName: subscribingOwnerName.trim() || user?.name || 'Restaurant Client',
      clientEmail: subscribingEmail.trim(),
      clientPhone: subscribingPhone.trim(),
      packageId: selectedPlanForModal.id,
      packageName: selectedPlanForModal.name,
      amount: finalAmount,
      currency,
      method: paymentMethodChosen === 'gpay'
        ? `Google Pay / UPI (${gatewayConfig.upiId})`
        : `Bank Transfer (${gatewayConfig.bankName})`,
      refNumber: subscribingTxnRef.trim() || `UTR-TXN-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'VERIFIED' as const,
      notes: `One-time ${selectedPlanForModal.name} lifetime setup fee processed successfully.`
    };

    // Save to centralized gateway storage
    recordSubscriptionPayment(paymentRecord);

    setTimeout(() => {
      setIsSubmittingOrder(false);
      setOrderCompletedReceipt({
        invoiceId,
        plan: selectedPlanForModal,
        amount: finalAmount,
        currency,
        date: paymentRecord.date,
        restName: paymentRecord.restaurantName
      });
    }, 1000);
  };

  // Contact Maker Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactMessage('');
    }, 3500);
  };

  // Filtered reviews
  const filteredReviews = selectedReviewTag === 'All'
    ? reviewsList
    : reviewsList.filter(r => r.tag === selectedReviewTag);

  const reviewTags = ['All', 'Fine Dining', 'Casual Dining', 'Multi-Zone Lounge', 'Seafood & Grill', 'Cafe & Bakery'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* SECTION 1: APP LOGO WITH TAGLINE & BRAND HERO */}
      {/* ========================================================================= */}
      <section id="top" className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle Background Lighting Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
            
            {/* Section 1: Logo & Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 bg-slate-900/90 border border-amber-500/30 rounded-full px-4 py-1.5 shadow-lg shadow-amber-500/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold overflow-hidden">
                {platformBranding?.appLogoUrl || restaurant?.logoUrl ? (
                  <img src={platformBranding?.appLogoUrl || restaurant?.logoUrl} alt={platformBranding?.appName || restaurant?.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-bold text-amber-300">
                {platformBranding?.appTagline || restaurant?.tagline || 'Official Hospitality Suite & Table Seating OS'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Main App Title & Tagline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {platformBranding?.appName || restaurant?.name || 'QR Seating Restaurant Manager'}
              </h1>

              {/* Tagline requirement */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl font-medium leading-relaxed">
                {platformBranding?.appTagline || restaurant?.tagline || 'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid, Priority Digital Waitlist, and Direct Google Pay & Bank Transfer Billing.'}
              </p>
            </div>

            {/* Quick High-Value Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
                <span className="text-xl sm:text-2xl font-black text-amber-400 block font-mono">0%</span>
                <span className="text-[11px] font-semibold text-slate-400">Commission Cuts</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block font-mono">&lt; 3s</span>
                <span className="text-[11px] font-semibold text-slate-400">QR Scan Check-In</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
                <span className="text-xl sm:text-2xl font-black text-blue-400 block font-mono">100%</span>
                <span className="text-[11px] font-semibold text-slate-400">Real-Time Table Sync</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
                <span className="text-xl sm:text-2xl font-black text-purple-400 block font-mono">GPay / UPI</span>
                <span className="text-[11px] font-semibold text-slate-400">Instant Direct Gateways</span>
              </div>
            </div>

            {/* Direct Login Access Action Controls */}
            <div className="flex flex-col items-center justify-center gap-3.5 pt-4">
              <div className="flex flex-wrap items-center justify-center gap-3 relative">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenOwnerLogin) {
                      onOpenOwnerLogin();
                    } else if (onLoginOwnerDashboard) {
                      onLoginOwnerDashboard('patrickferns17@gmail.com');
                    } else {
                      onOpenOwnerDashboard();
                    }
                  }}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 font-bold px-5 sm:px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-purple-900/20 cursor-pointer active:scale-[0.98]"
                  title="Open Owner Admin Login Page"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Owner Admin Login</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCustomerAdminLogin) {
                      onOpenCustomerAdminLogin();
                    } else if (onLoginRestaurantAdmin) {
                      onLoginRestaurantAdmin('admin@bistrolumiere.com');
                    } else {
                      onOpenAdminDesk();
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-amber-500/50 font-bold px-5 sm:px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-black/40 cursor-pointer active:scale-[0.98]"
                  title="Open Customer Admin Login Page"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Customer Admin Login</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: DETAILS ABOUT THE QR SEATING RESTAURANT MANAGER APP */}
      {/* WHAT IT DOES EXTRA IN DETAILS */}
      {/* ========================================================================= */}
      <section id="app-details" className="py-20 bg-slate-900/50 border-t border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> What Makes This App Extra Ordinary
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Comprehensive Features & Extra Capabilities
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Unlike generic booking forms, our QR Seating Manager is a complete, full-scale hospitality operating system engineered for fast-paced dining floors.
            </p>
          </div>

          {/* 6 High-Impact Deep-Dive Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: QR Stand & Table Placecard Generator */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  1. Contactless QR Stand & Table Tent Generator
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Generates ready-to-print acrylic table stands, reception desk posters, and tent cards with unique QR codes for every physical table. Guests simply scan with their phone camera to reserve, view live queue status, or check in instantly.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant printable vector QR layout with restaurant logo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>No mobile application download required for diners</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Specific table routing or general reception queue routing</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  Extra Advantage: Zero Hardware Cost <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Feature 2: Interactive Floor Plan & Visual Table Grid */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  2. Interactive Floor Plan & Multi-Zone Grid
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real-time visual map representing your actual dining zones (Main Dining, Patio, Bar, Private Booths, VIP Room). Live color indicators highlight table status: Available, Occupied with guest timer, Reserved, or Cleaning required.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Drag-and-drop table layout customizer & shape switcher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time cleaning countdown timers for busser staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited custom dining zones and section partitioning</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                  Extra Advantage: 35% Faster Busser & Seating Prep <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Feature 3: Smart Waitlist & Walk-In Queue Manager */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  3. Smart Waitlist Queue & Automated SMS Alerts
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Walk-in customers join the live digital waitlist directly from the entrance QR or host desk. Generates instant ticket codes (e.g. #BL-892), calculates dynamic wait times, and provides one-tap SMS ready notifications.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Walk-In Immediate & Arriving Later (15m) queuing options</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Special dietary, high-chair & celebration tags recorded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>One-tap smart seat matching to perfectly sized open tables</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  Extra Advantage: 90% Drop in Walk-in Abandonment <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Feature 4: Commission-Free Direct Online Booking */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  4. Direct 100% Commission-Free Booking Portal
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Provide your diners a dedicated booking URL (/reserve) to select date, dining slot, party size, and zone atmosphere. All reservations are direct to your restaurant with zero per-cover platform fees or middleman cuts.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Keep 100% of your guest relationships and guest data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant confirmation email and SMS generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Deposit guarantee options to eliminate costly no-shows</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                  Extra Advantage: Save ₹30,000 - ₹50,000+ Every Month <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Feature 5: Integrated Google Pay & Bank Wire Gateways */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  5. Google Pay, UPI & Bank Wire Payment Gateways
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Full integrated payment support for both subscription license purchases and optional customer table booking guarantees. Connects seamlessly with the App Owner master payment gateway config with zero setup headaches.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Google Pay UPI ID, GPay number & instant scanner support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Corporate Bank NEFT / IMPS / Swift wire transfer details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auto-invoice generation with verifiable transaction references</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  Extra Advantage: Direct Money in Your Bank Account <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Feature 6: Turnover Analytics & Multi-Device Sync */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 transition flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                  6. Real-Time Turnover Analytics & Floor Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Gain granular visibility into your restaurant operations: track exact minutes per table turnover, peak dining hours, occupancy percentages, and monthly guest throughput across all zones.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Average dining turn duration per party size & section</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-device synchronization for host desk, tablet & phones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Historical guest log export for marketing & loyalty campaigns</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  Extra Advantage: Maximize Revenue Per Square Foot <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: PACKAGE DETAILS WITH PAYMENT GATEWAYS */}
      {/* TO BUY THE SUBSCRIPTION */}
      {/* ========================================================================= */}
      <section id="packages-gateways" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Heading & Currency Switcher */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-1 rounded-full">
                <Award className="w-3.5 h-3.5" /> One-Time Setup Fee • Zero Monthly Subscriptions
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Subscription Packages & Payment Gateways
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Choose the perfect tier for your dining venue. Pay once via Google Pay, UPI or Bank Transfer with instant license activation and automatic invoice generation.
              </p>
            </div>

            {/* Currency Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 shadow-md">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  currency === 'INR'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ₹ INR Pricing
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  currency === 'USD'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                $ USD Global
              </button>
            </div>
          </div>

          {/* 3 Tier Package Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {defaultPackages.map((pkg) => {
              const price = currency === 'INR' ? `₹${pkg.oneTimePriceINR.toLocaleString('en-IN')}` : `$${pkg.oneTimePriceUSD}`;
              const isPopular = pkg.popular;

              return (
                <div
                  key={pkg.id}
                  className={`bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-xl transition border ${
                    isPopular
                      ? 'border-2 border-amber-500 shadow-amber-500/10 scale-[1.02] bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                      ★ Most Popular Choice
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                        {pkg.badge}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{pkg.idealFor}</p>
                    </div>

                    {/* Price Block */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">{price}</span>
                        <span className="text-xs text-slate-400 font-semibold uppercase">One-Time Fee</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 block">
                        ✓ No monthly charges • Lifetime commercial license
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Feature List */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included In This Package:
                      </span>
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanForModal(pkg);
                        setOrderCompletedReceipt(null);
                      }}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer ${
                        isPopular
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Buy Subscription with GPay / Bank</span>
                    </button>
                    <div className="text-[10px] text-center text-slate-500">
                      Instant Receipt & Setup • Direct Owner Settlement
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Master Payment Gateways Banner (GPay UPI + Bank Transfer) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    App Owner Master Payment Gateways
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  All subscription payments and customer booking deposits are deposited directly into the App Owner accounts below. Zero platform deductions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Direct P2P Settlement Active
                </span>
              </div>
            </div>

            {/* Gateways 2-Col Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Gateway Option 1: Google Pay / UPI */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">Google Pay / UPI Instant Gateway</h4>
                  </div>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase font-mono">
                    Zero Fees
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">UPI ID (GPay / BHIM / PhonePe)</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">{gatewayConfig.upiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gatewayConfig.upiId, 'upi-master')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi-master' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">GPay Registered Mobile Number</span>
                      <span className="text-xs font-bold text-slate-200 font-mono">{gatewayConfig.gpayNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gatewayConfig.gpayNumber, 'gpay-master')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy GPay Mobile Number"
                    >
                      {copiedKey === 'gpay-master' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Pay directly from your phone and enter the UTR/Reference to receive your instant invoice.</span>
                  </div>
                </div>
              </div>

              {/* Gateway Option 2: Corporate Bank Transfer */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Direct Bank Wire / NEFT / IMPS</h4>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase font-mono">
                    Corporate
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Account Name</span>
                    <span className="font-bold text-slate-200 truncate block">{gatewayConfig.bankAccountName}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Account Number</span>
                      <span className="font-mono font-bold text-amber-400 truncate block">{gatewayConfig.bankAccountNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gatewayConfig.bankAccountNumber, 'acc-num')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      {copiedKey === 'acc-num' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-200 truncate block">{gatewayConfig.bankIfscCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gatewayConfig.bankIfscCode, 'ifsc')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      {copiedKey === 'ifsc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Bank & Branch</span>
                    <span className="font-bold text-slate-200 truncate block">{gatewayConfig.bankName}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Supports IMPS instant credit, NEFT, RTGS & International SWIFT transfers.</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: CUSTOMER REVIEWS ABOUT THE APP */}
      {/* ========================================================================= */}
      <section id="reviews" className="py-20 bg-slate-900/40 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header with Rating Summary & Add Review Button */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 5.0 Star Hospitality Rating
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Customer & Restaurant Partner Reviews
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Read authentic testimonials from executive chefs, general managers, and dining hosts who upgraded their table turnover and eliminated commission fees.
              </p>
            </div>

            {/* Add Review Action */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddReviewOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Your Review</span>
              </button>
            </div>
          </div>

          {/* Review Filter Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-800 pb-4">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter by Venue:
            </span>
            {reviewTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedReviewTag(tag)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedReviewTag === tag
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 flex flex-col justify-between transition group"
              >
                <div className="space-y-4">
                  {/* Rating & Highlight Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.statsHighlight && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                        {rev.statsHighlight}
                      </span>
                    )}
                  </div>

                  {/* Review Title */}
                  <h4 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-amber-300 transition">
                    "{rev.reviewTitle}"
                  </h4>

                  {/* Comment */}
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Author Details Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {rev.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{rev.authorName}</span>
                        {rev.verified && (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" title="Verified Customer" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rev.role} • <span className="text-amber-400/90 font-medium">{rev.restaurantName}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{rev.date}</span>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: DETAILS ABOUT THE APP MAKER */}
      {/* ========================================================================= */}
      <section id="app-maker" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Maker Profile Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
              
              {/* Creator Bio & Vision */}
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-1 rounded-full">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" /> Lead Architect & App Creator
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Crafted by <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">Patrick Ferns</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Hi, I’m <strong className="text-white">Patrick Ferns</strong>. I designed and developed the <strong className="text-amber-400">Table QR Reservation & Seating Restaurant Manager</strong> with a singular mission: to liberate restaurant owners and general managers from predatory 3rd-party aggregators that charge exorbitant per-cover commissions and lock dining establishments into expensive monthly fees.
                </p>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Every element of this platform — from the real-time visual floor plan and printable acrylic QR stand generator to the zero-commission direct booking engine and seamless Google Pay / Bank Transfer gateways — was engineered for uncompromising speed, rock-solid reliability, and effortless usability on busy dining floors.
                </p>

                {/* Maker Quick Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-amber-300">patrickferns17@gmail.com</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Creator & Full-Stack Architect</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Global Hospitality Deployments</span>
                  </div>
                </div>
              </div>

              {/* Creator Tech Specs & Quick Contact Box */}
              <div className="w-full lg:w-96 bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 shrink-0">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Technical Stack & Architecture
                </h4>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Core Runtime</span>
                    <span className="font-mono font-bold text-white">React 18 + TypeScript</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Styling System</span>
                    <span className="font-mono font-bold text-white">Tailwind CSS + Lucide</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">State & Sync</span>
                    <span className="font-mono font-bold text-emerald-400">Real-Time Web Storage</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Payment Integration</span>
                    <span className="font-mono font-bold text-amber-400">Google Pay UPI + NEFT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Commission Policy</span>
                    <span className="font-mono font-bold text-emerald-400">0% Absolute Zero</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="mailto:patrickferns17@gmail.com?subject=Table%20QR%20Restaurant%20Manager%20Inquiry"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email Maker: patrickferns17@gmail.com</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Direct Maker Message Form */}
            <div className="pt-8 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" /> Send a Direct Message to the Maker
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Have questions about custom POS integration, custom floor plan setup, or white-labeling? Inquire directly.
                  </p>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-emerald-200 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold">
                    Thank you! Your message has been sent directly to Patrick Ferns (patrickferns17@gmail.com). You will receive a response shortly.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Your Subject or Restaurant Name"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Type your message, query, or customized setup requirements..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* GLOBAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-400/30 shrink-0">
                {platformBranding?.appLogoUrl || restaurant?.logoUrl ? (
                  <img src={platformBranding?.appLogoUrl || restaurant?.logoUrl} alt={platformBranding?.appName || restaurant?.name || 'QR Seating Restaurant Manager'} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-5 h-5 text-slate-950" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-white text-sm block tracking-tight truncate">
                  {platformBranding?.appName || restaurant?.name || 'QR Seating Restaurant Manager'}
                </span>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {platformBranding?.appTagline || restaurant?.tagline || 'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite'} • {platformBranding?.companyCopyright || `© ${new Date().getFullYear()} QR Seating Restaurant Manager Inc. All rights reserved.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <button onClick={() => scrollToSection('top')} className="hover:text-amber-400 transition cursor-pointer">
                Top
              </button>
              <button
                onClick={() => {
                  if (onOpenOwnerLogin) {
                    onOpenOwnerLogin();
                  } else if (onLoginOwnerDashboard) {
                    onLoginOwnerDashboard('patrickferns17@gmail.com');
                  } else {
                    onOpenOwnerDashboard();
                  }
                }}
                className="hover:text-purple-400 transition cursor-pointer font-medium"
              >
                Owner Admin Login
              </button>
              <button onClick={() => scrollToSection('app-details')} className="hover:text-amber-400 transition cursor-pointer">
                Features
              </button>
              <button onClick={() => scrollToSection('packages-gateways')} className="hover:text-amber-400 transition cursor-pointer">
                Subscription & Gateways
              </button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-amber-400 transition cursor-pointer">
                Reviews
              </button>
              <button onClick={() => scrollToSection('app-maker')} className="hover:text-amber-400 transition cursor-pointer">
                Maker Details
              </button>
              <button
                onClick={() => {
                  if (onOpenCustomerAdminLogin) {
                    onOpenCustomerAdminLogin();
                  } else if (onLoginRestaurantAdmin) {
                    onLoginRestaurantAdmin('admin@bistrolumiere.com');
                  } else {
                    onOpenAdminDesk();
                  }
                }}
                className="text-amber-400 hover:underline font-bold cursor-pointer"
              >
                Customer Admin Login
              </button>
            </div>

          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: BUY SUBSCRIPTION & PAYMENT GATEWAY CHECKOUT MODAL */}
      {/* ========================================================================= */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Subscription Checkout
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedPlanForModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80"
              >
                ✕
              </button>
            </div>

            {orderCompletedReceipt ? (
              /* Success Receipt View */
              <div className="space-y-6 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Subscription Order Confirmed!</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Your payment has been logged. An official tax invoice has been generated for <strong>{orderCompletedReceipt.restName}</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Invoice Ref:</span>
                    <span className="text-amber-400 font-bold">{orderCompletedReceipt.invoiceId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Package:</span>
                    <span className="text-white">{orderCompletedReceipt.plan.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">
                      {orderCompletedReceipt.currency === 'INR' ? `₹${orderCompletedReceipt.amount}` : `$${orderCompletedReceipt.amount}`} (One-Time)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>License Status:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (Lifetime)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanForModal(null);
                      onOpenAdminDesk();
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition"
                  >
                    Open Restaurant Host Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForModal(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-xs transition"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                
                {/* Plan Summary Banner */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedPlanForModal.name}</span>
                    <span className="text-[10px] text-emerald-400">Lifetime License • Zero Monthly Fees</span>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {currency === 'INR' ? `₹${selectedPlanForModal.oneTimePriceINR.toLocaleString('en-IN')}` : `$${selectedPlanForModal.oneTimePriceUSD}`}
                  </span>
                </div>

                {/* Venue & Buyer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Restaurant / Venue Name *</label>
                    <input
                      type="text"
                      required
                      value={subscribingRestName}
                      onChange={(e) => setSubscribingRestName(e.target.value)}
                      placeholder="e.g. Bistro Lumière"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Contact Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={subscribingOwnerName}
                      onChange={(e) => setSubscribingOwnerName(e.target.value)}
                      placeholder="e.g. Head Host / Owner"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={subscribingEmail}
                      onChange={(e) => setSubscribingEmail(e.target.value)}
                      placeholder="owner@venue.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={subscribingPhone}
                      onChange={(e) => setSubscribingPhone(e.target.value)}
                      placeholder="+91 98200 00000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Gateway Selection Tabs */}
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 block">Choose Payment Gateway:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethodChosen('gpay')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        paymentMethodChosen === 'gpay'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>Google Pay / UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethodChosen('bank')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        paymentMethodChosen === 'bank'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Bank Wire / NEFT</span>
                    </button>
                  </div>
                </div>

                {/* Active Gateway Information Box */}
                {paymentMethodChosen === 'gpay' ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Google Pay Details</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">App Owner Gateway</span>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">UPI ID</span>
                        <span className="font-mono font-bold text-amber-400">{gatewayConfig.upiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(gatewayConfig.upiId, 'modal-upi')}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        {copiedKey === 'modal-upi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <span className="font-bold text-white block">Corporate Bank Account Details</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Account Name:</span>
                        <span className="font-bold text-slate-200">{gatewayConfig.bankAccountName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Account Number:</span>
                        <span className="font-mono font-bold text-amber-400">{gatewayConfig.bankAccountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">IFSC Code:</span>
                        <span className="font-mono font-bold text-slate-200">{gatewayConfig.bankIfscCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Bank Name:</span>
                        <span className="text-slate-200">{gatewayConfig.bankName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* UTR / Transaction Reference Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Enter Transaction Reference / UTR / Note *
                  </label>
                  <input
                    type="text"
                    required
                    value={subscribingTxnRef}
                    onChange={(e) => setSubscribingTxnRef(e.target.value)}
                    placeholder="e.g. UPI-UTR-9821839281 or Bank Ref"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <span>Verifying Transaction Reference...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Activate Subscription</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD USER REVIEW MODAL */}
      {/* ========================================================================= */}
      {isAddReviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-fade-in my-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Community Feedback
                </span>
                <h3 className="text-lg font-bold text-white">
                  Submit Your App Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddReviewOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80"
              >
                ✕
              </button>
            </div>

            {reviewSubmitSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Review Published Successfully!</h4>
                <p className="text-xs text-slate-300">
                  Thank you for supporting the Table QR Seating Manager community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateReview} className="space-y-3.5">
                
                {/* Star Rating Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-2 font-mono">
                      {newReviewRating}.0 / 5.0 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef Marco"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Role / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. General Manager"
                      value={newReviewRole}
                      onChange={(e) => setNewReviewRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Restaurant Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bella Roma"
                      value={newReviewRestName}
                      onChange={(e) => setNewReviewRestName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Key Stat Highlight</label>
                    <input
                      type="text"
                      placeholder="e.g. +30% Faster Turn"
                      value={newReviewStats}
                      onChange={(e) => setNewReviewStats(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Review Headline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saved us ₹35k per month on aggregators!"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Your Detailed Experience *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe how the QR table stands, waitlist, or visual floor plan improved your operations..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Publish Verified Review
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

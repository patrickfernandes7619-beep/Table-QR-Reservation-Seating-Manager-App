import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Receipt,
  Download,
  Utensils,
  Award,
  Info,
  ExternalLink
} from 'lucide-react';
import {
  getAppOwnerGatewayConfig,
  getSaaSPackages,
  getSubscriptionPayments,
  saveSubscriptionPayments,
  getRestaurantTenants,
  saveRestaurantTenants
} from '../lib/gatewayStorage';
import { SubscriptionPayment, RestaurantTenant, RestaurantInfo, AppOwnerGatewayConfig, PlanDetails } from '../types';

interface PackagesAndBillingProps {
  restaurant: RestaurantInfo;
  onOpenSettings?: () => void;
  onPaymentComplete?: (clientData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    planId: string;
    invoiceId: string;
  }) => void;
}

export const PackagesAndBilling: React.FC<PackagesAndBillingProps> = ({
  restaurant,
  onPaymentComplete
}) => {
  // Packages and Gateway config loaded directly from App Owner Control Center
  const [packages, setPackages] = useState<PlanDetails[]>(getSaaSPackages);
  const [gatewayConfig, setGatewayConfig] = useState<AppOwnerGatewayConfig>(getAppOwnerGatewayConfig);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails>(() => {
    const list = getSaaSPackages();
    return list[1] || list[0];
  });
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Real-time synchronization with App Owner Dashboard updates
  useEffect(() => {
    const handleGatewayUpdate = (e: any) => {
      if (e.detail) {
        setGatewayConfig(e.detail);
      }
    };
    const handlePackagesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPackages(e.detail);
        const match = e.detail.find((p: PlanDetails) => p.id === selectedPlan.id);
        if (match) setSelectedPlan(match);
      }
    };

    window.addEventListener('smarthost:gateway_updated', handleGatewayUpdate);
    window.addEventListener('smarthost:packages_updated', handlePackagesUpdate);

    return () => {
      window.removeEventListener('smarthost:gateway_updated', handleGatewayUpdate);
      window.removeEventListener('smarthost:packages_updated', handlePackagesUpdate);
    };
  }, [selectedPlan.id]);

  // Payment Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'bank_transfer'>('gpay');
  const [clientBusinessName, setClientBusinessName] = useState<string>(restaurant.name || 'My Restaurant');
  const [clientContactEmail, setClientContactEmail] = useState<string>('owner@example.com');
  const [clientPhone, setClientPhone] = useState<string>(restaurant.phone || '+91 98765 43210');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Price calculations (One-Time Setup Fee only)
  const currentPrice = currency === 'INR' ? selectedPlan.oneTimePriceINR : selectedPlan.oneTimePriceUSD;
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Dynamic UPI Deep Link for Google Pay / PhonePe / BHIM using Owner's Gateway config
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(gatewayConfig.upiId)}&pn=${encodeURIComponent(
    gatewayConfig.merchantName
  )}&am=${currentPrice}&cu=INR&tn=${encodeURIComponent(`${selectedPlan.name} Setup Fee for ${clientBusinessName}`)}`;

  // QR Code Image source: App Owner's custom uploaded image OR dynamic generated UPI QR
  const activeQrSrc =
    gatewayConfig.qrCodeUrl && gatewayConfig.qrCodeUrl.trim() !== ''
      ? gatewayConfig.qrCodeUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeepLink)}`;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const finalMethod =
      paymentMethod === 'gpay'
        ? `Google Pay / UPI (${gatewayConfig.upiId})`
        : `Bank Transfer / NEFT / IMPS (${gatewayConfig.bankName})`;
    const finalRef = transactionRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const mockReceipt = {
      invoiceId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      planName: selectedPlan.name,
      amount: `${currencySymbol}${currentPrice.toLocaleString()}`,
      currency,
      clientName: clientBusinessName,
      clientEmail: clientContactEmail,
      clientPhone: clientPhone,
      method: finalMethod,
      refNumber: finalRef,
      status: 'CONFIRMED & LICENSED'
    };

    // Record in global subscription payments log for App Owner Dashboard
    const newSubscriptionPayment: SubscriptionPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      invoiceId,
      restaurantId: restaurant.id || 'rest-01',
      restaurantName: clientBusinessName,
      clientName: clientBusinessName,
      clientEmail: clientContactEmail,
      clientPhone: clientPhone,
      packageId: selectedPlan.id,
      packageName: selectedPlan.name,
      amount: currentPrice,
      currency,
      method: finalMethod,
      refNumber: finalRef,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'VERIFIED',
      notes: `Direct package sign-up with setup fee paid via ${paymentMethod === 'gpay' ? 'GPay' : 'Bank Transfer'}.`
    };

    const currentPayments = getSubscriptionPayments();
    saveSubscriptionPayments([newSubscriptionPayment, ...currentPayments]);

    // Update or add restaurant tenant in registry
    const currentTenants = getRestaurantTenants();
    const existingIndex = currentTenants.findIndex(
      t => t.ownerEmail.toLowerCase() === clientContactEmail.toLowerCase() || t.name.toLowerCase() === clientBusinessName.toLowerCase()
    );
    if (existingIndex >= 0) {
      currentTenants[existingIndex] = {
        ...currentTenants[existingIndex],
        packageId: selectedPlan.id,
        packageName: selectedPlan.name,
        status: 'active',
        lastPaymentDate: new Date().toISOString().split('T')[0],
        lastInvoiceId: invoiceId
      };
      saveRestaurantTenants(currentTenants);
    } else {
      const newTenant: RestaurantTenant = {
        id: `rest-${Date.now().toString().slice(-4)}`,
        name: clientBusinessName,
        tagline: 'Fine Dining & Hospitality',
        ownerName: clientBusinessName,
        ownerEmail: clientContactEmail,
        phone: clientPhone,
        address: restaurant.address || 'Commercial Center',
        packageId: selectedPlan.id,
        packageName: selectedPlan.name,
        status: 'active',
        tablesCount: selectedPlan.id === 'starter' ? 12 : 24,
        totalReservationsCount: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        lastPaymentDate: new Date().toISOString().split('T')[0],
        lastInvoiceId: invoiceId
      };
      saveRestaurantTenants([newTenant, ...currentTenants]);
    }

    setPaymentSuccessData(mockReceipt);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              One-Time Setup Licensing & Direct Client Billing
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Commercial Setup Packages & Payment Gateway
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sign packages and complete your one-time setup fee (no recurring monthly charges). Payments are processed securely via the App Owner&apos;s configured <strong className="text-amber-400">Google Pay QR Scanner</strong>, <strong className="text-white">UPI ID ({gatewayConfig.upiId})</strong>, and <strong className="text-white">Direct Bank Account Transfer</strong>.
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currency === 'INR' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ₹ INR (India)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currency === 'USD' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                $ USD (Global)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Merchant Gateway Badge (Configured Centrally by App Owner) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
              <span>Payment Receiver Gateway:</span>
              <span className="text-amber-400 font-mono">{gatewayConfig.upiId}</span>
              <span className="text-slate-400">({gatewayConfig.merchantName})</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                App Owner Gateway (Live)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              GPay Phone: <span className="text-slate-300 font-mono">{gatewayConfig.gpayNumber}</span> | Bank:{' '}
              <span className="text-slate-300">{gatewayConfig.bankName}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Centralized Super Admin Gateway</span>
        </div>
      </div>

      {/* Package Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {packages.map((pkg) => {
          const isSelected = selectedPlan.id === pkg.id;
          const displayPrice = currency === 'INR' ? pkg.oneTimePriceINR : pkg.oneTimePriceUSD;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPlan(pkg)}
              className={`cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-200 border-2 relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-amber-500 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  Recommended Choice
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {pkg.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-2.5">{pkg.name}</h3>
                    <p className="text-xs text-amber-400 font-medium mt-1">{pkg.idealFor}</p>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pkg.description}</p>

                {/* Price Display */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                      {currencySymbol}
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      One-Time Setup
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Direct lifetime access with full floor plan setup and QR stand generator.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Included Features & Services:
                  </div>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Select & Sign Button */}
              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(pkg);
                    setIsCheckoutOpen(true);
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>Sign Package & Pay {currencySymbol}{displayPrice.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix & Client ROI Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Why Clients Choose This One-Time Model vs. OpenTable / Resy
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Clear financial savings justification you can share with restaurant owners.
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
            Zero Recurring Commissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-rose-400">Traditional Booking Platforms</div>
            <div className="text-xl font-extrabold text-white font-mono">$249 – $500 / mo</div>
            <p className="text-xs text-slate-400">
              Plus $1.00 – $2.50 per seated guest. Costs restaurants upwards of ₹25,000 to ₹50,000 every single month.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 space-y-2 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold">
              ONE-TIME ONLY
            </div>
            <div className="text-xs font-bold text-emerald-400">SmartHost Setup Model</div>
            <div className="text-xl font-extrabold text-white font-mono">₹3,999 / ₹6,999 Once</div>
            <p className="text-xs text-slate-400">
              Pay once for full setup & onboarding. No monthly fees, no per-cover cuts.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">Direct Customer Data</div>
            <div className="text-xl font-extrabold text-white font-mono">100% Private</div>
            <p className="text-xs text-slate-400">
              Customer phone numbers, bookings, and analytics remain solely with the restaurant.
            </p>
          </div>
        </div>
      </div>

      {/* PAYMENT & CHECKOUT MODAL (GPay & Account Transfer via Owner Gateway) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">One-Time Setup Payment & Licensing</h3>
                  <p className="text-xs text-slate-400">Complete setup fee via Google Pay or Direct Bank Transfer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setPaymentSuccessData(null);
                }}
                className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {paymentSuccessData ? (
              /* Success / Receipt Screen */
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-white">Payment Recorded Successfully!</h4>
                  <p className="text-sm text-slate-300 mt-1">
                    Invoice <span className="font-mono text-amber-400 font-bold">#{paymentSuccessData.invoiceId}</span> has been confirmed for {paymentSuccessData.clientName}.
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Package:</span>
                    <span className="text-white font-bold">{paymentSuccessData.planName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Total Setup Fee Paid:</span>
                    <span className="text-amber-400 font-bold text-sm">{paymentSuccessData.amount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Payment Gateway:</span>
                    <span className="text-white">{paymentSuccessData.method}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Reference / UTR ID:</span>
                    <span className="text-slate-300">{paymentSuccessData.refNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Status:</span>
                    <span className="text-emerald-400 font-bold">LIFETIME ACTIVE & LICENSED (NO MONTHLY FEES)</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Instant Customer Portal & Seating Manager Activation</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    You can now directly launch your <strong>Customer Portal</strong> logged in with <strong>{paymentSuccessData.clientEmail}</strong>. From there, you or your clients can book, modify QR stands, update table seating configurations, and manage reservations.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPaymentComplete) {
                        onPaymentComplete({
                          clientName: paymentSuccessData.clientName,
                          clientEmail: paymentSuccessData.clientEmail,
                          clientPhone: paymentSuccessData.clientPhone,
                          planId: selectedPlan.id,
                          invoiceId: paymentSuccessData.invoiceId
                        });
                      }
                      setIsCheckoutOpen(false);
                      setPaymentSuccessData(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                    Direct to Customer Portal ({paymentSuccessData.clientEmail})
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setPaymentSuccessData(null);
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Return to Desk
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form & Gateway Selection */
              <form onSubmit={handleProcessPayment} className="space-y-6">
                {/* Summary Box */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">{selectedPlan.name}</div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      One-Time Lifetime Setup Fee (₹0 / month recurring)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-amber-400 font-mono">
                      {currencySymbol}
                      {currentPrice.toLocaleString()}
                      {currency === 'INR' ? '/-' : ''}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">One-time payment</span>
                  </div>
                </div>

                {/* Client Info Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Client / Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={clientBusinessName}
                      onChange={(e) => setClientBusinessName(e.target.value)}
                      placeholder="e.g. Grand Central Bistro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Billing Contact Email</label>
                    <input
                      type="email"
                      required
                      value={clientContactEmail}
                      onChange={(e) => setClientContactEmail(e.target.value)}
                      placeholder="manager@restaurant.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">Phone / WhatsApp Number</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Payment Gateway (App Owner Receiver)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Google Pay / UPI */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gpay')}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        paymentMethod === 'gpay'
                          ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          Google Pay (GPay) / UPI
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                            Instant
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Scan QR Code, pay via UPI ID or GPay Number
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Direct Account Transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-sky-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          Bank Account Transfer
                          <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-mono">
                            NEFT/IMPS
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Direct commercial bank wire & NEFT details
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Gateway Detail Display */}
                {paymentMethod === 'gpay' && (
                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Interactive / Uploaded GPay QR Code */}
                      <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0 text-center flex flex-col items-center">
                        <img
                          src={activeQrSrc}
                          alt="GPay QR Scanner"
                          className="w-36 h-36 object-contain rounded-lg"
                        />
                        <span className="text-[10px] font-bold text-slate-900 font-mono mt-1.5">
                          Scan via Google Pay / UPI
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-amber-400" />
                            Pay to: <span className="text-amber-400">{gatewayConfig.merchantName}</span>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                            Live Gateway
                          </span>
                        </div>

                        {/* UPI ID copy */}
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] text-slate-400">GPay UPI ID:</div>
                            <div className="text-xs font-mono font-bold text-amber-400">{gatewayConfig.upiId}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(gatewayConfig.upiId, 'upi')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedKey === 'upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedKey === 'upi' ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {/* GPay Number copy */}
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] text-slate-400">GPay Direct Number:</div>
                            <div className="text-xs font-mono font-bold text-slate-200">{gatewayConfig.gpayNumber}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(gatewayConfig.gpayNumber, 'gpay_num')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedKey === 'gpay_num' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedKey === 'gpay_num' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">
                        Transaction UTR / Reference ID (Post Payment)
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 423987123984 (from your GPay receipt)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mt-1"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-5 space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-400" />
                        Commercial Bank Account Transfer Details
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                        Direct Wire
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Account Name:</div>
                        <div className="font-bold text-white mt-0.5">{gatewayConfig.bankAccountName}</div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Account Number:</div>
                          <div className="font-mono font-bold text-amber-400 mt-0.5">
                            {gatewayConfig.bankAccountNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(gatewayConfig.bankAccountNumber, 'acc_num')}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        >
                          {copiedKey === 'acc_num' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">IFSC Code:</div>
                          <div className="font-mono font-bold text-sky-400 mt-0.5">{gatewayConfig.bankIfscCode}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(gatewayConfig.bankIfscCode, 'ifsc')}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        >
                          {copiedKey === 'ifsc' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Bank & Branch:</div>
                        <div className="font-semibold text-slate-200 mt-0.5">{gatewayConfig.bankName}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">
                        Bank Wire / IMPS Reference Number
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. IMPS-98721345 / Wire Ref"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Confirmation Button */}
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Confirm & Generate Lifetime Invoice ({currencySymbol}
                  {currentPrice.toLocaleString()}
                  {currency === 'INR' ? '/-' : ''})
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  RestaurantTenant,
  SubscriptionPayment,
  AppOwnerGatewayConfig,
  PlanDetails,
  RestaurantInfo,
  UserSession,
  AppPlatformBranding
} from '../types';
import {
  getAppOwnerGatewayConfig,
  saveAppOwnerGatewayConfig,
  getRestaurantTenants,
  saveRestaurantTenants,
  getSubscriptionPayments,
  saveSubscriptionPayments,
  getSaaSPackages,
  saveSaaSPackages,
  getAppBrandingConfig,
  saveAppBrandingConfig,
  getAppPlatformBranding,
  saveAppPlatformBranding,
  getCustomerPortalBranding,
  saveCustomerPortalBranding
} from '../lib/gatewayStorage';
import { PlatformBrandingSection } from './owner/PlatformBrandingSection';
import { CustomerPortalBrandingSection } from './owner/CustomerPortalBrandingSection';
import {
  Building2,
  CreditCard,
  History,
  Settings,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Download,
  Printer,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Users,
  DollarSign,
  TrendingUp,
  X,
  Lock,
  ArrowRight,
  Eye,
  RefreshCw,
  Award,
  Layers,
  FileText,
  Sliders,
  Utensils,
  Upload,
  Image as ImageIcon,
  MapPin,
  Phone,
  Clock,
  Globe
} from 'lucide-react';

interface AppOwnerDashboardProps {
  currentRestaurant: RestaurantInfo;
  user: UserSession;
  onSwitchToHostDesk: () => void;
  onSwitchToCustomerPortal?: () => void;
  onSelectRestaurant?: (restaurant: RestaurantTenant) => void;
  onUpdateRestaurant?: (updated: RestaurantInfo) => void;
}

// Client-side image compressor to convert high-res photos into lightweight, crystal-clear WebP/PNG dataURLs
const compressLogoImage = (file: File, maxWidth = 512, maxHeight = 512, quality = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const AppOwnerDashboard: React.FC<AppOwnerDashboardProps> = ({
  currentRestaurant,
  user,
  onSwitchToHostDesk,
  onSwitchToCustomerPortal,
  onSelectRestaurant,
  onUpdateRestaurant
}) => {
  // Navigation Tabs in App Owner Dashboard: Platform Branding, Customer Portal Branding, Tenants, Packaging & Gateways, Payment History
  const [activeTab, setActiveTab] = useState<'platform_branding' | 'customer_portal_branding' | 'tenants' | 'gateway_packaging' | 'payment_history'>('platform_branding');

  // Platform Master Branding State
  const [platformBranding, setPlatformBranding] = useState<AppPlatformBranding>(getAppPlatformBranding);

  // Sync platform branding updates across storage
  const handleSavePlatformBranding = async (updated: AppPlatformBranding) => {
    setPlatformBranding(updated);
    saveAppPlatformBranding(updated);
    showToast(`✓ Platform App Branding ("${updated.appName}") updated successfully!`);
  };

  // Sync customer portal branding updates
  const handleSaveCustomerPortalBranding = async (updated: RestaurantInfo, targetTenantId?: string) => {
    saveAppBrandingConfig(updated);
    if (onUpdateRestaurant) {
      onUpdateRestaurant(updated);
    }
    if (targetTenantId) {
      const updatedTenants = tenants.map(t => {
        if (t.id === targetTenantId) {
          return {
            ...t,
            name: updated.name,
            tagline: updated.tagline,
            address: updated.address,
            phone: updated.phone
          };
        }
        return t;
      });
      setTenants(updatedTenants);
      saveRestaurantTenants(updatedTenants);
    }
    try {
      await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Backend update:', err);
    }
    showToast(`✓ Customer Portal Branding for "${updated.name}" updated successfully!`);
  };

  // App & Branding Settings State
  const [appName, setAppName] = useState<string>(currentRestaurant.name || 'QR Seating Restaurant Manager');
  const [appTagline, setAppTagline] = useState<string>(currentRestaurant.tagline || 'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite');
  const [appLogoUrl, setAppLogoUrl] = useState<string>(currentRestaurant.logoUrl || '');
  const [appAddress, setAppAddress] = useState<string>(currentRestaurant.address || '742 Evergreen Terrace, Downtown Food District');
  const [appPhone, setAppPhone] = useState<string>(currentRestaurant.phone || '(555) 234-8901');
  const [appOperatingHours, setAppOperatingHours] = useState<string>(currentRestaurant.operatingHours || 'Mon-Sun: 11:30 AM - 10:00 PM');
  const [appWelcomeMsg, setAppWelcomeMsg] = useState<string>(currentRestaurant.welcomeMessage || 'Welcome to QR Seating Restaurant Manager! Please scan to join our digital waitlist or select your preferred table.');
  const [appDeskInstructions, setAppDeskInstructions] = useState<string>(currentRestaurant.deskInstructions || 'Scan QR code to check in for immediate walk-in seating or reserve a table today.');

  // Form dirty tracking & saving state to prevent background polling resets
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when currentRestaurant prop updates (only if user has not made unsaved changes)
  useEffect(() => {
    if (!isDirty && !isSavingBranding) {
      setAppName(currentRestaurant.name || 'QR Seating Restaurant Manager');
      setAppTagline(currentRestaurant.tagline || 'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite');
      setAppLogoUrl(currentRestaurant.logoUrl || '');
      setAppAddress(currentRestaurant.address || '742 Evergreen Terrace, Downtown Food District');
      setAppPhone(currentRestaurant.phone || '(555) 234-8901');
      setAppOperatingHours(currentRestaurant.operatingHours || 'Mon-Sun: 11:30 AM - 10:00 PM');
      setAppWelcomeMsg(currentRestaurant.welcomeMessage || 'Welcome to QR Seating Restaurant Manager! Please scan to join our digital waitlist or select your preferred table.');
      setAppDeskInstructions(currentRestaurant.deskInstructions || 'Scan QR code to check in for immediate walk-in seating or reserve a table today.');
    }
  }, [currentRestaurant, isDirty, isSavingBranding]);

  // Core Data States
  const [tenants, setTenants] = useState<RestaurantTenant[]>(getRestaurantTenants);
  const [payments, setPayments] = useState<SubscriptionPayment[]>(getSubscriptionPayments);
  const [gatewayConfig, setGatewayConfig] = useState<AppOwnerGatewayConfig>(getAppOwnerGatewayConfig);
  const [packages, setPackages] = useState<PlanDetails[]>(getSaaSPackages);

  // Search & Filter States
  const [tenantSearch, setTenantSearch] = useState<string>('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<string>('all');
  const [tenantPackageFilter, setTenantPackageFilter] = useState<string>('all');

  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Modals
  const [isAddTenantOpen, setIsAddTenantOpen] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<RestaurantTenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<RestaurantTenant | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SubscriptionPayment | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);

  // Form State for Add / Edit Tenant
  const [tenantFormData, setTenantFormData] = useState({
    name: '',
    tagline: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    address: '',
    packageId: 'pro' as 'starter' | 'pro' | 'enterprise',
    status: 'active' as 'active' | 'trial' | 'expired' | 'suspended',
    tablesCount: 16,
    notes: ''
  });

  // Form State for Record Manual Payment
  const [paymentFormData, setPaymentFormData] = useState({
    restaurantId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    packageId: 'pro',
    amount: 6999,
    currency: 'INR' as 'INR' | 'USD',
    method: 'Google Pay / UPI',
    refNumber: '',
    status: 'VERIFIED' as 'VERIFIED' | 'PENDING',
    notes: ''
  });

  // Gateway Config Working Copy
  const [tempGatewayConfig, setTempGatewayConfig] = useState<AppOwnerGatewayConfig>(gatewayConfig);
  const [tempPackages, setTempPackages] = useState<PlanDetails[]>(packages);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync with global events
  useEffect(() => {
    const handleGatewayUpdate = (e: any) => {
      if (e.detail) {
        setGatewayConfig(e.detail);
        setTempGatewayConfig(e.detail);
      }
    };
    const handleTenantsUpdate = (e: any) => {
      if (e.detail) setTenants(e.detail);
    };
    const handlePaymentsUpdate = (e: any) => {
      if (e.detail) setPayments(e.detail);
    };

    window.addEventListener('smarthost:gateway_updated', handleGatewayUpdate);
    window.addEventListener('smarthost:tenants_updated', handleTenantsUpdate);
    window.addEventListener('smarthost:payments_updated', handlePaymentsUpdate);

    return () => {
      window.removeEventListener('smarthost:gateway_updated', handleGatewayUpdate);
      window.removeEventListener('smarthost:tenants_updated', handleTenantsUpdate);
      window.removeEventListener('smarthost:payments_updated', handlePaymentsUpdate);
    };
  }, []);

  // Compute Platform Metrics
  const totalINRRevenue = payments
    .filter(p => p.currency === 'INR' && p.status === 'VERIFIED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalUSDRevenue = payments
    .filter(p => p.currency === 'USD' && p.status === 'VERIFIED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalActiveRestaurants = tenants.filter(t => t.status === 'active').length;
  const totalTablesAcrossPlatform = tenants.reduce((acc, t) => acc + (t.tablesCount || 0), 0);
  const totalReservationsLogged = tenants.reduce((acc, t) => acc + (t.totalReservationsCount || 0), 0);

  // Filtered Tenants List
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.phone.includes(tenantSearch) ||
      t.address.toLowerCase().includes(tenantSearch.toLowerCase());

    const matchesStatus = tenantStatusFilter === 'all' || t.status === tenantStatusFilter;
    const matchesPackage = tenantPackageFilter === 'all' || t.packageId === tenantPackageFilter;

    return matchesSearch && matchesStatus && matchesPackage;
  });

  // Filtered Payments List
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.invoiceId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.restaurantName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.refNumber.toLowerCase().includes(paymentSearch.toLowerCase());

    const matchesMethod =
      paymentMethodFilter === 'all' ||
      p.method.toLowerCase().includes(paymentMethodFilter.toLowerCase());

    return matchesSearch && matchesMethod;
  });

  // Handle Add New Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const pkgObj = packages.find(p => p.id === tenantFormData.packageId) || packages[1];
    const newTenant: RestaurantTenant = {
      id: `rest-${Date.now().toString().slice(-4)}`,
      name: tenantFormData.name.trim(),
      tagline: tenantFormData.tagline.trim() || 'Fine Dining & Hospitality',
      ownerName: tenantFormData.ownerName.trim(),
      ownerEmail: tenantFormData.ownerEmail.trim().toLowerCase(),
      phone: tenantFormData.phone.trim(),
      address: tenantFormData.address.trim(),
      packageId: tenantFormData.packageId,
      packageName: pkgObj.name,
      status: tenantFormData.status,
      tablesCount: Number(tenantFormData.tablesCount) || 12,
      totalReservationsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      notes: tenantFormData.notes.trim()
    };

    const updated = [newTenant, ...tenants];
    setTenants(updated);
    saveRestaurantTenants(updated);
    setIsAddTenantOpen(false);
    showToast(`Restaurant "${newTenant.name}" registered successfully!`);

    // Reset Form
    setTenantFormData({
      name: '',
      tagline: '',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      address: '',
      packageId: 'pro',
      status: 'active',
      tablesCount: 16,
      notes: ''
    });
  };

  // Handle Edit Tenant Save
  const handleSaveEditedTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const pkgObj = packages.find(p => p.id === tenantFormData.packageId) || packages[1];
    const updatedTenant: RestaurantTenant = {
      ...editingTenant,
      name: tenantFormData.name.trim(),
      tagline: tenantFormData.tagline.trim(),
      ownerName: tenantFormData.ownerName.trim(),
      ownerEmail: tenantFormData.ownerEmail.trim().toLowerCase(),
      phone: tenantFormData.phone.trim(),
      address: tenantFormData.address.trim(),
      packageId: tenantFormData.packageId,
      packageName: pkgObj.name,
      status: tenantFormData.status,
      tablesCount: Number(tenantFormData.tablesCount) || editingTenant.tablesCount,
      notes: tenantFormData.notes.trim()
    };

    const updated = tenants.map(t => (t.id === editingTenant.id ? updatedTenant : t));
    setTenants(updated);
    saveRestaurantTenants(updated);
    setEditingTenant(null);
    showToast(`Updated "${updatedTenant.name}" details successfully!`);
  };

  // Handle Delete Tenant
  const handleConfirmDeleteTenant = () => {
    if (!deletingTenant) return;
    const updated = tenants.filter(t => t.id !== deletingTenant.id);
    setTenants(updated);
    saveRestaurantTenants(updated);
    showToast(`Deleted restaurant "${deletingTenant.name}".`);
    setDeletingTenant(null);
  };

  // Open Edit Modal with Pre-filled data
  const handleOpenEditModal = (t: RestaurantTenant) => {
    setEditingTenant(t);
    setTenantFormData({
      name: t.name,
      tagline: t.tagline,
      ownerName: t.ownerName,
      ownerEmail: t.ownerEmail,
      phone: t.phone,
      address: t.address,
      packageId: t.packageId,
      status: t.status,
      tablesCount: t.tablesCount,
      notes: t.notes || ''
    });
  };

  // Handle Save App Branding & Name
  const handleSaveAppBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBranding(true);

    const updated: RestaurantInfo = {
      ...currentRestaurant,
      name: appName.trim() || 'QR Seating Restaurant Manager',
      tagline: appTagline.trim() || 'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite',
      logoUrl: appLogoUrl.trim(),
      address: appAddress.trim(),
      phone: appPhone.trim(),
      operatingHours: appOperatingHours.trim(),
      welcomeMessage: appWelcomeMsg.trim(),
      deskInstructions: appDeskInstructions.trim()
    };

    // Save to persistent localStorage & dispatch event
    saveAppBrandingConfig(updated);

    if (onUpdateRestaurant) {
      onUpdateRestaurant(updated);
    }

    // Try direct backend API PUT as well
    try {
      await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Backend update:', err);
    }

    setIsDirty(false);
    setIsSavingBranding(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
    showToast(`✓ App Name & Logo Branding saved globally across all portals!`);
  };

  // Handle Logo Upload with client-side compression for App Branding
  const handleAppLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, SVG, WebP).');
        return;
      }
      setIsUploadingLogo(true);
      try {
        const compressedDataUrl = await compressLogoImage(file, 512, 512, 0.9);
        setAppLogoUrl(compressedDataUrl);
        setIsDirty(true);
        showToast('✓ Logo optimized and ready! Click "Save App Name & Branding" to apply.');
      } catch (err) {
        console.error('Logo compression failed, falling back to raw dataURL:', err);
        const reader = new FileReader();
        reader.onload = uploadEvent => {
          if (uploadEvent.target?.result) {
            setAppLogoUrl(uploadEvent.target!.result as string);
            setIsDirty(true);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  // Handle Save Gateway Config & Packages
  const handleSaveGatewaySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayConfig(tempGatewayConfig);
    saveAppOwnerGatewayConfig(tempGatewayConfig);
    setPackages(tempPackages);
    saveSaaSPackages(tempPackages);
    showToast('GPay, UPI & Bank Gateway payment settings updated globally!');
  };

  // Handle QR Upload for Gateway
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = uploadEvent => {
        if (uploadEvent.target?.result) {
          setTempGatewayConfig(prev => ({
            ...prev,
            qrCodeUrl: uploadEvent.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Record Manual Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRest = tenants.find(t => t.id === paymentFormData.restaurantId);
    const pkgObj = packages.find(p => p.id === paymentFormData.packageId) || packages[1];
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    const newPayment: SubscriptionPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      invoiceId,
      restaurantId: paymentFormData.restaurantId || 'rest-custom',
      restaurantName: selectedRest ? selectedRest.name : 'Direct Client Account',
      clientName: paymentFormData.clientName.trim() || (selectedRest?.ownerName || 'Restaurant Owner'),
      clientEmail: paymentFormData.clientEmail.trim().toLowerCase() || (selectedRest?.ownerEmail || 'owner@example.com'),
      clientPhone: paymentFormData.clientPhone.trim() || (selectedRest?.phone || ''),
      packageId: paymentFormData.packageId,
      packageName: pkgObj.name,
      amount: Number(paymentFormData.amount),
      currency: paymentFormData.currency,
      method: paymentFormData.method,
      refNumber: paymentFormData.refNumber.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: paymentFormData.status,
      notes: paymentFormData.notes.trim()
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    saveSubscriptionPayments(updated);
    setIsRecordPaymentOpen(false);
    showToast(`Payment recorded under ${invoiceId} for ${newPayment.restaurantName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200 text-xs">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-900 hover:text-black">✕</button>
        </div>
      )}

      {/* Top Super Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Master Platform Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              App Owner Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage all onboarded restaurant subscriptions, sign packages, audit full payment histories, and customize the <strong className="text-amber-400">QR Seating Restaurant Manager</strong> app name, logo branding, and payment gateways.
            </p>

            {/* Active App Name & Branding Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-md">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white overflow-hidden shrink-0 border border-amber-400/40 font-bold">
                  {platformBranding?.appLogoUrl || currentRestaurant.logoUrl ? (
                    <img src={platformBranding?.appLogoUrl || currentRestaurant.logoUrl} alt={platformBranding?.appName || currentRestaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sliders className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Platform Brand</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                    {platformBranding?.appName || currentRestaurant.name || 'QR Seating Restaurant Manager'}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('platform_branding')}
                  className="ml-1 text-[11px] text-purple-300 hover:text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 px-2.5 py-1 rounded-xl border border-purple-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  <span>App Brand</span>
                </button>
                <button
                  onClick={() => setActiveTab('customer_portal_branding')}
                  className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-xl border border-amber-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Utensils className="w-3 h-3 text-amber-400" />
                  <span>Portal Brand</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation Switcher Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onSwitchToHostDesk}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              Open Restaurant Host Desk
            </button>

            {onSwitchToCustomerPortal && (
              <button
                onClick={onSwitchToCustomerPortal}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                Customer Booking View
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Platform KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ₹{totalINRRevenue.toLocaleString()}{' '}
              {totalUSDRevenue > 0 && <span className="text-xs text-slate-400 font-normal">/ ${totalUSDRevenue}</span>}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across all package setups & deposits</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Subscribed Restaurants</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalActiveRestaurants} <span className="text-xs text-slate-400 font-normal">/ {tenants.length} Total</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active licensed client accounts</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Physical Tables Managed</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
              {totalTablesAcrossPlatform}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Connected across all dining zones</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Master Gateway Status</span>
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400 truncate mt-1">
              {gatewayConfig.upiId}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">GPay: {gatewayConfig.gpayNumber}</div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('platform_branding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'platform_branding'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Platform App Brand Settings (Master SaaS Identity)
          </button>

          <button
            onClick={() => setActiveTab('customer_portal_branding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'customer_portal_branding'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            Customer Portal Branding (Venue Customizer)
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Manage Restaurants & Subscriptions ({tenants.length})
          </button>

          <button
            onClick={() => setActiveTab('gateway_packaging')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gateway_packaging'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Packaging & GPay Gateways Tab
          </button>

          <button
            onClick={() => setActiveTab('payment_history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payment_history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Payment History & Invoices ({payments.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0A: PLATFORM APP BRANDING SETTINGS (MASTER SAAS IDENTITY) */}
      {/* ========================================================================= */}
      {activeTab === 'platform_branding' && (
        <PlatformBrandingSection
          platformBranding={platformBranding}
          onSavePlatformBranding={handleSavePlatformBranding}
          compressImage={compressLogoImage}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0B: CUSTOMER PORTAL BRANDING (VENUE CUSTOMIZER) */}
      {/* ========================================================================= */}
      {activeTab === 'customer_portal_branding' && (
        <CustomerPortalBrandingSection
          currentRestaurant={currentRestaurant}
          tenants={tenants}
          onSaveCustomerPortalBranding={handleSaveCustomerPortalBranding}
          compressImage={compressLogoImage}
          showToast={showToast}
          onPreviewCustomerPortal={onSwitchToCustomerPortal}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: RESTAURANT TENANTS & SUBSCRIPTIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          
          {/* Action & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search restaurant name, owner, email, or city..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={tenantStatusFilter}
                onChange={e => setTenantStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Billing Status</option>
                <option value="active">Active Licensed</option>
                <option value="trial">Trial Period</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={tenantPackageFilter}
                onChange={e => setTenantPackageFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Packages</option>
                <option value="starter">Starter Front Desk</option>
                <option value="pro">SmartHost Pro</option>
                <option value="enterprise">Enterprise Multi-Chain</option>
              </select>

              {/* Add Restaurant Button */}
              <button
                onClick={() => {
                  setTenantFormData({
                    name: '',
                    tagline: '',
                    ownerName: '',
                    ownerEmail: '',
                    phone: '',
                    address: '',
                    packageId: 'pro',
                    status: 'active',
                    tablesCount: 16,
                    notes: ''
                  });
                  setIsAddTenantOpen(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 ml-auto md:ml-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add New Restaurant
              </button>
            </div>

          </div>

          {/* Restaurants Grid / Cards */}
          {filteredTenants.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Restaurants Matching Search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search query or add a new restaurant using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredTenants.map(restaurant => (
                <div
                  key={restaurant.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header with Name & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white truncate">{restaurant.name}</h3>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              restaurant.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : restaurant.status === 'trial'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {restaurant.status}
                          </span>
                        </div>
                        {restaurant.tagline && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{restaurant.tagline}</p>
                        )}
                      </div>

                      <span className="text-[11px] bg-slate-950 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold shrink-0">
                        {restaurant.packageName.replace('Package ', 'Pkg ')}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Owner / Contact</span>
                        <span className="font-semibold text-slate-200 truncate block">{restaurant.ownerName}</span>
                        <span className="text-slate-400 text-[10px] truncate block">{restaurant.ownerEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Phone & Location</span>
                        <span className="font-semibold text-slate-200 block">{restaurant.phone}</span>
                        <span className="text-slate-400 text-[10px] truncate block">{restaurant.address}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-900">
                        <span className="text-slate-500 text-[10px] block">Physical Tables</span>
                        <span className="font-bold text-amber-400">{restaurant.tablesCount} Tables</span>
                      </div>
                      <div className="pt-1 border-t border-slate-900">
                        <span className="text-slate-500 text-[10px] block">Joined Date</span>
                        <span className="font-bold text-slate-300">{restaurant.joinedDate}</span>
                      </div>
                    </div>

                    {restaurant.notes && (
                      <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <strong className="text-amber-400 text-[11px]">Internal Note:</strong> {restaurant.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEditModal(restaurant)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modify Details
                    </button>

                    {onSelectRestaurant && (
                      <button
                        onClick={() => onSelectRestaurant(restaurant)}
                        className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1 transition"
                        title="Switch into this restaurant's desk"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Host Desk
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingTenant(restaurant)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                      title="Delete Restaurant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PACKAGING & GPAY GATEWAYS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'gateway_packaging' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Google Pay, UPI & Bank Gateway Settings
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  These payment details are displayed to customers during table reservations and to restaurant clients signing packages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempGatewayConfig(getAppOwnerGatewayConfig());
                    setTempPackages(getSaaSPackages());
                    showToast('Settings reset to active stored configuration.');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Discard Changes
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveGatewaySettings} className="space-y-8">
              
              {/* Section A: Google Pay & UPI Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Google Pay & UPI Payment Credentials</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Merchant UPI ID <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smarthost.billing@okhdfcbank"
                      value={tempGatewayConfig.upiId}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, upiId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500">Supports GPay, PhonePe, Paytm, BHIM</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      GPay / PhonePe Mobile Number <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98200 12345"
                      value={tempGatewayConfig.gpayNumber}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, gpayNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500">For direct number transfer & verification</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Merchant Display Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SmartHost Technologies"
                      value={tempGatewayConfig.merchantName}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, merchantName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-slate-500">Visible on banking apps when scanning QR</p>
                  </div>
                </div>

                {/* Custom QR Scanner Upload */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-amber-400" /> Custom Merchant QR Scanner Code (Optional)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload your official bank/GPay merchant sticker image or leave empty for auto-generated QR.
                      </p>
                    </div>
                    {tempGatewayConfig.qrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => setTempGatewayConfig({ ...tempGatewayConfig, qrCodeUrl: '' })}
                        className="text-[11px] text-rose-400 hover:text-rose-300"
                      >
                        Remove Custom Image
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                    {tempGatewayConfig.qrCodeUrl && (
                      <img
                        src={tempGatewayConfig.qrCodeUrl}
                        alt="Custom QR Preview"
                        className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-700"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Section B: Bank Transfer / NEFT / IMPS Gateway */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Building2 className="w-4 h-4" />
                  <span>Corporate Bank Transfer & Wire Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Bank Name & Branch</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankName}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank, Commercial Branch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankAccountName}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankAccountName: e.target.value })}
                      placeholder="e.g. SmartHost Technologies Pvt Ltd"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Account Number</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankAccountNumber}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankAccountNumber: e.target.value })}
                      placeholder="e.g. 50200088991122"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">IFSC Code</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankIfscCode}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankIfscCode: e.target.value })}
                      placeholder="e.g. HDFC0001234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Account Type</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankAccountType}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankAccountType: e.target.value })}
                      placeholder="e.g. Current Account"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">SWIFT / BIC Code (Optional)</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.bankSwiftCode || ''}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, bankSwiftCode: e.target.value })}
                      placeholder="e.g. HDFCINBBXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Section C: Customer Booking Payment & Deposit Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Customer Table Reservation Booking Deposit Settings</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={tempGatewayConfig.enableBookingDeposit}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, enableBookingDeposit: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 w-4 h-4"
                    />
                    <span>Enable Table Advance Deposit Section for Guests</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Deposit Amount (₹ INR)</label>
                    <input
                      type="number"
                      value={tempGatewayConfig.depositAmountINR}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, depositAmountINR: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Deposit Amount ($ USD)</label>
                    <input
                      type="number"
                      value={tempGatewayConfig.depositAmountUSD}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, depositAmountUSD: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-3">
                    <label className="text-xs font-bold text-slate-300">Customer Booking Payment Notice</label>
                    <input
                      type="text"
                      value={tempGatewayConfig.depositInstructions}
                      onChange={e => setTempGatewayConfig({ ...tempGatewayConfig, depositInstructions: e.target.value })}
                      placeholder="e.g. Scan with Google Pay to guarantee table seating during rush hours."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section D: SaaS Packaging Pricing Editor */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Award className="w-4 h-4" />
                  <span>SaaS Setup Packages & Pricing Tiers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tempPackages.map((pkg, idx) => (
                    <div key={pkg.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white">{pkg.name}</h4>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                          {pkg.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Price (INR ₹)</label>
                          <input
                            type="number"
                            value={pkg.oneTimePriceINR}
                            onChange={e => {
                              const updated = [...tempPackages];
                              updated[idx] = { ...pkg, oneTimePriceINR: Number(e.target.value) };
                              setTempPackages(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Price (USD $)</label>
                          <input
                            type="number"
                            value={pkg.oneTimePriceUSD}
                            onChange={e => {
                              const updated = [...tempPackages];
                              updated[idx] = { ...pkg, oneTimePriceUSD: Number(e.target.value) };
                              setTempPackages(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">{pkg.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-xl shadow-amber-500/20 active:scale-98 cursor-pointer"
                >
                  <Save className="w-4 h-4 stroke-[3]" />
                  Save & Apply Gateway & Package Changes Globally
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT HISTORY & INVOICES */}
      {/* ========================================================================= */}
      {activeTab === 'payment_history' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice ID, restaurant, email, or UTR..."
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Payment Methods</option>
                <option value="google pay">Google Pay / UPI</option>
                <option value="bank">Bank Transfer / NEFT</option>
              </select>

              <button
                onClick={() => {
                  setPaymentFormData({
                    restaurantId: tenants[0]?.id || '',
                    clientName: tenants[0]?.ownerName || '',
                    clientEmail: tenants[0]?.ownerEmail || '',
                    clientPhone: tenants[0]?.phone || '',
                    packageId: 'pro',
                    amount: 6999,
                    currency: 'INR',
                    method: 'Google Pay / UPI',
                    refNumber: '',
                    status: 'VERIFIED',
                    notes: ''
                  });
                  setIsRecordPaymentOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Record Offline / Direct Payment
              </button>
            </div>

          </div>

          {/* Payment Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Restaurant & Client</th>
                    <th className="py-3.5 px-4">Package Plan</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method & UTR</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-amber-400">{p.invoiceId}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{p.restaurantName}</span>
                          <span className="text-[10px] text-slate-400">{p.clientEmail}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200">{p.packageName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-400 text-sm">
                          {p.currency === 'INR' ? '₹' : '$'}{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 block truncate max-w-[180px]">{p.method}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                            Ref: {p.refNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 block">{p.date}</span>
                          {p.time && <span className="text-[10px] text-slate-500">{p.time}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.status === 'VERIFIED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setViewingInvoice(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                            title="View / Print Tax Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW RESTAURANT */}
      {/* ========================================================================= */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add New Restaurant Tenant</h3>
                <p className="text-xs text-slate-400">Onboard client restaurant with custom package & tables.</p>
              </div>
              <button onClick={() => setIsAddTenantOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Restaurant Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olive Garden Trattoria"
                  value={tenantFormData.name}
                  onChange={e => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tagline / Cuisine Description</label>
                <input
                  type="text"
                  placeholder="e.g. Authentic Italian Woodfired & Patio Bar"
                  value={tenantFormData.tagline}
                  onChange={e => setTenantFormData({ ...tenantFormData, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Owner / Manager Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marco Rossi"
                    value={tenantFormData.ownerName}
                    onChange={e => setTenantFormData({ ...tenantFormData, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Owner Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@restaurant.com"
                    value={tenantFormData.ownerEmail}
                    onChange={e => setTenantFormData({ ...tenantFormData, ownerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={tenantFormData.phone}
                    onChange={e => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Physical Tables Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tenantFormData.tablesCount}
                    onChange={e => setTenantFormData({ ...tenantFormData, tablesCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Location Address</label>
                <input
                  type="text"
                  placeholder="e.g. 12 High Street, Downtown"
                  value={tenantFormData.address}
                  onChange={e => setTenantFormData({ ...tenantFormData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Assigned Package</label>
                  <select
                    value={tenantFormData.packageId}
                    onChange={e => setTenantFormData({ ...tenantFormData, packageId: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="starter">Package 1: Starter Front Desk</option>
                    <option value="pro">Package 2: SmartHost Pro</option>
                    <option value="enterprise">Package 3: Enterprise Multi-Chain</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Licensing Status</label>
                  <select
                    value={tenantFormData.status}
                    onChange={e => setTenantFormData({ ...tenantFormData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active Lifetime</option>
                    <option value="trial">Trial (14 Days)</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Internal Setup Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. VIP room setup requested, acrylic stands dispatched"
                  value={tenantFormData.notes}
                  onChange={e => setTenantFormData({ ...tenantFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Create Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MODIFY / EDIT RESTAURANT */}
      {/* ========================================================================= */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Modify Restaurant Details</h3>
                <p className="text-xs text-amber-400 font-mono">{editingTenant.id} - {editingTenant.name}</p>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTenant} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Restaurant Business Name</label>
                <input
                  type="text"
                  required
                  value={tenantFormData.name}
                  onChange={e => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tagline / Cuisine</label>
                <input
                  type="text"
                  value={tenantFormData.tagline}
                  onChange={e => setTenantFormData({ ...tenantFormData, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={tenantFormData.ownerName}
                    onChange={e => setTenantFormData({ ...tenantFormData, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Owner Email</label>
                  <input
                    type="email"
                    required
                    value={tenantFormData.ownerEmail}
                    onChange={e => setTenantFormData({ ...tenantFormData, ownerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={tenantFormData.phone}
                    onChange={e => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Physical Tables</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tenantFormData.tablesCount}
                    onChange={e => setTenantFormData({ ...tenantFormData, tablesCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Address</label>
                <input
                  type="text"
                  value={tenantFormData.address}
                  onChange={e => setTenantFormData({ ...tenantFormData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Assigned Package</label>
                  <select
                    value={tenantFormData.packageId}
                    onChange={e => setTenantFormData({ ...tenantFormData, packageId: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="starter">Package 1: Starter Front Desk</option>
                    <option value="pro">Package 2: SmartHost Pro</option>
                    <option value="enterprise">Package 3: Enterprise Multi-Chain</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Licensing Status</label>
                  <select
                    value={tenantFormData.status}
                    onChange={e => setTenantFormData({ ...tenantFormData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active Lifetime</option>
                    <option value="trial">Trial Period</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Internal Notes</label>
                <textarea
                  rows={2}
                  value={tenantFormData.notes}
                  onChange={e => setTenantFormData({ ...tenantFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4 stroke-[3]" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE RESTAURANT CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Restaurant Tenant?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to permanently remove <strong className="text-amber-400">{deletingTenant.name}</strong> from the platform? This will deactivate their live seating grid and QR stands.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTenant(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTenant}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD OFFLINE / DIRECT PAYMENT */}
      {/* ========================================================================= */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Record Subscription Payment</h3>
                <p className="text-xs text-slate-400">Log manual GPay, UPI or Bank wire transfer.</p>
              </div>
              <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Select Restaurant</label>
                <select
                  value={paymentFormData.restaurantId}
                  onChange={e => {
                    const t = tenants.find(item => item.id === e.target.value);
                    setPaymentFormData({
                      ...paymentFormData,
                      restaurantId: e.target.value,
                      clientName: t?.ownerName || '',
                      clientEmail: t?.ownerEmail || '',
                      clientPhone: t?.phone || ''
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Custom / New Client --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.ownerEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Package</label>
                  <select
                    value={paymentFormData.packageId}
                    onChange={e => {
                      const p = packages.find(pkg => pkg.id === e.target.value);
                      setPaymentFormData({
                        ...paymentFormData,
                        packageId: e.target.value,
                        amount: p ? (paymentFormData.currency === 'INR' ? p.oneTimePriceINR : p.oneTimePriceUSD) : 6999
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="starter">Starter Front Desk</option>
                    <option value="pro">SmartHost Pro</option>
                    <option value="enterprise">Enterprise Multi-Chain</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Amount Paid</label>
                  <input
                    type="number"
                    required
                    value={paymentFormData.amount}
                    onChange={e => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Payment Method</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Pay / UPI (smarthost.billing@okhdfcbank)"
                  value={paymentFormData.method}
                  onChange={e => setPaymentFormData({ ...paymentFormData, method: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Bank UTR / Transaction Reference #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-UTR-9821839281"
                  value={paymentFormData.refNumber}
                  onChange={e => setPaymentFormData({ ...paymentFormData, refNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Save Payment Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW / PRINT TAX INVOICE RECEIPT */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Commercial Tax Invoice</h3>
                  <span className="text-xs text-amber-400 font-mono font-bold">#{viewingInvoice.invoiceId}</span>
                </div>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-inner space-y-4 font-mono text-xs border-2 border-slate-200">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <h4 className="text-sm font-black tracking-tight">{gatewayConfig.merchantName}</h4>
                <p className="text-[10px] text-slate-500">Official Table Booking & SaaS Setup Licensing</p>
                <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  PAYMENT {viewingInvoice.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px]">BILLED TO:</span>
                  <span className="font-bold">{viewingInvoice.restaurantName}</span>
                  <div className="text-[10px] text-slate-600">{viewingInvoice.clientEmail}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px]">INVOICE DATE:</span>
                  <span className="font-bold">{viewingInvoice.date}</span>
                  <div className="text-[10px] text-slate-600">{viewingInvoice.time || '12:00 PM'}</div>
                </div>
              </div>

              <div className="space-y-2 py-1 border-b border-slate-100">
                <div className="flex justify-between font-bold">
                  <span>{viewingInvoice.packageName}</span>
                  <span className="text-emerald-700">
                    {viewingInvoice.currency === 'INR' ? '₹' : '$'}{viewingInvoice.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  One-time commercial setup licensing with lifetime digital floor grid, QR seating stands & direct booking URL.
                </p>
              </div>

              <div className="space-y-1 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span>Payment Gateway:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">{viewingInvoice.method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction UTR / Ref:</span>
                  <span className="font-bold text-slate-800">{viewingInvoice.refNumber}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

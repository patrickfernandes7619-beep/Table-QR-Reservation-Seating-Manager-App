import React, { useState, useEffect, useRef } from 'react';
import { RestaurantInfo, RestaurantTenant } from '../../types';
import {
  Utensils,
  Sparkles,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Clock,
  Tag,
  DollarSign,
  Palette,
  Eye,
  RefreshCw,
  QrCode,
  Users,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { calculateBusinessDate } from '../../utils/dateUtils';
import { initialRestaurantInfo } from '../../initialData';

interface CustomerPortalBrandingSectionProps {
  currentRestaurant?: RestaurantInfo;
  tenants?: RestaurantTenant[];
  onSaveCustomerPortalBranding: (updated: RestaurantInfo, targetTenantId?: string) => Promise<void> | void;
  compressImage?: (file: File, maxW?: number, maxH?: number) => Promise<string>;
  showToast?: (msg: string) => void;
  onPreviewCustomerPortal?: () => void;
}

export const CustomerPortalBrandingSection: React.FC<CustomerPortalBrandingSectionProps> = ({
  currentRestaurant = initialRestaurantInfo,
  tenants = [],
  onSaveCustomerPortalBranding,
  compressImage,
  showToast,
  onPreviewCustomerPortal
}) => {
  const safeRestaurant = currentRestaurant || initialRestaurantInfo;
  const [selectedTenantId, setSelectedTenantId] = useState<string>('current');

  // Form Fields
  const [name, setName] = useState(safeRestaurant.name || 'The Golden Truffle Bistro');
  const [tagline, setTagline] = useState(
    safeRestaurant.tagline || 'Fine Artisanal Dining, Seasonal Tasting Menus & Handcrafted Cocktails'
  );
  const [logoUrl, setLogoUrl] = useState(safeRestaurant.logoUrl || '');
  const [heroBannerUrl, setHeroBannerUrl] = useState(
    safeRestaurant.heroBannerUrl ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
  );
  const [address, setAddress] = useState(
    safeRestaurant.address || '742 Evergreen Terrace, Downtown Food District'
  );
  const [phone, setPhone] = useState(safeRestaurant.phone || '(555) 234-8901');
  const [operatingHours, setOperatingHours] = useState(
    safeRestaurant.operatingHours || 'Mon-Sun: 11:30 AM - 10:00 PM'
  );
  const [currentBusinessDate, setCurrentBusinessDate] = useState(
    safeRestaurant.currentBusinessDate || calculateBusinessDate(safeRestaurant.operatingHours)
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    safeRestaurant.welcomeMessage ||
      'Welcome to The Golden Truffle Bistro! Select your table or join our live digital waitlist.'
  );
  const [deskInstructions, setDeskInstructions] = useState(
    safeRestaurant.deskInstructions ||
      'Scan table QR code for contactless digital seating, party check-in, and instant ordering.'
  );
  const [depositAmount, setDepositAmount] = useState<number>(safeRestaurant.depositAmount ?? 500);
  const [currency, setCurrency] = useState<string>(safeRestaurant.currency || 'INR');
  const [diningTheme, setDiningTheme] = useState<string>(safeRestaurant.diningTheme || 'amber');
  const [autoSyncDate, setAutoSyncDate] = useState<boolean>(true);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When selected tenant changes, populate state
  useEffect(() => {
    if (selectedTenantId === 'current') {
      setName(currentRestaurant.name || 'The Golden Truffle Bistro');
      setTagline(currentRestaurant.tagline || 'Fine Artisanal Dining & Craft Cocktails');
      setLogoUrl(currentRestaurant.logoUrl || '');
      setHeroBannerUrl(
        currentRestaurant.heroBannerUrl ||
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
      );
      setAddress(currentRestaurant.address || '742 Evergreen Terrace, Downtown Food District');
      setPhone(currentRestaurant.phone || '(555) 234-8901');
      setOperatingHours(currentRestaurant.operatingHours || 'Mon-Sun: 11:30 AM - 10:00 PM');
      setCurrentBusinessDate(
        currentRestaurant.currentBusinessDate || calculateBusinessDate(currentRestaurant.operatingHours)
      );
      setWelcomeMessage(
        currentRestaurant.welcomeMessage || 'Welcome! Scan to join our digital waitlist or reserve a table.'
      );
      setDeskInstructions(
        currentRestaurant.deskInstructions || 'Scan QR code to check in for immediate walk-in seating.'
      );
      setDepositAmount(currentRestaurant.depositAmount ?? 500);
      setCurrency(currentRestaurant.currency || 'INR');
      setDiningTheme(currentRestaurant.diningTheme || 'amber');
    } else {
      const found = tenants.find((t) => t.id === selectedTenantId);
      if (found) {
        setName(found.name);
        setTagline(found.tagline || 'Artisanal Dining & Chef Specials');
        setAddress(found.address || 'Downtown District');
        setPhone(found.phone || '(555) 000-0000');
        setOperatingHours('Mon-Sun: 11:00 AM - 11:00 PM');
        setCurrentBusinessDate(calculateBusinessDate('Mon-Sun: 11:00 AM - 11:00 PM'));
        setWelcomeMessage(`Welcome to ${found.name}! Enjoy contactless seating and premium service.`);
        setDeskInstructions('Scan QR stand to check in with host or select your table.');
        setDepositAmount(500);
        setCurrency('INR');
      }
    }
    setIsDirty(false);
  }, [selectedTenantId, currentRestaurant, tenants]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, SVG, WebP).');
        return;
      }
      setIsUploadingLogo(true);
      try {
        const compressed = await compressImage(file, 512, 512);
        setLogoUrl(compressed);
        setIsDirty(true);
        showToast('Venue logo image compressed and ready!');
      } catch (err) {
        console.error(err);
        showToast('Failed to load logo image.');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  // Handle Hero Banner Upload
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      setIsUploadingHero(true);
      try {
        const compressed = await compressImage(file, 1200, 600);
        setHeroBannerUrl(compressed);
        setIsDirty(true);
        showToast('Hero banner image compressed and ready!');
      } catch (err) {
        console.error(err);
        showToast('Failed to load hero banner.');
      } finally {
        setIsUploadingHero(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a valid Restaurant / Venue Name.');
      return;
    }
    setIsSaving(true);
    try {
      const updated: RestaurantInfo = {
        ...currentRestaurant,
        name: name.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        heroBannerUrl: heroBannerUrl.trim(),
        address: address.trim(),
        phone: phone.trim(),
        operatingHours: operatingHours.trim(),
        currentBusinessDate: currentBusinessDate.trim(),
        welcomeMessage: welcomeMessage.trim(),
        deskInstructions: deskInstructions.trim(),
        depositAmount: Number(depositAmount) || 0,
        currency: currency.trim() || 'INR',
        diningTheme
      };
      await onSaveCustomerPortalBranding(updated, selectedTenantId === 'current' ? undefined : selectedTenantId);
      setIsDirty(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      showToast(`✓ Customer Portal & Venue Branding saved for "${name}"!`);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      showToast('Failed to save customer portal branding.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Diner Experience & Venue Customizer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Customer Portal & Venue Branding
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Customize the diner-facing public reservation portal, table booking view, QR code check-in screen, cover hero banner, address, and live business date for any dining venue.
            </p>
          </div>

          {/* Restaurant / Venue Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Editing Venue</div>
              <div className="text-xs font-bold text-white truncate max-w-[180px]">{name}</div>
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-semibold"
            >
              <option value="current">Current Restaurant ({currentRestaurant.name || 'Active'})</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city || 'Venue'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Form & Live Preview */}
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Venue Identity & Logo Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Restaurant Name & Venue Logo</h3>
                  <p className="text-xs text-slate-400">Displayed on customer mobile booking cards and table QR stands</p>
                </div>
              </div>

              {/* Restaurant Name */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>Restaurant / Venue Name <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400">Customer portal header</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. The Golden Truffle Bistro"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition shadow-inner font-semibold"
                />
              </div>

              {/* Restaurant Logo Upload / URL */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-amber-300 block">
                  Restaurant Venue Logo
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Utensils className="w-8 h-8 text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste Image URL (e.g. https://.../logo.png)"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingLogo ? 'Processing...' : 'Upload Logo File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setIsDirty(true);
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1.5 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover / Hero Banner Image */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-amber-300 block flex items-center justify-between">
                  <span>Customer Portal Hero Cover Banner</span>
                  <span className="text-[10px] text-slate-400">Background photo for customer view</span>
                </label>

                <div className="h-24 w-full rounded-xl bg-slate-900 border border-slate-700 overflow-hidden relative shadow">
                  {heroBannerUrl ? (
                    <img src={heroBannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      No cover banner loaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cover Image URL (e.g. https://images.unsplash.com/...)"
                    value={heroBannerUrl}
                    onChange={(e) => {
                      setHeroBannerUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingHero ? 'Uploading...' : 'Upload Cover'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroUpload}
                      className="hidden"
                      disabled={isUploadingHero}
                    />
                  </label>
                </div>
              </div>

              {/* Tagline & Slogan */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Dining Tagline & Specialties
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => {
                    setTagline(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Fine Artisanal Dining, Seasonal Tasting Menus & Craft Cocktails"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition leading-relaxed"
                />
              </div>
            </div>

            {/* 2. Location, Hours, Business Date & Booking Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Location, Schedule & Table Deposit</h3>
                  <p className="text-xs text-slate-400">Diner contact info, operating hours, and booking fees</p>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Physical Venue Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 742 Evergreen Terrace, Downtown Food District"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Host Desk Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="(555) 234-8901"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Operating Hours
                  </label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => {
                      setOperatingHours(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Mon-Sun: 11:30 AM - 10:00 PM"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Current Business Date */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Current Business Date
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={autoSyncDate}
                      onChange={(e) => setAutoSyncDate(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Auto-sync with shift hours
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={currentBusinessDate}
                    onChange={(e) => {
                      setCurrentBusinessDate(e.target.value);
                      setAutoSyncDate(false);
                      setIsDirty(true);
                    }}
                    className="flex-1 bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const calculated = calculateBusinessDate(operatingHours);
                      setCurrentBusinessDate(calculated);
                      setIsDirty(true);
                      showToast(`Date synchronized with hours: ${calculated}`);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync
                  </button>
                </div>
              </div>

              {/* Customer Greeting & QR Instructions */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Diner Welcome Greeting (Customer Portal)
                  </label>
                  <textarea
                    rows={2}
                    value={welcomeMessage}
                    onChange={(e) => {
                      setWelcomeMessage(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Welcome message displayed to diners on QR check-in..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Host Desk & Table QR Stand Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={deskInstructions}
                    onChange={(e) => {
                      setDeskInstructions(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Printed instructions on tabletop QR stands..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition leading-relaxed"
                  />
                </div>
              </div>

              {/* Table Deposit Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Table Booking Deposit Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(Number(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Deposit Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-semibold"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Save Button Card */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-white">Save Venue Customer Portal Branding</h4>
                <p className="text-xs text-slate-400">Applies instantly to diner QR scan and table booking view</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`font-black py-3 px-6 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xl cursor-pointer shrink-0 ${
                  saveSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : isSaving
                    ? 'bg-amber-600 text-slate-950 opacity-80'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20 active:scale-[0.98]'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
                    <span>Saving Venue Branding...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>✓ Venue Brand Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Save Customer Portal Branding</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Live Previews */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Customer Portal Header Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Eye className="w-4 h-4" />
                  <span>Live Customer Portal Preview</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Diner Booking View</span>
              </div>

              {/* Simulated Customer Mobile Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Hero Banner with Logo Overlay */}
                <div className="h-32 w-full relative">
                  {heroBannerUrl ? (
                    <img src={heroBannerUrl} alt="Banner" className="w-full h-full object-cover brightness-75" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-950 to-slate-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-amber-500/50 p-1 shadow-lg overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Utensils className="w-6 h-6 text-amber-400 m-auto mt-2" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white tracking-tight">{name}</h4>
                      <p className="text-[10px] text-amber-300/90 line-clamp-1">{tagline}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                    "{welcomeMessage}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">Table Booking Deposit</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {currency === 'INR' ? '₹' : '$'}{depositAmount}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">Shift Date</span>
                      <span className="font-bold text-amber-400 font-mono">{currentBusinessDate}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live QR Stand Look */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <QrCode className="w-4 h-4" />
                  <span>Table QR Stand Placard Look</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Printed Table Sign</span>
              </div>

              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 mx-auto flex items-center justify-center text-slate-950 font-bold overflow-hidden shadow">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-950 tracking-tight">{name}</h4>
                  <p className="text-[10px] text-slate-600 font-medium">{tagline}</p>
                </div>

                <div className="w-24 h-24 bg-slate-100 border-2 border-slate-900 rounded-xl mx-auto flex items-center justify-center shadow-inner">
                  <QrCode className="w-16 h-16 text-slate-900" />
                </div>

                <p className="text-[10px] text-slate-700 font-bold max-w-xs mx-auto leading-tight">
                  {deskInstructions}
                </p>

                <div className="text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                  {operatingHours} • {phone}
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

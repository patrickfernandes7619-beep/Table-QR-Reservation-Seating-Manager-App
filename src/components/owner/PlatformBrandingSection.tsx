import React, { useState } from 'react';
import { AppPlatformBranding } from '../../types';
import {
  Sliders,
  Sparkles,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Utensils
} from 'lucide-react';

import { initialPlatformBranding } from '../../initialData';

interface PlatformBrandingSectionProps {
  platformBranding?: AppPlatformBranding;
  onSavePlatformBranding: (updated: AppPlatformBranding) => Promise<void> | void;
  compressImage?: (file: File, maxW?: number, maxH?: number) => Promise<string>;
  showToast?: (msg: string) => void;
}

export const PlatformBrandingSection: React.FC<PlatformBrandingSectionProps> = ({
  platformBranding = initialPlatformBranding,
  onSavePlatformBranding,
  compressImage,
  showToast
}) => {
  const safeBranding = platformBranding || initialPlatformBranding;
  const [appName, setAppName] = useState(safeBranding.appName || 'QR Seating Restaurant Manager');
  const [appTagline, setAppTagline] = useState(
    safeBranding.appTagline ||
      'Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite'
  );
  const [appLogoUrl, setAppLogoUrl] = useState(safeBranding.appLogoUrl || '');
  const [supportEmail, setSupportEmail] = useState(safeBranding.supportEmail || 'support@qrseating.io');
  const [supportPhone, setSupportPhone] = useState(safeBranding.supportPhone || '+1 (800) 555-0199');
  const [platformDomain, setPlatformDomain] = useState(safeBranding.platformDomain || 'https://qrseating.app');
  const [primaryColor, setPrimaryColor] = useState(safeBranding.primaryColor || '#f59e0b');
  const [companyCopyright, setCompanyCopyright] = useState(
    safeBranding.companyCopyright || '© 2026 QR Seating Restaurant Manager Inc. All rights reserved.'
  );
  const [portalWelcomeText, setPortalWelcomeText] = useState(
    safeBranding.portalWelcomeText ||
      'Enterprise Restaurant Seating, Table Reservations & QR Waitlist SaaS Platform'
  );

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const themeOptions = [
    { name: 'Amber Gold', hex: '#f59e0b', bgClass: 'from-amber-500 to-orange-600', ringClass: 'ring-amber-400' },
    { name: 'Royal Purple', hex: '#8b5cf6', bgClass: 'from-purple-500 to-indigo-600', ringClass: 'ring-purple-400' },
    { name: 'Emerald Mint', hex: '#10b981', bgClass: 'from-emerald-500 to-teal-600', ringClass: 'ring-emerald-400' },
    { name: 'Deep Sapphire', hex: '#3b82f6', bgClass: 'from-blue-500 to-cyan-600', ringClass: 'ring-blue-400' },
    { name: 'Rose Crimson', hex: '#f43f5e', bgClass: 'from-rose-500 to-pink-600', ringClass: 'ring-rose-400' }
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast?.('Please select a valid image file (PNG, JPG, SVG, WebP).');
        return;
      }
      setIsUploadingLogo(true);
      try {
        if (compressImage) {
          const compressed = await compressImage(file, 512, 512);
          setAppLogoUrl(compressed);
        } else {
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              setAppLogoUrl(evt.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
        setIsDirty(true);
        showToast?.('Platform logo image loaded and compressed!');
      } catch (err) {
        console.error(err);
        showToast?.('Failed to load logo image.');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showToast?.('Please enter a valid Platform App Name.');
      return;
    }
    setIsSaving(true);
    try {
      const updated: AppPlatformBranding = {
        appName: appName.trim(),
        appTagline: appTagline.trim(),
        appLogoUrl: appLogoUrl.trim(),
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        platformDomain: platformDomain.trim(),
        primaryColor,
        companyCopyright: companyCopyright.trim(),
        portalWelcomeText: portalWelcomeText.trim()
      };
      await onSavePlatformBranding(updated);
      setIsDirty(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      showToast?.('✓ Master Platform Brand Settings saved globally!');
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      showToast?.('Failed to save platform branding.');
    }
  };

  const handleResetDefaults = () => {
    setAppName('QR Seating Restaurant Manager');
    setAppTagline('Contactless QR Code Walk-In Check-In, Real-Time Floor Plan Seating Grid & Smart Waitlist Suite');
    setAppLogoUrl('');
    setSupportEmail('support@qrseating.io');
    setSupportPhone('+1 (800) 555-0199');
    setPlatformDomain('https://qrseating.app');
    setPrimaryColor('#f59e0b');
    setCompanyCopyright('© 2026 QR Seating Restaurant Manager Inc. All rights reserved.');
    setPortalWelcomeText('Enterprise Restaurant Seating, Table Reservations & QR Waitlist SaaS Platform');
    setIsDirty(true);
    showToast?.('Platform fields reset to default values.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Master SaaS Platform Identity</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Platform App Brand Settings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Configure platform-wide branding (SaaS Platform App Name, Super Admin Logo, SaaS Tagline, Platform Domain, and Support Contacts). This is distinct from individual restaurant/customer portal branding.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset SaaS Defaults
          </button>
        </div>
      </div>

      {/* Form & Live Preview */}
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Platform Brand & Logo Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">SaaS Platform App Name & Logo</h3>
                  <p className="text-xs text-slate-400">Master branding for index landing page and super admin navbar</p>
                </div>
              </div>

              {/* Platform App Name */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>Platform App Name <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400">Displayed in main title & metadata</span>
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => {
                    setAppName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. QR Seating Restaurant Manager"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition shadow-inner font-semibold"
                />
              </div>

              {/* Platform Logo Upload / URL */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-purple-300 block">
                  Platform Master Logo
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {appLogoUrl ? (
                      <img src={appLogoUrl} alt="Platform Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-purple-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste Image URL (e.g. https://.../logo.png)"
                      value={appLogoUrl}
                      onChange={(e) => {
                        setAppLogoUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5">
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

                      {appLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppLogoUrl('');
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

              {/* Platform Slogan / Tagline */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Platform Tagline & Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={appTagline}
                  onChange={(e) => {
                    setAppTagline(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Master headline for the platform..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition leading-relaxed"
                />
              </div>

              {/* Public SaaS Welcome Headline */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Public Landing Header Headline
                </label>
                <input
                  type="text"
                  value={portalWelcomeText}
                  onChange={(e) => {
                    setPortalWelcomeText(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Enterprise Restaurant Seating & QR Waitlist SaaS"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* 2. Support, Domain & Brand Theme Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Platform Domain & Support</h3>
                  <p className="text-xs text-slate-400">Public contact and support links displayed on master invoices</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => {
                      setSupportEmail(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="support@smarthost.io"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" /> Support Phone
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => {
                      setSupportPhone(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="+1 (800) 555-0199"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" /> Platform URL / Custom Domain
                </label>
                <input
                  type="text"
                  value={platformDomain}
                  onChange={(e) => {
                    setPlatformDomain(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://smarthost.app"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none transition"
                />
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" /> Platform Master Color Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.hex}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(opt.hex);
                        setIsDirty(true);
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition text-center ${
                        primaryColor === opt.hex
                          ? 'bg-slate-950 border-purple-400 ring-2 ring-purple-400/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${opt.bgClass} shadow-md`} />
                      <span className="text-[11px] font-bold">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Copyright */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Copyright Footer Notice
                </label>
                <input
                  type="text"
                  value={companyCopyright}
                  onChange={(e) => {
                    setCompanyCopyright(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="© 2026 QR Seating Restaurant Manager Inc."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-white">Save Master Platform Branding</h4>
                <p className="text-xs text-slate-400">Updates platform metadata, landing header, and invoices</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`font-black py-3 px-6 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xl cursor-pointer shrink-0 ${
                  saveSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : isSaving
                    ? 'bg-purple-600 text-white opacity-80'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/20 active:scale-[0.98]'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Saving Platform...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>✓ Platform Brand Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>Save Platform App Branding</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Live Previews */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Master Navbar Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Eye className="w-4 h-4" />
                  <span>Live Master Header Preview</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Platform Navbar</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow">
                      {appLogoUrl ? (
                        <img src={appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white tracking-tight leading-tight">{appName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Super Admin Platform</div>
                    </div>
                  </div>

                  <div className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    Master SaaS
                  </div>
                </div>
              </div>
            </div>

            {/* Live Landing Hero Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Layers className="w-4 h-4" />
                  <span>Landing Page Header Look</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Index Page</span>
              </div>

              <div className="bg-slate-950 border border-purple-500/20 rounded-2xl p-5 space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{portalWelcomeText}</span>
                </div>

                <h3 className="text-base font-black text-white tracking-tight">
                  {appName}
                </h3>

                <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {appTagline}
                </p>

                <div className="pt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500 border-t border-slate-800/80">
                  <span>{supportEmail}</span>
                  <span>•</span>
                  <span>{supportPhone}</span>
                </div>
              </div>
            </div>

            {/* Master Invoice Footer Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Platform Copyright Notice
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-[11px] text-slate-400 text-center font-mono">
                {companyCopyright}
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

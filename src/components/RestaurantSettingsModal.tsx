import React, { useState, useRef, useEffect } from 'react';
import { RestaurantInfo } from '../types';
import { Settings, X, Save, Building2, Phone, MapPin, Clock, Tag, Image as ImageIcon, Upload, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { calculateBusinessDate } from '../utils/dateUtils';

interface RestaurantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantInfo;
  onSave: (updated: RestaurantInfo) => Promise<void> | void;
}

export const RestaurantSettingsModal: React.FC<RestaurantSettingsModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSave
}) => {
  const [name, setName] = useState(restaurant.name);
  const [tagline, setTagline] = useState(restaurant.tagline);
  const [address, setAddress] = useState(restaurant.address);
  const [phone, setPhone] = useState(restaurant.phone);
  const [operatingHours, setOperatingHours] = useState(restaurant.operatingHours);
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || '');
  const [autoSyncDate, setAutoSyncDate] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string>('');
  
  const prevIsOpenRef = useRef(false);

  // Sync state ONLY when modal transitions from closed (false) to open (true)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setName(restaurant.name || '');
      setTagline(restaurant.tagline || '');
      setAddress(restaurant.address || '');
      setPhone(restaurant.phone || '');
      setOperatingHours(restaurant.operatingHours || '');
      setLogoUrl(restaurant.logoUrl || '');
      setUploadNotice('');
      setIsSaving(false);
      if (restaurant.currentBusinessDate) {
        setCurrentBusinessDate(restaurant.currentBusinessDate);
      } else {
        setCurrentBusinessDate(calculateBusinessDate(restaurant.operatingHours));
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, restaurant]);

  // Calculate initial business date from restaurant operating hours or stored value
  const [currentBusinessDate, setCurrentBusinessDate] = useState<string>(() => {
    return restaurant.currentBusinessDate || calculateBusinessDate(restaurant.operatingHours);
  });

  // Automatically update business date when operating hours change and autoSync is enabled
  useEffect(() => {
    if (autoSyncDate && isOpen) {
      const calculated = calculateBusinessDate(operatingHours);
      setCurrentBusinessDate(calculated);
    }
  }, [operatingHours, autoSyncDate, isOpen]);

  const handleManualSync = () => {
    const calculated = calculateBusinessDate(operatingHours);
    setCurrentBusinessDate(calculated);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select a logo image file smaller than 5MB.");
        return;
      }
      setUploadNotice('Reading image file...');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          // Resize image on canvas to keep payload small and fast
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
              setLogoUrl(compressedDataUrl);
              setUploadNotice(`Logo compressed to ${width}x${height} px PNG & ready to save!`);
            } else {
              setLogoUrl(result);
              setUploadNotice('Logo loaded & ready to save!');
            }
          };
          img.onerror = () => {
            setLogoUrl(result);
            setUploadNotice('Logo loaded & ready to save!');
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a valid Restaurant Name.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...restaurant,
        name: name.trim(),
        tagline: tagline.trim(),
        address: address.trim(),
        phone: phone.trim(),
        operatingHours: operatingHours.trim(),
        logoUrl: logoUrl.trim() || undefined,
        currentBusinessDate
      });
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error("Failed to save settings:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Restaurant Settings & Branding</h3>
              <p className="text-xs text-slate-400">Reception Desk, Header & QR Stand Branding</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Logo Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Restaurant Logo
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Recommended: 400×400 px</span>
            </div>

            {/* Recommended Size Guidelines Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200/90 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recommended Logo Specifications
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-slate-300">
                <li><strong>Aspect Ratio & Size:</strong> Square 1:1 ratio (e.g. <strong>400 × 400 px</strong> or up to 512 × 512 px).</li>
                <li><strong>Supported Formats:</strong> PNG (transparent background), JPG, SVG, or WebP.</li>
                <li><strong>Max File Size:</strong> 5 MB (automatically optimized for header & QR stands).</li>
              </ul>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-7 h-7 text-slate-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Paste Image URL (e.g. https://.../logo.png)"
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setUploadNotice('');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Logo Image
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        setUploadNotice('');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {uploadNotice && (
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {uploadNotice}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Tagline / Slogan</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3">
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
                  <Sparkles className="w-3 h-3 text-amber-400" /> Auto-sync with timings
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
                }}
                className="flex-1 bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />

              <button
                type="button"
                onClick={handleManualSync}
                title="Recalculate date based on operating hours"
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
            </div>

            {autoSyncDate ? (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                Automatically set based on operating hours ({operatingHours || 'Default'}).
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                Manual override active. Check "Auto-sync" to automatically follow restaurant shift timings.
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};


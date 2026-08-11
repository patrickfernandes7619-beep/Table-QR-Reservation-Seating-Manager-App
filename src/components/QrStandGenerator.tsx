import React, { useState, useEffect } from 'react';
import { RestaurantInfo, Table } from '../types';
import { generateQrDataUrl } from '../lib/qrUtils';
import { Printer, Download, QrCode, Utensils, Sparkles, Check, RefreshCw, Smartphone, Eye } from 'lucide-react';

interface QrStandGeneratorProps {
  restaurant: RestaurantInfo;
  selectedTableForQr?: Table | null;
  onClearSelectedTableQr?: () => void;
}

export const QrStandGenerator: React.FC<QrStandGeneratorProps> = ({
  restaurant,
  selectedTableForQr,
  onClearSelectedTableQr
}) => {
  const [standTitle, setStandTitle] = useState('WALK-IN SEATING & RESERVATIONS');
  const [standSubTitle, setStandSubTitle] = useState('Scan with your smartphone camera to join our waitlist or reserve a table instantly.');
  const [frameStyle, setFrameStyle] = useState<'classic' | 'modern' | 'luxury'>('modern');
  const [qrColorDark, setQrColorDark] = useState('#1e293b');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Target URL to encode in QR code
  const targetUrl = selectedTableForQr
    ? `${window.location.origin}?mode=customer&table=${selectedTableForQr.number}`
    : `${window.location.origin}?mode=customer`;

  useEffect(() => {
    async function loadQr() {
      const url = await generateQrDataUrl(targetUrl, qrColorDark, '#ffffff');
      setQrDataUrl(url);
    }
    loadQr();
  }, [targetUrl, qrColorDark]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Reception Desk Printable Stand Generator</h2>
            {selectedTableForQr && (
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                Table #{selectedTableForQr.number} QR
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Print high-resolution QR table tent cards or reception desk acrylic stand signs for customer self check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedTableForQr && onClearSelectedTableQr && (
            <button
              onClick={onClearSelectedTableQr}
              className="bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold"
            >
              Back to Desk Stand
            </button>
          )}

          <button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            Print Stand Sign / Tent Card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        
        {/* Customization Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 print:hidden">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Customize Desk Stand Sign
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Heading Title</label>
            <input
              type="text"
              value={standTitle}
              onChange={(e) => setStandTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Subheading / Instructions</label>
            <textarea
              rows={3}
              value={standSubTitle}
              onChange={(e) => setStandSubTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Stand Frame Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['modern', 'classic', 'luxury'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setFrameStyle(style)}
                  className={`p-2 rounded-xl text-xs font-bold uppercase transition ${
                    frameStyle === style
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">QR Code Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={qrColorDark}
                onChange={(e) => setQrColorDark(e.target.value)}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
              />
              <span className="text-xs font-mono text-slate-400">{qrColorDark}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-200">💡 Printing Tip:</p>
            <p>Click "Print Stand Sign" and select "Landscape" or "Portrait" acrylic stand size in your browser print dialog.</p>
          </div>
        </div>

        {/* Live Printable Stand Sign Display Canvas */}
        <div className="lg:col-span-7 flex justify-center print:w-full print:block">
          
          <div
            className={`w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 text-center border-4 relative ${
              frameStyle === 'luxury'
                ? 'border-amber-500 ring-8 ring-amber-500/20'
                : frameStyle === 'classic'
                ? 'border-slate-900 border-dashed'
                : 'border-slate-800'
            }`}
          >
            {/* Top Restaurant Logo & Brand */}
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-3xl shadow-lg overflow-hidden">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-8 h-8" />
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{restaurant.name}</h1>
              <p className="text-xs text-slate-600 font-semibold">{restaurant.tagline}</p>
            </div>

            {/* Stand Heading Banner */}
            <div className="bg-slate-900 text-amber-400 py-2.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow">
              {standTitle}
            </div>

            {/* Target table badge if table specific */}
            {selectedTableForQr && (
              <div className="inline-block bg-amber-100 text-amber-800 border border-amber-300 font-bold text-sm px-4 py-1 rounded-full">
                Table #{selectedTableForQr.number} ({selectedTableForQr.zone})
              </div>
            )}

            {/* High-Res QR Code */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl inline-block shadow-inner mx-auto">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Walk-In Registration QR Code" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 bg-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 leading-relaxed px-4">
                {standSubTitle}
              </p>

              <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-slate-600 pt-3 border-t border-slate-200">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" /> 1. Scan QR
                </span>
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" /> 2. Enter Party
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-amber-600" /> 3. Get Seated
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase pt-2">
              {restaurant.address} • {restaurant.phone}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

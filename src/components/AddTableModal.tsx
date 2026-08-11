import React, { useState, useEffect } from 'react';
import { TableZone, TableShape } from '../types';
import { X, Plus, Armchair } from 'lucide-react';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones?: string[];
  defaultZone?: string;
  onAddTable: (data: {
    number: string;
    name: string;
    zone: string;
    capacity: number;
    shape: TableShape;
    notes?: string;
  }) => void;
  onAddZone?: (zoneName: string) => void;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  zones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'],
  defaultZone,
  onAddTable,
  onAddZone
}) => {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState<string>('Main Dining');
  const [customZone, setCustomZone] = useState('');
  const [isAddingCustomZone, setIsAddingCustomZone] = useState(false);
  const [capacity, setCapacity] = useState(4);
  const [shape, setShape] = useState<TableShape>('square');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNumber('');
      setName('');
      setZone(defaultZone || zones[0] || 'Main Dining');
      setCustomZone('');
      setIsAddingCustomZone(false);
      setCapacity(4);
      setShape('square');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    const finalZone = isAddingCustomZone && customZone.trim() ? customZone.trim() : zone;

    if (isAddingCustomZone && customZone.trim() && onAddZone) {
      await onAddZone(customZone.trim());
    }

    const trimmedNum = number.trim();
    const trimmedName = name.trim() || `Table ${trimmedNum}`;

    onAddTable({
      number: trimmedNum,
      name: trimmedName,
      zone: finalZone,
      capacity,
      shape,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add New Table</h3>
              <p className="text-xs text-slate-400">Configure floor layout & capacity</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Table Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. M-07, P-05"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Seating Capacity *</label>
              <input
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Table Name / Label</label>
            <input
              type="text"
              placeholder="e.g. Patio Sun Umbrella, Corner Booth"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Dining Zone / Section</label>
              {!isAddingCustomZone ? (
                <select
                  value={zone}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_ZONE__') {
                      setIsAddingCustomZone(true);
                    } else {
                      setZone(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {Array.from(new Set([...zones, zone].filter(Boolean))).map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                  <option value="__NEW_ZONE__" className="text-amber-400 font-bold">+ Create New Custom Section...</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter new section name..."
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomZone(false)}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Select existing section
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Table Shape</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="square">Square</option>
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Features</label>
            <input
              type="text"
              placeholder="e.g. Pet friendly, Power outlet, Highchair space"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition"
            >
              Add Table
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

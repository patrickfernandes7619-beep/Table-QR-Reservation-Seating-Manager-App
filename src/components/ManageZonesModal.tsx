import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Layers, Check } from 'lucide-react';
import { Table } from '../types';

interface ManageZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: string[];
  tables: Table[];
  onAddZone: (zoneName: string) => void;
  onRenameZone?: (oldName: string, newName: string) => void;
  onDeleteZone: (zoneName: string) => void;
}

export const ManageZonesModal: React.FC<ManageZonesModalProps> = ({
  isOpen,
  onClose,
  zones,
  tables,
  onAddZone,
  onRenameZone,
  onDeleteZone
}) => {
  const [newZoneName, setNewZoneName] = useState('');
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      setErrorMsg('Please enter a section/zone name');
      return;
    }
    const trimmed = newZoneName.trim();
    if (zones.some(z => z.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('This section already exists');
      return;
    }

    await onAddZone(trimmed);
    setNewZoneName('');
    setErrorMsg('');
  };

  const startEditing = (zoneName: string) => {
    setEditingZone(zoneName);
    setRenameValue(zoneName);
    setErrorMsg('');
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (trimmed !== oldName && zones.some(z => z.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A section with this name already exists');
      return;
    }

    if (onRenameZone && trimmed !== oldName) {
      onRenameZone(oldName, trimmed);
    }
    setEditingZone(null);
    setRenameValue('');
    setErrorMsg('');
  };

  const handleDelete = (zoneName: string) => {
    const countInZone = tables.filter(t => t.zone === zoneName).length;
    let confirmMessage = `Are you sure you want to delete the section "${zoneName}"?`;
    if (countInZone > 0) {
      confirmMessage += `\n\nNote: ${countInZone} table(s) currently in this section will be automatically re-assigned to the default section.`;
    }

    if (confirm(confirmMessage)) {
      onDeleteZone(zoneName);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage Restaurant Sections</h3>
              <p className="text-xs text-slate-400">Add custom zones or remove sections</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add New Section */}
        <form onSubmit={handleAdd} className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">Add New Custom Section</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Rooftop Garden, Wine Cellar..."
              value={newZoneName}
              onChange={(e) => {
                setNewZoneName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Section
            </button>
          </div>
          {errorMsg && <p className="text-[11px] text-rose-400 font-semibold">{errorMsg}</p>}
        </form>

        {/* List of Active Sections */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Current Sections ({zones.length})
          </label>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {zones.map((z) => {
              const count = tables.filter(t => t.zone === z).length;
              const isEditing = editingZone === z;

              return (
                <div
                  key={z}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between transition hover:border-slate-700"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 bg-slate-900 border border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(z)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg transition"
                        title="Save new section name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingZone(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          {z}
                          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'table' : 'tables'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {confirmDeleteZone === z ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteZone(z);
                                setConfirmDeleteZone(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2 py-1 rounded-md transition"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteZone(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-md transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(z)}
                              className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg transition"
                              title={`Modify section name "${z}"`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteZone(z)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition"
                              title={`Delete section "${z}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

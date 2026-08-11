import React from 'react';
import { Table } from '../types';
import { Sparkles, CheckCircle2, AlertCircle, Clock, X, Users, Utensils } from 'lucide-react';

interface AiSeatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  partySize: number;
  guestName?: string;
  recommendation: {
    recommendedTable: Table | null;
    reasoning: string;
    estimatedWaitMinutes: number;
    aiPowered: boolean;
  } | null;
  onConfirmSeat: (tableId: string) => void;
}

export const AiSeatingModal: React.FC<AiSeatingModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  partySize,
  guestName,
  recommendation,
  onConfirmSeat
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Gemini AI Smart Seating Assistant</h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Optimizing table turnover for {guestName || 'Walk-In Guest'} ({partySize} people)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-amber-300 font-semibold animate-pulse">
              Analyzing table capacities, zone preferences, and live dining timers...
            </p>
          </div>
        ) : recommendation ? (
          <div className="space-y-4">
            
            {/* Recommended Table Highlight */}
            {recommendation.recommendedTable ? (
              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                    Recommended Match
                  </span>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    Immediate Seating
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-white">
                      {recommendation.recommendedTable.number}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {recommendation.recommendedTable.name} • {recommendation.recommendedTable.zone}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Capacity</div>
                    <div className="text-lg font-bold text-amber-400 flex items-center justify-end gap-1">
                      <Users className="w-4 h-4" />
                      {recommendation.recommendedTable.capacity} Guests
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-2 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">No Immediate Table Available</h4>
                <p className="text-xs text-slate-400">
                  Estimated wait time until next table turns over: ~{recommendation.estimatedWaitMinutes} minutes.
                </p>
              </div>
            )}

            {/* AI Reasoning */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                AI Optimization Logic:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.reasoning}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white font-medium"
              >
                Close
              </button>

              {recommendation.recommendedTable && (
                <button
                  onClick={() => {
                    onConfirmSeat(recommendation.recommendedTable!.id);
                    onClose();
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Seat Guest at Table {recommendation.recommendedTable.number}
                </button>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};

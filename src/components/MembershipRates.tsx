import React, { useState } from 'react';
import { Rate } from '../types';
import { DollarSign, ShieldCheck, HelpCircle } from 'lucide-react';

interface MembershipRatesProps {
  rates: Rate[];
  onUpdateRate: (membership: 'VIP' | 'Gold' | 'Silver' | 'Regular', newRate: number) => void;
}

export function MembershipRates({ rates, onUpdateRate }: MembershipRatesProps) {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');

  const handleEditClick = (rateObj: Rate) => {
    setEditingTier(rateObj.membership);
    setTempRate(rateObj.ratePerHour.toString());
  };

  const handleSaveClick = () => {
    if (editingTier && tempRate) {
      const val = parseFloat(tempRate);
      if (!isNaN(val) && val >= 0) {
        onUpdateRate(editingTier as any, val);
        setEditingTier(null);
      }
    }
  };

  const tierColors = {
    VIP: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/10 shadow-[0_0_15px_rgba(99,102,241,0.08)]',
    Gold: 'text-amber-400 border-amber-500/25 bg-amber-950/5',
    Silver: 'text-slate-300 border-white/10 bg-slate-900/40',
    Regular: 'text-slate-400 border-white/5 bg-slate-900/20'
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          <strong>Rate Rules:</strong> Membership rates are configured per hour. When a user logs in to a client computer terminal, their countdown timers consume their account balance automatically relative to their tier hourly rate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rates.map((rate) => {
          const isEditing = editingTier === rate.membership;
          const config = tierColors[rate.membership as keyof typeof tierColors] || tierColors.Regular;

          return (
            <div
              key={rate.membership}
              className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 h-[190px] shadow-xl ${config}`}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest font-sans opacity-90">
                  {rate.membership} LEVEL
                </span>

                {isEditing ? (
                  <div className="mt-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      className="w-full bg-black/40 text-slate-200 border border-white/10 px-7 py-1.5 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold font-mono"
                    />
                  </div>
                ) : (
                  <h2 className="text-3xl font-black text-white mt-2.5 flex items-baseline font-mono tracking-tight">
                    <span>${rate.ratePerHour.toFixed(2)}</span>
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-extrabold ml-1.5">/ hr</span>
                  </h2>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setEditingTier(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold transition px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveClick}
                      className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95 shadow-md shadow-indigo-950/20"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditClick(rate)}
                    className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-4 py-1.5 rounded-xl border border-white/10 transition active:scale-95"
                  >
                    Adjust Rate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

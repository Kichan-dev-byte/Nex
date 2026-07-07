import React, { useState } from 'react';
import { Transaction } from '../types';
import { DollarSign, ArrowUpRight, ArrowDownRight, Award, Clock, FileText, Search } from 'lucide-react';

interface SalesReportViewProps {
  transactions: Transaction[];
}

export function SalesReportView({ transactions }: SalesReportViewProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const totalRevenue = transactions
    .filter(t => t.type === 'Top Up')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const usageDeductions = transactions
    .filter(t => t.type === 'Usage Deduction')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const refundDeductions = transactions
    .filter(t => t.type === 'Refund')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'All' || t.type === filterType;
    const matchesSearch = !searchQuery || 
      (t.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'Top Up':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">
            <ArrowUpRight className="w-3 h-3" />
            <span>TOP UP</span>
          </span>
        );
      case 'Usage Deduction':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            <span>USAGE</span>
          </span>
        );
      case 'Refund':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-wide">
            <ArrowDownRight className="w-3 h-3" />
            <span>REFUND</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 uppercase tracking-wide">
            <span>DEDUCTION</span>
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Top metrics bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="bg-emerald-500/10 p-3.5 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Total Top Up Revenue</span>
            <span className="text-2xl font-black text-white mt-0.5 block font-mono">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="bg-indigo-500/10 p-3.5 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Usage Deductions volume</span>
            <span className="text-2xl font-black text-white mt-0.5 block font-mono">${usageDeductions.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="bg-rose-500/10 p-3.5 border border-rose-500/20 rounded-xl text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Refund volume</span>
            <span className="text-2xl font-black text-white mt-0.5 block font-mono">${refundDeductions.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Transactions List View */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl">
        {/* Filters and search header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-extrabold text-white font-sans uppercase tracking-wider">SQLite Transaction Registry</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/40 text-slate-200 border border-white/5 pl-8.5 pr-4 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium w-full sm:w-48 font-sans"
              />
            </div>

            {/* Type selector */}
            <div className="flex border border-white/5 bg-black/40 rounded-xl p-1 shrink-0">
              {['All', 'Top Up', 'Usage Deduction', 'Refund'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-[9px] font-extrabold uppercase px-3 py-1 rounded-lg transition-all duration-200 ${
                    filterType === t
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'Usage Deduction' ? 'Usage' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Database table style */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-white/5 uppercase font-mono tracking-wider">
                <th className="py-2.5 font-bold">TxID</th>
                <th className="py-2.5 font-bold">Player</th>
                <th className="py-2.5 font-bold">Type</th>
                <th className="py-2.5 font-bold">Amount</th>
                <th className="py-2.5 font-bold">Timestamp</th>
                <th className="py-2.5 font-bold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-mono text-slate-500">{tx.id}</td>
                  <td className="py-3 text-white font-bold font-sans">{tx.username || 'Guest'}</td>
                  <td className="py-3">{getTxTypeBadge(tx.type)}</td>
                  <td className={`py-3 font-bold ${tx.type === 'Top Up' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {tx.type === 'Top Up' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-slate-400 font-sans">{formatDate(tx.timestamp)}</td>
                  <td className="py-3 text-slate-450 italic max-w-[150px] truncate font-sans">{tx.notes || '--'}</td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono uppercase tracking-widest text-[10px] font-bold">
                    No matching ledger entries in local storage
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

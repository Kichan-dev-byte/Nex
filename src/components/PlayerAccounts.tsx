import React, { useState } from 'react';
import { Player } from '../types';
import { Search, UserPlus, DollarSign, Calendar, Phone, Award, ShieldAlert } from 'lucide-react';

interface PlayerAccountsProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'status' | 'dateCreated'>) => void;
  onTopUp: (playerId: string, amount: number) => void;
}

export function PlayerAccounts({ players, onAddPlayer, onTopUp }: PlayerAccountsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [membership, setMembership] = useState<'VIP' | 'Gold' | 'Silver' | 'Regular'>('Regular');
  const [initialBalance, setInitialBalance] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');

  const filteredPlayers = players.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) return;

    onAddPlayer({
      username: username.trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || 'N/A',
      membership,
      balance: parseFloat(initialBalance) || 0,
      password: password.trim() || 'password'
    });

    // Reset fields
    setUsername('');
    setFullName('');
    setPassword('');
    setPhoneNumber('');
    setMembership('Regular');
    setInitialBalance('');
    setShowAddModal(false);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !topUpAmount) return;

    const amount = parseFloat(topUpAmount);
    if (amount > 0) {
      onTopUp(selectedPlayer.id, amount);
      setTopUpAmount('');
      setShowTopUpModal(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const styleMap = {
      VIP: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.1)]',
      Gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Silver: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
      Regular: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    };
    return <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${styleMap[tier as keyof typeof styleMap]}`}>{tier}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search players by username/name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 text-slate-200 border border-white/5 px-10 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-sans"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/40 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Player</span>
        </button>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
          >
            <div>
              {/* Profile header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/80 w-11 h-11 rounded-xl flex items-center justify-center border border-white/5 font-extrabold text-sm text-slate-300 uppercase select-none font-mono">
                    {player.username.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2 font-sans">
                      <span>{player.username}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-400/80">ID: {player.id}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{player.fullName}</p>
                  </div>
                </div>
                {getTierBadge(player.membership)}
              </div>

              {/* Quick Details */}
              <div className="grid grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-white/5 mb-4 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 block uppercase tracking-wide text-[9px] font-bold">Balance:</span>
                  <span className="text-base font-black text-emerald-400">${player.balance.toFixed(2)}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-slate-500 block uppercase tracking-wide text-[9px] font-bold">Phone Number:</span>
                  <span className="text-slate-300 flex items-center gap-1 justify-end font-sans">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{player.phoneNumber}</span>
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wide font-bold">Account Password:</span>
                  <span className="text-indigo-300 font-bold tracking-wider font-mono">{player.password || 'password'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center gap-2 pt-3.5 border-t border-white/5">
              <button
                onClick={() => {
                  setSelectedPlayer(player);
                  setShowTopUpModal(true);
                }}
                className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white py-1.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                <span>Top Up Balance</span>
              </button>
            </div>
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="col-span-full bg-slate-900/20 border border-white/5 border-dashed rounded-2xl py-12 px-6 text-center text-slate-500 flex flex-col items-center">
            <ShieldAlert className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <span className="text-sm font-semibold font-mono uppercase tracking-wider">No Player Accounts Found</span>
            <span className="text-xs mt-1">Register a player profile above to begin managing their balances.</span>
          </div>
        )}
      </div>

      {/* REGISTER PLAYER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl p-5 shadow-2xl glow-indigo">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Register Player</h3>
            <p className="text-xs text-slate-400 mb-5 font-sans">Create a durable player profile. Members benefit from reduced rates.</p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cyber_player"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0100"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Create Password</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. player_secure_123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Membership Tier</label>
                  <select
                    value={membership}
                    onChange={(e) => setMembership(e.target.value as any)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Initial Top Up ($)</label>
                  <input
                    type="number"
                    placeholder="10.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white px-4 py-2 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-indigo-950/25"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOP UP MODAL */}
      {showTopUpModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 w-full max-w-sm rounded-2xl p-5 shadow-2xl glow-indigo">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Top Up Balance</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">
              Add credit to <strong>{selectedPlayer.username}</strong>'s wallet account.
            </p>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="20.00"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-8 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="text-slate-400 hover:text-white px-4 py-2 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Confirm Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

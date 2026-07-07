import React, { useState, useEffect } from 'react';

// Custom typescript interface declarations
interface Player {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  membership: 'VIP' | 'Gold' | 'Silver' | 'Regular';
  balance: number;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  password?: string;
}

interface PcSession {
  pcNumber: number;
  status: 'Locked' | 'Active';
  currentUser?: string;
  userType?: 'Player' | 'Guest';
  timeRemaining: number;
  elapsedSeconds: number;
  ratePerHour: number;
}

interface Transaction {
  id: string;
  username: string;
  type: string;
  amount: number;
  timestamp: string;
  notes: string;
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<{ [pcNum: number]: PcSession }>({});
  
  // Registration Form states
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMembership, setRegMembership] = useState<'VIP' | 'Gold' | 'Silver' | 'Regular'>('Regular');
  const [regBalance, setRegBalance] = useState('10.00');

  // Top Up Dialog states
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [topupAmount, setTopupAmount] = useState('20.00');
  const [topupNotes, setTopupNotes] = useState('Top-up at desk');

  // Custom alert / notification message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Safe IPC Fetch with automated fallbacks for the web preview/dev mode
  useEffect(() => {
    const isElectron = !!(window as any).electronAPI;

    const loadData = async () => {
      if (isElectron) {
        try {
          const api = (window as any).electronAPI;
          const plist = await api.getPlayers();
          const tlist = await api.getTransactions();
          const slist = await api.getPcSessions();
          setPlayers(plist || []);
          setTransactions(tlist || []);
          setSessions(slist || {});
          return;
        } catch (err) {
          console.warn("Electron API failed, loading mock fallback storage", err);
        }
      }

      // Web Fallback Data
      const cachedPlayers = localStorage.getItem('computershop_players');
      const cachedTransactions = localStorage.getItem('computershop_transactions');
      
      const defaultPlayers: Player[] = [
        { id: 'P001', username: 'cyber_elite', fullName: 'Alex Rivera', phoneNumber: '+1 555-0199', membership: 'VIP', balance: 150.00, status: 'Active', password: 'password', dateCreated: '2026-05-15T14:30:00Z' },
        { id: 'P002', username: 'shadow_ryder', fullName: 'John Doe', phoneNumber: '+1 555-0100', membership: 'Regular', balance: 15.00, status: 'Active', password: 'password', dateCreated: '2026-06-01T09:15:00Z' }
      ];

      const defaultSessions: { [pcNum: number]: PcSession } = {};
      for (let i = 1; i <= 12; i++) {
        defaultSessions[i] = {
          pcNumber: i,
          status: i === 3 ? 'Active' : 'Locked',
          currentUser: i === 3 ? 'cyber_elite' : undefined,
          userType: i === 3 ? 'Player' : undefined,
          timeRemaining: i === 3 ? 21600 : 0,
          elapsedSeconds: i === 3 ? 1200 : 0,
          ratePerHour: i === 3 ? 25.0 : 10.0
        };
      }

      if (cachedPlayers) {
        setPlayers(JSON.parse(cachedPlayers));
      } else {
        setPlayers(defaultPlayers);
        localStorage.setItem('computershop_players', JSON.stringify(defaultPlayers));
      }

      if (cachedTransactions) {
        setTransactions(JSON.parse(cachedTransactions));
      } else {
        const defaultTx = [
          { id: 'TX001', username: 'cyber_elite', type: 'Top Up', amount: 50.0, timestamp: '2026-07-06T18:30:00Z', notes: 'Top-up desk' }
        ];
        setTransactions(defaultTx);
        localStorage.setItem('computershop_transactions', JSON.stringify(defaultTx));
      }

      setSessions(defaultSessions);
    };

    loadData();

    // Setup an interval to periodically update PC session grids
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle new player registration
  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regFullName.trim() || !regPassword.trim()) {
      triggerNotification('Please fill in all required fields.', 'error');
      return;
    }

    // Check unique username
    if (players.some(p => p.username.toLowerCase() === regUsername.trim().toLowerCase())) {
      triggerNotification('Username already exists in system.', 'error');
      return;
    }

    const newPlayer: Player = {
      id: 'P' + String(players.length + 1).padStart(3, '0'),
      username: regUsername.trim().toLowerCase(),
      fullName: regFullName.trim(),
      phoneNumber: regPhone.trim() || 'N/A',
      membership: regMembership,
      balance: parseFloat(regBalance) || 0,
      status: 'Active',
      password: regPassword.trim(),
      dateCreated: new Date().toISOString()
    };

    const isElectron = !!(window as any).electronAPI;
    if (isElectron) {
      try {
        await (window as any).electronAPI.addPlayer(newPlayer);
        // Also record a transaction for initial deposit if > 0
        if (newPlayer.balance > 0) {
          await (window as any).electronAPI.topupPlayer({
            username: newPlayer.username,
            amount: newPlayer.balance,
            txId: 'TX' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            notes: 'Initial account activation top-up'
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Always update local states for seamless display
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    localStorage.setItem('computershop_players', JSON.stringify(updatedPlayers));

    if (newPlayer.balance > 0) {
      const newTx: Transaction = {
        id: 'TX' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        username: newPlayer.username,
        type: 'Top Up',
        amount: newPlayer.balance,
        timestamp: new Date().toISOString(),
        notes: 'Initial activation top-up'
      };
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem('computershop_transactions', JSON.stringify(updatedTx));
    }

    triggerNotification(`Account registered successfully for ${newPlayer.username}!`);
    setRegUsername('');
    setRegFullName('');
    setRegPhone('');
    setRegPassword('');
    setRegMembership('Regular');
    setRegBalance('10.00');
  };

  // Handle Cashier Top up trigger
  const handleTopUp = async () => {
    if (!selectedPlayer) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerNotification('Invalid transaction amount.', 'error');
      return;
    }

    const txId = 'TX' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const isElectron = !!(window as any).electronAPI;

    if (isElectron) {
      try {
        await (window as any).electronAPI.topupPlayer({
          username: selectedPlayer.username,
          amount,
          txId,
          notes: topupNotes
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Local / fallback update
    const updatedPlayers = players.map(p => {
      if (p.username === selectedPlayer.username) {
        return { ...p, balance: p.balance + amount };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    localStorage.setItem('computershop_players', JSON.stringify(updatedPlayers));

    const newTx: Transaction = {
      id: txId,
      username: selectedPlayer.username,
      type: 'Top Up',
      amount,
      timestamp: new Date().toISOString(),
      notes: topupNotes
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    localStorage.setItem('computershop_transactions', JSON.stringify(updatedTx));

    triggerNotification(`Successfully topped up $${amount.toFixed(2)} to ${selectedPlayer.username}!`);
    setSelectedPlayer(null);
  };

  // Remote PC Commands
  const handleRemoteLock = async (pcNum: number) => {
    const isElectron = !!(window as any).electronAPI;
    if (isElectron) {
      try {
        await (window as any).electronAPI.remoteLockPc(pcNum);
      } catch (err) {
        console.error(err);
      }
    }

    setSessions(prev => ({
      ...prev,
      [pcNum]: {
        ...prev[pcNum],
        status: 'Locked',
        currentUser: undefined,
        userType: undefined,
        timeRemaining: 0,
        elapsedSeconds: 0
      }
    }));
    triggerNotification(`Sent LOCK command to PC #${pcNum}`);
  };

  const handleRemoteUnlock = async (pcNum: number, userType: 'Player' = 'Player') => {
    const isElectron = !!(window as any).electronAPI;
    const username = 'remote_user';
    
    if (isElectron) {
      try {
        await (window as any).electronAPI.remoteUnlockPc({
          pcNumber: pcNum,
          username,
          userType: 'Player'
        });
      } catch (err) {
        console.error(err);
      }
    }

    setSessions(prev => ({
      ...prev,
      [pcNum]: {
        ...prev[pcNum],
        status: 'Active',
        currentUser: username,
        userType: 'Player',
        timeRemaining: 7200, // Default 2 hours
        elapsedSeconds: 0
      }
    }));
    triggerNotification(`Sent REMOTE UNLOCK (Player) to PC #${pcNum}`);
  };

  // Utility to format seconds to clock layout HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Toast notifications */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 animate-slide-up ${
          notification.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${notification.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">{notification.text}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            🖥️
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-white uppercase">LAN Control Center</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Computer Shop Server v1.0.0</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center font-mono text-[11px]">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wide">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Server Online : Port 8080</span>
          </div>
          <div className="bg-slate-800/40 border border-white/5 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span>Members Registered:</span>
            <span className="text-white font-extrabold">{players.length}</span>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        {/* Left 2 Columns: Client Computers & Transactions */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section: Live PC Nodes */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Live LAN PCs</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">Real-time status monitor of terminal clients</p>
              </div>
              <div className="flex gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">ACTIVE</span>
                <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-white/5">LOCKED</span>
              </div>
            </div>

            {/* PC Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(Object.values(sessions) as PcSession[]).length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                  Loading Terminal States...
                </div>
              ) : (
                (Object.values(sessions) as PcSession[]).map((pc) => {
                  const isActive = pc.status === 'Active';
                  return (
                    <div
                      key={pc.pcNumber}
                      className={`relative border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.05)]'
                          : 'bg-slate-900/10 border-white/5 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div>
                        {/* PC Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase font-mono tracking-wider">PC #{pc.pcNumber}</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {pc.status}
                          </span>
                        </div>

                        {/* PC Main User Body */}
                        <div className="my-2 min-h-[42px]">
                          {isActive ? (
                            <>
                              <span className="text-xs font-bold text-white block truncate">{pc.currentUser}</span>
                              <span className="text-[9px] text-indigo-300 font-mono block tracking-wide uppercase mt-0.5">{pc.userType}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 italic block mt-1">Terminal Locked</span>
                          )}
                        </div>
                      </div>

                      {/* PC Footer with Power Controls & Timer */}
                      <div className="mt-2 pt-2.5 border-t border-white/5 space-y-2">
                        {isActive ? (
                          <>
                            <div className="text-[10px] font-mono font-bold text-slate-400 flex justify-between">
                              <span>TIME REMAINING:</span>
                              <span className="text-emerald-400">{formatTime(pc.timeRemaining)}</span>
                            </div>
                            <button
                              onClick={() => handleRemoteLock(pc.pcNumber)}
                              className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[9px] font-extrabold uppercase py-1 rounded-lg transition-colors font-mono"
                            >
                              Lock Terminal
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleRemoteUnlock(pc.pcNumber, 'Player')}
                              className="w-full bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-[8px] font-extrabold uppercase py-1 rounded-lg transition-colors"
                            >
                              Unlock PC
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Real-time Transaction Ledger */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">Live Transaction Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5 uppercase font-mono tracking-wider">
                    <th className="py-2.5 font-bold">TxID</th>
                    <th className="py-2.5 font-bold">Customer</th>
                    <th className="py-2.5 font-bold">Type</th>
                    <th className="py-2.5 font-bold">Amount</th>
                    <th className="py-2.5 font-bold">Notes</th>
                    <th className="py-2.5 font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-mono uppercase tracking-widest text-[10px]">
                        No financial actions logged yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                        <td className="py-3 text-slate-500">{tx.id}</td>
                        <td className="py-3 text-white font-bold">{tx.username}</td>
                        <td className="py-3">
                          <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 text-emerald-400 font-bold">+${tx.amount.toFixed(2)}</td>
                        <td className="py-3 text-slate-400 italic max-w-[150px] truncate">{tx.notes}</td>
                        <td className="py-3 text-slate-500 text-[10px]">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Register Customer & Balance Top-up Console */}
        <div className="space-y-6">
          {/* Module 1: Customer Wallet Top-up Panel */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1">Cashier Desk: Desk Top-Up</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mb-4">Add credit securely to user profiles</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Customer Profile</label>
                <select
                  value={selectedPlayer?.username || ''}
                  onChange={(e) => {
                    const p = players.find(p => p.username === e.target.value);
                    setSelectedPlayer(p || null);
                  }}
                  className="w-full bg-black/40 text-slate-200 border border-white/10 px-3 py-2 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Choose Account --</option>
                  {players.map(p => (
                    <option key={p.id} value={p.username}>
                      {p.username} (${p.balance.toFixed(2)} - {p.membership})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Balance:</span>
                    <span className="text-white font-bold font-mono">${selectedPlayer.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Membership Tier:</span>
                    <span className="text-indigo-300 font-bold uppercase">{selectedPlayer.membership}</span>
                  </div>

                  <div className="pt-2 border-t border-indigo-500/10 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Deposit Amount ($)</label>
                      <input
                        type="number"
                        placeholder="20.00"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 text-white font-mono px-2 py-1 rounded text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Transaction Notes</label>
                      <input
                        type="text"
                        value={topupNotes}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Desk Top-up"
                        className="w-full bg-black/60 border border-white/10 text-white px-2 py-1 rounded text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTopUp}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase py-2 rounded-xl text-[10px] transition-all tracking-wider mt-2 shadow-lg shadow-indigo-500/20"
                  >
                    Authorize Top-Up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Module 2: Fast Register Account Form */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1">Register New LAN Profile</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mb-4">Create dynamic credentials for cafe players</p>

            <form onSubmit={handleRegisterPlayer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cyber_warrior"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Sterling"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-2234"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Membership</label>
                  <select
                    value={regMembership}
                    onChange={(e: any) => setRegMembership(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                  >
                    <option value="VIP">VIP ($25/hr)</option>
                    <option value="Gold">Gold ($20/hr)</option>
                    <option value="Silver">Silver ($15/hr)</option>
                    <option value="Regular">Regular ($10/hr)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Deposit ($)</label>
                  <input
                    type="number"
                    value={regBalance}
                    onChange={(e) => setRegBalance(e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-white/10 px-3 py-1.5 rounded-xl text-xs outline-none text-right font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase py-2.5 rounded-xl text-[10px] tracking-wider transition-all mt-2 shadow-lg shadow-indigo-500/25"
              >
                Register Profile
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

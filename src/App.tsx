import React, { useState, useEffect } from 'react';
import { SQLiteSimulator } from './db';
import { Computer, Player, Rate, ShopSettings } from './types';
import { ProjectFilesExplorer } from './components/ProjectFilesExplorer';
import { ClientSimulator } from './components/ClientSimulator';
import { CashierDashboard } from './components/CashierDashboard';
import { PlayerAccounts } from './components/PlayerAccounts';
import { MembershipRates } from './components/MembershipRates';
import { SalesReportView } from './components/SalesReportView';
import { Monitor, Users, DollarSign, Settings, FolderOpen, Terminal, Shield, Wifi, Bell, AlertCircle, Play, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cashier' | 'client' | 'files'>('cashier');
  const [cashierSubTab, setCashierSubTab] = useState<'dashboard' | 'players' | 'rates' | 'sales' | 'settings'>('dashboard');
  
  // Simulated SQLite state loaders
  const [computers, setComputers] = useState<Computer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState<ShopSettings>({
    serverPort: 8080,
    currency: 'USD',
    shopName: 'Nexus Cyber Arena',
    autoLockOnExpiry: true
  });

  // Client states
  const [activePcNumber, setActivePcNumber] = useState<number>(1);
  const [clientPopups, setClientPopups] = useState<{ [pcNum: number]: string }>({});
  const [announcements, setAnnouncements] = useState<string[]>(['Welcome to Nexus Cyber Arena! Enjoy 2x XP weekends for members.']);

  // Admin announcement input
  const [announcementInput, setAnnouncementInput] = useState('');

  // Initial Load from local SQLite-style Storage
  useEffect(() => {
    setComputers(SQLiteSimulator.getComputers());
    setPlayers(SQLiteSimulator.getPlayers());
    setRates(SQLiteSimulator.getRates());
    setTransactions(SQLiteSimulator.getTransactions() as any);
    setSettings(SQLiteSimulator.getSettings());
  }, []);

  // Sync state helpers
  const saveComputersState = (updated: Computer[]) => {
    setComputers(updated);
    SQLiteSimulator.saveComputers(updated);
  };

  const savePlayersState = (updated: Player[]) => {
    setPlayers(updated);
    SQLiteSimulator.savePlayers(updated);
  };

  const saveRatesState = (updated: Rate[]) => {
    setRates(updated);
    SQLiteSimulator.saveRates(updated);
  };

  // Live Timer Countdown Clock (Ticks every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      let changed = false;
      const updatedComputers = computers.map((pc) => {
        if (pc.status === 'In Use' && pc.remainingTime > 0) {
          changed = true;
          const nextTime = pc.remainingTime - 1;

          // Check for automatic lock when time expires
          if (nextTime <= 0) {
            // Deduct rate from player balance (simulated postpaid session complete or prepaid depletion)
            if (pc.playerId) {
              const matchingPlayer = players.find(p => p.id === pc.playerId);
              if (matchingPlayer) {
                const consumedHrs = 1; // mock deduct hour or just clean session
                const cost = pc.currentRate;
                const newBalance = Math.max(0, matchingPlayer.balance - cost);
                
                // Update players list
                const updatedPlayers = players.map(p => 
                  p.id === matchingPlayer.id ? { ...p, balance: newBalance } : p
                );
                savePlayersState(updatedPlayers);

                // Add ledger entry
                SQLiteSimulator.addTransaction({
                  playerId: matchingPlayer.id,
                  username: matchingPlayer.username,
                  type: 'Usage Deduction',
                  amount: cost,
                  computerNumber: pc.number,
                  notes: `Auto Lock Out - PC-${pc.number.toString().padStart(2, '0')}`
                });
                setTransactions(SQLiteSimulator.getTransactions() as any);
              }
            }

            return {
              ...pc,
              status: 'Locked' as const,
              remainingTime: 0,
              playerName: undefined,
              playerId: undefined,
              playerMembership: undefined
            };
          }

          return { ...pc, remainingTime: nextTime };
        }
        return pc;
      });

      if (changed) {
        saveComputersState(updatedComputers);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [computers, players]);

  // Handle Client Login requested by Lock Screen
  const handleClientLogin = (pcNum: number, username: string, type: 'Player' | 'Guest', password?: string): string | null => {
    const pcIdx = computers.findIndex(c => c.number === pcNum);
    if (pcIdx === -1) return 'Computer not found.';

    const pc = computers[pcIdx];
    if (pc.status === 'In Use') return 'PC is currently in use.';

    if (type === 'Guest') {
      const updated = [...computers];
      updated[pcIdx] = {
        ...pc,
        status: 'In Use',
        playerName: 'Guest Mode',
        remainingTime: 3600, // 1 hour for guests
        balance: 0,
        currentRate: rates.find(r => r.membership === 'Regular')?.ratePerHour || 15.00
      };
      saveComputersState(updated);
      
      SQLiteSimulator.addTransaction({
        type: 'Usage Deduction',
        amount: 15.00,
        computerNumber: pcNum,
        notes: `Guest session started PC-${pcNum}`
      });
      setTransactions(SQLiteSimulator.getTransactions() as any);
      return null;
    }

    // Player profile mode
    const player = players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (!player) return 'Member profile not found. Please contact cashier.';

    const expectedPassword = player.password || 'password';
    if (password !== expectedPassword) {
      return 'Incorrect password. Please try again or contact the cashier to reset.';
    }

    const tierRate = rates.find(r => r.membership === player.membership)?.ratePerHour || 15.00;
    if (player.balance < tierRate) {
      return 'Insufficient wallet balance. Please top-up at the cashier desk.';
    }

    // Calculate duration based on balance
    const allowedHrs = player.balance / tierRate;
    const sessionSeconds = Math.min(10800, Math.floor(allowedHrs * 3600)); // cap at 3 hours max session time

    const updated = [...computers];
    updated[pcIdx] = {
      ...pc,
      status: 'In Use',
      playerId: player.id,
      playerName: player.fullName,
      playerMembership: player.membership,
      remainingTime: sessionSeconds,
      balance: player.balance,
      currentRate: tierRate
    };
    saveComputersState(updated);

    return null;
  };

  // Handle Logout by Client PC
  const handleClientLogout = (pcNum: number) => {
    const pcIdx = computers.findIndex(c => c.number === pcNum);
    if (pcIdx === -1) return;

    const pc = computers[pcIdx];
    if (pc.playerId) {
      // Deduct final spent session amount
      const matchingPlayer = players.find(p => p.id === pc.playerId);
      if (matchingPlayer) {
        const spentTimeSecs = 3600; // default spent session hr logic
        const cost = pc.currentRate;
        const newBalance = Math.max(0, matchingPlayer.balance - cost);

        const updatedPlayers = players.map(p => 
          p.id === matchingPlayer.id ? { ...p, balance: newBalance } : p
        );
        savePlayersState(updatedPlayers);

        SQLiteSimulator.addTransaction({
          playerId: matchingPlayer.id,
          username: matchingPlayer.username,
          type: 'Usage Deduction',
          amount: cost,
          computerNumber: pcNum,
          notes: `Member logout. PC-${pcNum}`
        });
        setTransactions(SQLiteSimulator.getTransactions() as any);
      }
    }

    const updated = [...computers];
    updated[pcIdx] = {
      ...pc,
      status: 'Available',
      remainingTime: 0,
      playerName: undefined,
      playerId: undefined,
      playerMembership: undefined
    };
    saveComputersState(updated);
  };

  // Simulated client heartbeat tracker
  const handleClientSendHeartbeat = (pcNum: number) => {
    const updated = computers.map(c => 
      c.number === pcNum ? { ...c, lastHeartbeat: Date.now() } : c
    );
    // Don't write to localstorage on every 4 second heartbeat to avoid high Disk IO, update state directly.
    setComputers(updated);
  };

  // Handle remote cashier action commands
  const handleRemoteCommand = (command: string, pcNum: number, payload?: any) => {
    const pcIdx = computers.findIndex(c => c.number === pcNum);
    if (pcIdx === -1) return;

    const pc = computers[pcIdx];
    const updated = [...computers];

    switch (command) {
      case 'add_time':
        const minutes = payload?.minutes || 30;
        if (pc.status === 'In Use') {
          updated[pcIdx] = {
            ...pc,
            remainingTime: pc.remainingTime + (minutes * 60)
          };
        } else {
          // Unlocking and starting direct session
          updated[pcIdx] = {
            ...pc,
            status: 'In Use',
            playerName: 'Cashier prepaid',
            remainingTime: minutes * 60,
            currentRate: rates.find(r => r.membership === 'Regular')?.ratePerHour || 15.00
          };
        }
        saveComputersState(updated);
        break;

      case 'pause_timer':
        // simulate pausing countdown
        break;

      case 'stop_timer':
        handleClientLogout(pcNum);
        break;

      case 'send_popup':
        setClientPopups(prev => ({
          ...prev,
          [pcNum]: payload?.message || 'Hello from the Cashier Desk!'
        }));
        break;

      case 'shutdown_pc':
        updated[pcIdx] = {
          ...pc,
          status: 'Offline',
          remainingTime: 0,
          playerName: undefined,
          playerId: undefined
        };
        saveComputersState(updated);
        break;

      case 'restart_terminal':
        updated[pcIdx] = {
          ...pc,
          status: 'Available',
          lastHeartbeat: Date.now()
        };
        saveComputersState(updated);
        break;

      default:
        break;
    }
  };

  // Handle player registration
  const handleAddPlayer = (newPlayer: Omit<Player, 'id' | 'status' | 'dateCreated'>) => {
    const updatedPlayers = [...players];
    const playerRecord: Player = {
      ...newPlayer,
      id: `P${(updatedPlayers.length + 1).toString().padStart(3, '0')}`,
      status: 'Active',
      dateCreated: new Date().toISOString()
    };
    updatedPlayers.unshift(playerRecord);
    savePlayersState(updatedPlayers);

    if (newPlayer.balance > 0) {
      SQLiteSimulator.addTransaction({
        playerId: playerRecord.id,
        username: playerRecord.username,
        type: 'Top Up',
        amount: newPlayer.balance,
        notes: 'Initial deposit on signup'
      });
      setTransactions(SQLiteSimulator.getTransactions() as any);
    }
  };

  // Handle top ups
  const handleTopUp = (playerId: string, amount: number) => {
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        const nextBalance = p.balance + amount;
        SQLiteSimulator.addTransaction({
          playerId: p.id,
          username: p.username,
          type: 'Top Up',
          amount: amount,
          notes: 'Cash Desk Top Up'
        });
        return { ...p, balance: nextBalance };
      }
      return p;
    });

    savePlayersState(updatedPlayers);
    setTransactions(SQLiteSimulator.getTransactions() as any);
  };

  // Update specific hourly rate tier
  const handleUpdateRate = (membership: 'VIP' | 'Gold' | 'Silver' | 'Regular', newRate: number) => {
    const updatedRates = rates.map(r => 
      r.membership === membership ? { ...r, ratePerHour: newRate } : r
    );
    saveRatesState(updatedRates);
  };

  // Broadcast announcement
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    setAnnouncements(prev => [...prev, announcementInput.trim()]);
    setAnnouncementInput('');
  };

  return (
    <div className="min-h-screen bg-[#050507] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-slate-950 to-[#050507] text-[#e2e2e7] flex flex-col font-sans select-none antialiased">
      {/* Interactive Hub Navigation Header */}
      <header className="bg-slate-900/40 border-b border-white/5 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-950/40 border border-indigo-500/30">
            <Terminal className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent uppercase font-sans">
              NEXUS LAN CONTROLLER
            </h1>
            <p className="text-[9px] text-indigo-400/80 font-mono tracking-widest font-semibold uppercase">STABLE V1.0.0 // SECURE SQLITE ENGINE</p>
          </div>
        </div>

        {/* Hub Tabs selector */}
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 backdrop-blur-md">
          {[
            { id: 'cashier', label: 'Cashier Terminal', icon: Users },
            { id: 'client', label: 'Client PC Terminal', icon: Monitor },
            { id: 'files', label: 'System Configuration', icon: FolderOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-blue-600/30 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Sandbox Layout Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'cashier' && (
            <motion.div
              key="cashier"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Cashier Sub-navigation */}
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
                {[
                  { id: 'dashboard', label: 'Computer Grid', icon: Monitor },
                  { id: 'players', label: 'Player Directory', icon: Users },
                  { id: 'rates', label: 'Hourly Pricing Rates', icon: DollarSign },
                  { id: 'sales', label: 'SQLite Sales Ledger', icon: DollarSign },
                  { id: 'settings', label: 'Server Options', icon: Settings }
                ].map((sub) => {
                  const Icon = sub.icon;
                  const isActive = cashierSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setCashierSubTab(sub.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.1)]'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-tab Views */}
              {cashierSubTab === 'dashboard' && (
                <CashierDashboard
                  computers={computers}
                  onRemoteCommand={handleRemoteCommand}
                  players={players}
                />
              )}

              {cashierSubTab === 'players' && (
                <PlayerAccounts
                  players={players}
                  onAddPlayer={handleAddPlayer}
                  onTopUp={handleTopUp}
                />
              )}

              {cashierSubTab === 'rates' && (
                <MembershipRates
                  rates={rates}
                  onUpdateRate={handleUpdateRate}
                />
              )}

              {cashierSubTab === 'sales' && (
                <SalesReportView
                  transactions={transactions}
                />
              )}

              {cashierSubTab === 'settings' && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 max-w-xl shadow-xl glow-indigo">
                  <h3 className="text-base font-bold text-white mb-1 font-sans">LAN Broadcaster & Server Configurations</h3>
                  <p className="text-xs text-slate-400 mb-5">Configure system thresholds for network sockets.</p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Server listening port</label>
                        <input
                          type="number"
                          value={settings.serverPort}
                          onChange={(e) => setSettings({ ...settings, serverPort: parseInt(e.target.value) || 3000 })}
                          className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Shop Display Name</label>
                        <input
                          type="text"
                          value={settings.shopName}
                          onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                          className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleBroadcastAnnouncement} className="space-y-2.5 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold text-slate-300">Broadcast Shop Announcement</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type an announcement for all client screens..."
                          value={announcementInput}
                          onChange={(e) => setAnnouncementInput(e.target.value)}
                          className="bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm flex-1 font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-md shadow-indigo-950/50"
                        >
                          Broadcast
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'client' && (
            <motion.div
              key="client"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ClientSimulator
                computers={computers}
                players={players}
                activePcNumber={activePcNumber}
                setActivePcNumber={setActivePcNumber}
                onClientLogin={handleClientLogin}
                onClientLogout={handleClientLogout}
                onClientSendHeartbeat={handleClientSendHeartbeat}
                popups={clientPopups}
                clearPopup={(pcNum) => setClientPopups(prev => {
                  const next = { ...prev };
                  delete next[pcNum];
                  return next;
                })}
                announcements={announcements}
              />
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ProjectFilesExplorer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Status Bar */}
      <footer className="bg-slate-900/60 border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-slate-500 font-mono backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>SOCKET SERVICE: ONLINE (PORT: {settings.serverPort})</span>
          </span>
          <span className="hidden sm:inline text-slate-600">//</span>
          <span className="hidden sm:inline">SQLITE LEADER: ACTIVE</span>
        </div>
        <span>© NEXUS ARENA CONTROLLER SYSTEMS INC.</span>
      </footer>
    </div>
  );
}

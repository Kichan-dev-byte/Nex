import React, { useState, useEffect } from 'react';
import { Computer, Player } from '../types';
import { Monitor, Lock, Unlock, LogOut, Clock, User, DollarSign, Bell, Send, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientSimulatorProps {
  computers: Computer[];
  players: Player[];
  activePcNumber: number;
  setActivePcNumber: (num: number) => void;
  onClientLogin: (pcNum: number, username: string, type: 'Player' | 'Guest', password?: string) => string | null;
  onClientLogout: (pcNum: number) => void;
  onClientSendHeartbeat: (pcNum: number) => void;
  popups: { [pcNum: number]: string };
  clearPopup: (pcNum: number) => void;
  announcements: string[];
}

export function ClientSimulator({
  computers,
  players,
  activePcNumber,
  setActivePcNumber,
  onClientLogin,
  onClientLogout,
  onClientSendHeartbeat,
  popups,
  clearPopup,
  announcements
}: ClientSimulatorProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  const activePc = computers.find(c => c.number === activePcNumber) || computers[0];

  // Send heartbeat periodically to server
  useEffect(() => {
    if (isSimulatedOffline) return;
    const interval = setInterval(() => {
      onClientSendHeartbeat(activePc.number);
    }, 4000);
    return () => clearInterval(interval);
  }, [activePc.number, isSimulatedOffline, onClientSendHeartbeat]);

  const handlePlayerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput.trim()) {
      setLoginError('Username is required.');
      return;
    }
    const error = onClientLogin(activePc.number, usernameInput.trim(), 'Player', passwordInput);
    if (error) {
      setLoginError(error);
    } else {
      setUsernameInput('');
      setPasswordInput('');
    }
  };

  const handleGuestLoginSubmit = () => {
    setLoginError('');
    const error = onClientLogin(activePc.number, 'Guest User', 'Guest');
    if (error) {
      setLoginError(error);
    }
  };

  const formatTime = (secs: number) => {
    if (secs <= 0) return '00:00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      remainingSecs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px]">
      {/* PC Selection Panel */}
      <div className="xl:w-64 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shrink-0 flex flex-col shadow-xl">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-sans">
          Simulated PC Terminals
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
          Select a client PC to view and control its fullscreen client application.
        </p>

        <div className="grid grid-cols-2 xl:grid-cols-1 gap-2 flex-1 overflow-y-auto pr-1">
          {computers.map((pc) => {
            const isSelected = pc.number === activePcNumber;
            const statusColors = {
              Available: 'bg-emerald-500',
              'In Use': 'bg-indigo-500',
              Locked: 'bg-amber-500',
              Offline: 'bg-rose-500'
            };

            return (
              <button
                key={pc.number}
                onClick={() => setActivePcNumber(pc.number)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                    : 'bg-black/30 border-white/5 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold font-sans">{pc.name}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${statusColors[pc.status]}`} />
              </button>
            );
          })}
        </div>

        {/* Network connection controls */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-sans">
            <Wifi className={`w-3.5 h-3.5 ${isSimulatedOffline ? 'text-rose-500' : 'text-emerald-400'}`} />
            <span>Connection status</span>
          </span>
          <button
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all duration-200 ${
              isSimulatedOffline
                ? 'bg-rose-950/30 border-rose-800 text-rose-400 hover:bg-rose-900/40'
                : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSimulatedOffline ? 'Connect' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Screen Workspace */}
      <div className="flex-1 bg-slate-950 rounded-2xl border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        {/* Physical Monitor Bezel / Status Bar */}
        <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span className="text-slate-300 font-bold">{activePc.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>IP: {activePc.ipAddress}</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulatedOffline ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{isSimulatedOffline ? 'Offline' : 'Connected'}</span>
            </span>
          </div>
        </div>

        {/* Live Client View */}
        <div className="flex-1 flex flex-col justify-between p-6 relative bg-gradient-to-b from-[#09090e] to-[#040406]">
          
          {/* OFFLINE COVER */}
          {isSimulatedOffline && (
            <div className="absolute inset-0 bg-[#050507]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
              <h2 className="text-lg font-black text-white mb-2 uppercase tracking-wide font-sans">Network Connection Offline</h2>
              <p className="text-xs text-slate-400 max-w-sm mb-6 font-sans">
                Unable to reach the shop cashier server. Reconnecting automatically...
              </p>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 animate-[pulse_1.5s_infinite] w-1/2 rounded-full" />
              </div>
            </div>
          )}

          {/* ANNOUNCEMENT BANNER */}
          {announcements.length > 0 && (
            <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 py-2 px-4 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse z-20 font-sans">
              <Bell className="w-4 h-4 shrink-0 text-indigo-400" />
              <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis uppercase tracking-wide">
                <strong>SHOP ANNOUNCEMENT:</strong> {announcements[announcements.length - 1]}
              </div>
            </div>
          )}

          {/* ACTIVE STATE vs LOCK SCREEN */}
          {activePc.status === 'In Use' ? (
            /* ACTIVE PC VIEW */
            <div className="flex-1 flex flex-col justify-between">
              {/* Header Details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Session User</h4>
                    <p className="text-base font-extrabold text-white font-sans">{activePc.playerName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right">
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Membership Tier</h4>
                    <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-white/5 uppercase">
                      {activePc.playerMembership || 'Regular'}
                    </span>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hourly Rate</h4>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      ${activePc.currentRate.toFixed(2)}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Central Time Widget */}
              <div className="flex flex-col items-center justify-center py-8">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Time Remaining</span>
                </span>
                <h1 className="text-5xl md:text-6xl font-black font-mono text-white tracking-widest text-shadow">
                  {formatTime(activePc.remainingTime)}
                </h1>
                
                {/* Visual meter bar */}
                <div className="w-full max-w-sm h-1.5 bg-black/40 rounded-full mt-6 overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${Math.min(100, (activePc.remainingTime / 7200) * 100)}%` }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Bottom control bar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-black/40 py-1.5 px-3 rounded-lg border border-white/5 font-mono">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Available Balance: <strong className="text-white font-bold">${activePc.balance.toFixed(2)}</strong></span>
                </div>
                <button
                  onClick={() => onClientLogout(activePc.number)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 py-2 px-4 rounded-xl shadow-lg shadow-rose-950/20 active:scale-95 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            </div>
          ) : (
            /* LOCK SCREEN (Available / Locked) */
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center w-full">
              <div className="bg-[#0c0c14]/60 border border-white/5 rounded-2xl p-6 w-full shadow-2xl relative z-10 backdrop-blur-md glow-indigo">
                
                {/* Shop Logo Header */}
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-indigo-600/20 p-3.5 rounded-full border border-indigo-500/20 mb-3">
                    <Lock className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-sans">
                    NEXUS CYBER ARENA
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide font-sans">Please login or contact the cashier desk.</p>
                </div>

                {/* Login tabs */}
                <form onSubmit={handlePlayerLoginSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Player Username"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-black/40 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-black/40 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  {loginError && (
                    <div className="text-xs text-rose-400 font-semibold bg-rose-950/15 border border-rose-900/30 rounded-lg p-2 text-left">
                      {loginError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-950/20 active:scale-95"
                    >
                      Login Account
                    </button>
                  </div>
                </form>

                <div className="mt-5 pt-4 border-t border-white/5 text-xs text-slate-400 font-sans">
                  Registered members get up to 50% discount on rates.
                </div>
              </div>

              {/* Status footer for Lock Screen */}
              <div className="mt-6 text-slate-500 text-xs flex items-center gap-1.5 select-none font-mono">
                <Unlock className="w-3.5 h-3.5" />
                <span>Lock screen active. Shortcuts and hotkeys disabled natively.</span>
              </div>
            </div>
          )}

          {/* REAL-TIME POPUP MESSAGE DIALOG OVERLAY */}
          <AnimatePresence>
            {popups[activePc.number] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-x-6 top-1/4 bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl z-40 flex flex-col gap-4 text-left glow-indigo"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/25">
                    <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">Cashier Message</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-bold font-sans uppercase tracking-wider">Terminal alert broadcasted by admin.</p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap font-medium">
                  {popups[activePc.number]}
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => clearPopup(activePc.number)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition"
                  >
                    Close Message
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

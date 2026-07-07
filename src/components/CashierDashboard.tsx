import React, { useState } from 'react';
import { Computer, Player } from '../types';
import { Monitor, Shield, Power, Clock, Plus, Pause, Play, Square, MessageSquare, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CashierDashboardProps {
  computers: Computer[];
  onRemoteCommand: (command: string, pcNum: number, payload?: any) => void;
  players: Player[];
}

export function CashierDashboard({ computers, onRemoteCommand, players }: CashierDashboardProps) {
  const [selectedPc, setSelectedPc] = useState<Computer | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const formatTime = (secs: number) => {
    if (secs <= 0) return '--:--:--';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      remainingSecs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleAddTimeClick = (pc: Computer) => {
    setSelectedPc(pc);
    setShowTimeModal(true);
  };

  const handleSendMessageClick = (pc: Computer) => {
    setSelectedPc(pc);
    setShowMessageModal(true);
  };

  const handleApplyTime = (minutes: number) => {
    if (selectedPc) {
      onRemoteCommand('add_time', selectedPc.number, { minutes });
      setShowTimeModal(false);
      setCustomMinutes('');
    }
  };

  const handleSendMessage = () => {
    if (selectedPc && customMessage.trim()) {
      onRemoteCommand('send_popup', selectedPc.number, { message: customMessage.trim() });
      setShowMessageModal(false);
      setCustomMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Computers', value: computers.filter(c => c.status === 'In Use').length, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Available PCs', value: computers.filter(c => c.status === 'Available').length, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Locked PCs', value: computers.filter(c => c.status === 'Locked').length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Offline PCs', value: computers.filter(c => c.status === 'Offline' || Date.now() - c.lastHeartbeat > 15000).length, color: 'text-slate-400 bg-white/5 border-white/5' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <p className="text-2xl font-black text-white mt-1 font-sans">{stat.value}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${stat.color}`}>
              {stat.value} / {computers.length}
            </div>
          </div>
        ))}
      </div>

      {/* Grid view of client PCs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {computers.map((pc) => {
          const isOffline = Date.now() - pc.lastHeartbeat > 15000;
          const pcStatus = isOffline ? 'Offline' : pc.status;

          const statusColors = {
            Available: 'border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.06)]',
            'In Use': 'border-indigo-500/20 bg-indigo-950/5 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(79,70,229,0.06)]',
            Locked: 'border-amber-500/20 bg-amber-950/5 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]',
            Offline: 'border-white/5 bg-slate-950/40 hover:border-slate-800'
          };

          const badgeColors = {
            Available: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            'In Use': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
            Locked: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            Offline: 'text-slate-500 bg-white/5 border-white/5'
          };

          return (
            <div
              key={pc.number}
              className={`border rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-300 h-[230px] shadow-lg bg-slate-900/40 backdrop-blur-md relative overflow-hidden ${
                statusColors[pcStatus]
              }`}
            >
              {/* Header: Computer Number, IP & Status Badge */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Monitor className={`w-4 h-4 ${pcStatus === 'In Use' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-white text-base tracking-tight font-sans">{pc.name}</span>
                </div>
                <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase ${badgeColors[pcStatus]}`}>
                  {pcStatus}
                </span>
              </div>

              {/* Central Information: Player & Time Details */}
              <div className="flex-1 space-y-2.5">
                {pcStatus === 'In Use' ? (
                  <>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Player:</span>
                      <span className="text-slate-200 font-bold">{pc.playerName || 'Guest'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 py-1.5 px-2.5 rounded-xl border border-white/5 font-mono">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>REMAINING:</span>
                      </span>
                      <span className="text-sm font-black text-white tracking-widest">
                        {formatTime(pc.remainingTime)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-20 text-center bg-black/20 rounded-xl border border-dashed border-white/5">
                    <AlertCircle className="w-4 h-4 text-slate-600 mb-1" />
                    <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                      {pcStatus === 'Offline' ? 'Terminal Unreachable' : 'Idle and Locked'}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Control Row */}
              <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-white/5">
                {pcStatus === 'In Use' ? (
                  <>
                    <button
                      onClick={() => handleAddTimeClick(pc)}
                      title="Add Time"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-indigo-950/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => onRemoteCommand('pause_timer', pc.number)}
                      title="Pause Session"
                      className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 p-2 rounded-xl transition hover:text-white border border-white/5"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoteCommand('stop_timer', pc.number)}
                      title="Stop Session / Lock"
                      className="bg-slate-800/60 hover:bg-rose-950/20 text-slate-300 hover:text-rose-400 hover:border-rose-900/30 border border-white/5 p-2 rounded-xl transition"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSendMessageClick(pc)}
                      title="Send Cashier Alert"
                      className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 p-2 rounded-xl transition border border-white/5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : pcStatus === 'Offline' ? (
                  <button
                    onClick={() => onRemoteCommand('restart_terminal', pc.number)}
                    className="w-full bg-slate-800/40 border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ping Terminal</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAddTimeClick(pc)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-emerald-950/20"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Session</span>
                    </button>
                    <button
                      onClick={() => onRemoteCommand('shutdown_pc', pc.number)}
                      title="Shutdown PC"
                      className="bg-slate-800/60 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 p-2 rounded-xl transition border border-white/5"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TIME ADD MODAL */}
      {showTimeModal && selectedPc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 w-full max-w-sm rounded-2xl p-5 shadow-2xl glow-indigo">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Manage Time: {selectedPc.name}</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">Select a preset or input a custom session duration.</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: '30 Minutes', value: 30 },
                { label: '1 Hour', value: 60 },
                { label: '2 Hours', value: 120 },
                { label: '3 Hours', value: 180 },
                { label: 'Overnight (8h)', value: 480 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTime(p.value)}
                  className="bg-slate-800/60 hover:bg-indigo-600 hover:text-white border border-white/5 text-slate-200 p-2.5 rounded-xl text-xs font-bold transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400">Custom Duration (Minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="60"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm flex-1 font-medium font-mono"
                />
                <button
                  onClick={() => handleApplyTime(parseInt(customMinutes) || 0)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowTimeModal(false)}
                className="text-slate-400 hover:text-white px-4 py-2 text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMessageModal && selectedPc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 w-full max-w-sm rounded-2xl p-5 shadow-2xl glow-indigo">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Send Message: {selectedPc.name}</h3>
            <p className="text-xs text-slate-400 mb-4">This popup will interrupt the screen and display immediately.</p>

            <div className="space-y-4">
              <textarea
                placeholder="Type your message here..."
                value={customMessage}
                rows={3}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-black/40 text-slate-200 border border-white/10 p-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium resize-none"
              />

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-slate-400 hover:text-white px-4 py-2 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Send Popup Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

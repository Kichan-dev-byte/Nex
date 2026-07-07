import React, { useState, useEffect } from 'react';

interface SessionState {
  pcNumber: number;
  status: 'Locked' | 'Active';
  currentUser?: string;
  userType?: 'Player' | 'Guest';
  timeRemaining: number;
  elapsedSeconds: number;
}

export default function App() {
  const [session, setSession] = useState<SessionState>({
    pcNumber: 1,
    status: 'Locked',
    timeRemaining: 0,
    elapsedSeconds: 0
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isElectron = !!(window as any).electronAPI;
    
    if (isElectron) {
      const api = (window as any).electronAPI;
      
      // Load current session from the main process
      api.getCurrentSession().then((res: SessionState) => {
        if (res) setSession(res);
      });

      // Listen to real-time session state pushes from the main daemon
      api.onSessionUpdate((newSession: SessionState) => {
        if (newSession) setSession(newSession);
      });
    } else {
      // In web preview: simulate local ticking timer when unlocked for interactive demonstration
      const interval = setInterval(() => {
        setSession(prev => {
          if (prev.status === 'Active') {
            const nextTime = Math.max(0, prev.timeRemaining - 1);
            return {
              ...prev,
              elapsedSeconds: prev.elapsedSeconds + 1,
              timeRemaining: nextTime,
              status: nextTime <= 0 ? 'Locked' : 'Active'
            };
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent, type: 'Player' | 'Guest') => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    if (type === 'Player' && (!username.trim() || !password.trim())) {
      setLoginError('Please enter both your Username and password.');
      setLoading(false);
      return;
    }

    const isElectron = !!(window as any).electronAPI;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.submitLogin({
          username: username.trim(),
          password: password.trim(),
          userType: type
        });

        if (!res.success) {
          setLoginError(res.error || 'Authentication failed.');
        } else {
          // Success is handled by state listener
          setUsername('');
          setPassword('');
        }
      } catch (err) {
        setLoginError('Failed to communicate with local client locker service.');
      } finally {
        setLoading(false);
      }
    } else {
      // Web preview simulation: unlock automatically with mock values
      setTimeout(() => {
        setSession({
          pcNumber: 1,
          status: 'Active',
          currentUser: type === 'Guest' ? 'Guest_PC1' : username.trim().toLowerCase(),
          userType: type,
          timeRemaining: type === 'Guest' ? 3600 : 7200, // 1 or 2 hours mock
          elapsedSeconds: 0
        });
        setLoading(false);
        setUsername('');
        setPassword('');
      }, 800);
    }
  };

  const handleLogout = async () => {
    const isElectron = !!(window as any).electronAPI;
    if (isElectron) {
      try {
        await (window as any).electronAPI.submitLogout();
      } catch (err) {}
    } else {
      setSession({
        pcNumber: 1,
        status: 'Locked',
        timeRemaining: 0,
        elapsedSeconds: 0
      });
    }
  };

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

  const activeMode = session.status === 'Active';

  if (activeMode) {
    // ACTIVE WORKSTATION STATE: Floating overlay widget
    return (
      <div className="min-h-screen bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl flex flex-col justify-between shadow-[0_0_25px_rgba(79,70,229,0.15)] max-w-sm mx-auto font-sans">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">SESSION RUNNING</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500">PC #{session.pcNumber}</span>
        </div>

        <div className="my-3 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Logged In As</span>
            <span className="text-sm font-bold text-white truncate block">{session.currentUser}</span>
          </div>
          <div>
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Time Remaining</span>
            <span className="text-sm font-mono font-bold text-emerald-400 block">{formatTime(session.timeRemaining)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Rate: $10.00/hr</span>
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-500 border border-rose-500/30 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-lg transition-all"
          >
            Log Out Session
          </button>
        </div>
      </div>
    );
  }

  // LOCKED STATE: Cyber futuristic locker screen
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
      {/* Dynamic particles or ambient background styling */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl z-10 relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-indigo-500/20 mb-3">
            🔒
          </div>
          <h2 className="text-lg font-black tracking-wider text-white uppercase">Workstation Terminal</h2>
          <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mt-0.5">WORKSTATION #{session.pcNumber} • SYSTEM LOCKED</p>
        </div>

        {loginError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-2.5 rounded-xl text-xs mb-4 text-center font-bold font-mono uppercase tracking-wide">
            ⚠️ {loginError}
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e, 'Player')} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Account Username</label>
            <input
              type="text"
              placeholder="e.g. cyber_player"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Account Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In and Unlock'}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
          Connecting to central server at localhost:8080
        </div>
      </div>
    </div>
  );
}

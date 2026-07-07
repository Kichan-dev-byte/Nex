import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Database from 'better-sqlite3';
import * as fs from 'fs';

// Setup directories and safe database/file store
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'computershop.db');

let db: any;
try {
  db = new Database(dbPath);
  // Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      fullName TEXT,
      phoneNumber TEXT,
      membership TEXT,
      balance REAL,
      status TEXT,
      password TEXT,
      dateCreated TEXT
    );
    CREATE TABLE IF NOT EXISTS pc_rates (
      membership TEXT PRIMARY KEY,
      ratePerHour REAL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      username TEXT,
      type TEXT,
      amount REAL,
      timestamp TEXT,
      notes TEXT
    );
  `);

  // Seed default rates if empty
  const ratesCount = db.prepare('SELECT COUNT(*) as count FROM pc_rates').get() as { count: number };
  if (ratesCount.count === 0) {
    db.prepare('INSERT INTO pc_rates (membership, ratePerHour) VALUES (?, ?)').run('VIP', 25.0);
    db.prepare('INSERT INTO pc_rates (membership, ratePerHour) VALUES (?, ?)').run('Gold', 20.0);
    db.prepare('INSERT INTO pc_rates (membership, ratePerHour) VALUES (?, ?)').run('Silver', 15.0);
    db.prepare('INSERT INTO pc_rates (membership, ratePerHour) VALUES (?, ?)').run('Regular', 10.0);
  }
} catch (err) {
  console.error("Database initialization failed, falling back to JSON mock storage:", err);
  // Simple JSON-based fallback store to guarantee high reliability
  db = {
    fallback: true,
    storePath: path.join(userDataPath, 'computershop_fallback.json'),
    data: { players: [], pc_rates: [], transactions: [] },
    init() {
      if (fs.existsSync(this.storePath)) {
        try {
          this.data = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
        } catch (_) {}
      } else {
        this.data = {
          players: [
            { id: 'P001', username: 'cyber_elite', fullName: 'Alex Rivera', phoneNumber: '+1 555-0199', membership: 'VIP', balance: 150.00, status: 'Active', password: 'password', dateCreated: new Date().toISOString() }
          ],
          pc_rates: [
            { membership: 'VIP', ratePerHour: 25.0 },
            { membership: 'Gold', ratePerHour: 20.0 },
            { membership: 'Silver', ratePerHour: 15.0 },
            { membership: 'Regular', ratePerHour: 10.0 }
          ],
          transactions: []
        };
        this.save();
      }
    },
    save() {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf8');
    }
  };
  db.init();
}

// express server & socket.io setup
const expressApp = express();
const httpServer = createServer(expressApp);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

expressApp.use(express.json());

// API endpoints for clients to query or register
expressApp.get('/api/status', (req, res) => {
  res.json({ status: 'Server Online', timestamp: new Date().toISOString() });
});

// Real-time tracking of active computer sessions
interface PcSession {
  pcNumber: number;
  socketId?: string;
  status: 'Locked' | 'Active';
  currentUser?: string;
  userType?: 'Player' | 'Guest';
  timeRemaining: number; // in seconds
  elapsedSeconds: number;
  ratePerHour: number;
}

const activeSessions: { [pcNum: number]: PcSession } = {};
for (let i = 1; i <= 12; i++) {
  activeSessions[i] = {
    pcNumber: i,
    status: 'Locked',
    timeRemaining: 0,
    elapsedSeconds: 0,
    ratePerHour: 10.0
  };
}

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`Client PC connected: ${socket.id}`);

  socket.on('client:register', (data: { pcNumber: number }) => {
    const s = activeSessions[data.pcNumber];
    if (s) {
      s.socketId = socket.id;
      socket.emit('server:registered', { status: 'Registered', session: s });
      io.emit('server:sessions_update', activeSessions);
    }
  });

  socket.on('client:heartbeat', (data: { pcNumber: number; elapsedSeconds: number }) => {
    const s = activeSessions[data.pcNumber];
    if (s && s.status === 'Active') {
      s.elapsedSeconds = data.elapsedSeconds;
      if (s.timeRemaining > 0) {
        s.timeRemaining = Math.max(0, s.timeRemaining - 1);
        if (s.timeRemaining <= 0) {
          s.status = 'Locked';
          s.currentUser = undefined;
          s.userType = undefined;
          socket.emit('server:lock_pc', { reason: 'Time expired.' });
        }
      }
      io.emit('server:sessions_update', activeSessions);
    }
  });

  socket.on('client:request_login', (data: { pcNumber: number; username: string; password?: string; userType: 'Player' | 'Guest' }) => {
    const s = activeSessions[data.pcNumber];
    if (!s) {
      socket.emit('client:login_response', { success: false, error: 'PC not found.' });
      return;
    }

    if (data.userType === 'Guest') {
      socket.emit('client:login_response', { success: false, error: 'Guest login is disabled. Member account required.' });
      return;
    }

    // Player login check
    let player: any;
    if (db.fallback) {
      player = db.data.players.find((p: any) => p.username.toLowerCase() === data.username.toLowerCase());
    } else {
      player = db.prepare('SELECT * FROM players WHERE username = ?').get(data.username);
    }

    if (!player) {
      socket.emit('client:login_response', { success: false, error: 'Player account not found.' });
      return;
    }

    const inputPassword = data.password || 'password';
    const expectedPassword = player.password || 'password';
    if (inputPassword !== expectedPassword) {
      socket.emit('client:login_response', { success: false, error: 'Incorrect password.' });
      return;
    }

    // Get membership rate
    let rate = 10.0;
    if (db.fallback) {
      const r = db.data.pc_rates.find((item: any) => item.membership === player.membership);
      if (r) rate = r.ratePerHour;
    } else {
      const r = db.prepare('SELECT ratePerHour FROM pc_rates WHERE membership = ?').get(player.membership);
      if (r) rate = r.ratePerHour;
    }

    if (player.balance < rate) {
      socket.emit('client:login_response', { success: false, error: 'Insufficient balance. Minimum top-up required.' });
      return;
    }

    s.status = 'Active';
    s.currentUser = player.username;
    s.userType = 'Player';
    s.timeRemaining = Math.floor((player.balance / rate) * 3600);
    s.elapsedSeconds = 0;
    s.ratePerHour = rate;

    socket.emit('client:login_response', { success: true, session: s });
    io.emit('server:sessions_update', activeSessions);
  });

  socket.on('client:request_logout', (data: { pcNumber: number }) => {
    const s = activeSessions[data.pcNumber];
    if (s) {
      s.status = 'Locked';
      s.currentUser = undefined;
      s.userType = undefined;
      s.timeRemaining = 0;
      s.elapsedSeconds = 0;
      socket.emit('server:lock_pc', { reason: 'Logged out.' });
      io.emit('server:sessions_update', activeSessions);
    }
  });

  socket.on('disconnect', () => {
    // Find matching PC and clear socket id
    for (const key in activeSessions) {
      if (activeSessions[key].socketId === socket.id) {
        activeSessions[key].socketId = undefined;
        io.emit('server:sessions_update', activeSessions);
        break;
      }
    }
  });
});

// IPC communication between Admin UI renderer and main process
ipcMain.handle('get-players', () => {
  if (db.fallback) return db.data.players;
  return db.prepare('SELECT * FROM players').all();
});

ipcMain.handle('add-player', (_, player: any) => {
  if (db.fallback) {
    db.data.players.push(player);
    db.save();
    return { success: true };
  }
  db.prepare(`
    INSERT INTO players (id, username, fullName, phoneNumber, membership, balance, status, password, dateCreated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    player.id, player.username, player.fullName, player.phoneNumber,
    player.membership, player.balance, player.status, player.password || 'password', player.dateCreated
  );
  return { success: true };
});

ipcMain.handle('topup-player', (_, data: { username: string; amount: number; txId: string; notes: string }) => {
  const timestamp = new Date().toISOString();
  if (db.fallback) {
    const player = db.data.players.find((p: any) => p.username === data.username);
    if (player) {
      player.balance += data.amount;
      db.data.transactions.push({
        id: data.txId,
        username: data.username,
        type: 'Top Up',
        amount: data.amount,
        timestamp,
        notes: data.notes
      });
      db.save();
      return { success: true, balance: player.balance };
    }
    return { success: false, error: 'Player not found.' };
  }

  const player = db.prepare('SELECT balance FROM players WHERE username = ?').get(data.username);
  if (!player) return { success: false, error: 'Player not found.' };

  const newBalance = player.balance + data.amount;
  db.prepare('UPDATE players SET balance = ? WHERE username = ?').run(newBalance, data.username);
  db.prepare(`
    INSERT INTO transactions (id, username, type, amount, timestamp, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.txId, data.username, 'Top Up', data.amount, timestamp, data.notes);

  return { success: true, balance: newBalance };
});

ipcMain.handle('get-transactions', () => {
  if (db.fallback) return db.data.transactions;
  return db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC').all();
});

ipcMain.handle('get-pc-sessions', () => {
  return activeSessions;
});

ipcMain.handle('remote-lock-pc', (_, pcNumber: number) => {
  const s = activeSessions[pcNumber];
  if (s) {
    s.status = 'Locked';
    s.currentUser = undefined;
    s.userType = undefined;
    s.timeRemaining = 0;
    if (s.socketId) {
      io.to(s.socketId).emit('server:lock_pc', { reason: 'Locked remotely by administrator.' });
    }
    io.emit('server:sessions_update', activeSessions);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('remote-unlock-pc', (_, data: { pcNumber: number; username: string; userType: 'Player' | 'Guest' }) => {
  const s = activeSessions[data.pcNumber];
  if (s) {
    s.status = 'Active';
    s.currentUser = data.username;
    s.userType = 'Player';
    s.timeRemaining = 7200; // 2 hours by default for remote unlocks
    if (s.socketId) {
      io.to(s.socketId).emit('server:unlock_pc', { session: s });
    }
    io.emit('server:sessions_update', activeSessions);
    return { success: true };
  }
  return { success: false };
});

// Electron App lifecycle
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174'); // Vite dev port for server panel
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Listen on port 8080 for client LAN connections
  httpServer.listen(8080, '0.0.0.0', () => {
    console.log('LAN Computer Shop Server listening on port 8080');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

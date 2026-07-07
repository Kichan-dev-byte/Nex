import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import { io, Socket } from 'socket.io-client';

let mainWindow: BrowserWindow | null = null;
let socket: Socket | null = null;
const PC_NUMBER = 1; // Workstation identifier

interface SessionState {
  pcNumber: number;
  status: 'Locked' | 'Active';
  currentUser?: string;
  userType?: 'Player' | 'Guest';
  timeRemaining: number;
  elapsedSeconds: number;
}

let localSession: SessionState = {
  pcNumber: PC_NUMBER,
  status: 'Locked',
  timeRemaining: 0,
  elapsedSeconds: 0
};

let heartbeatInterval: NodeJS.Timeout | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    alwaysOnTop: true,
    fullscreen: true, // Workstation Kiosk Lock Mode
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Client renderer Vite port
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Connect workstation to central LAN server
function connectToServer() {
  socket = io('http://localhost:8080');

  socket.on('connect', () => {
    console.log('Connected to LAN Server control center');
    socket?.emit('client:register', { pcNumber: PC_NUMBER });
  });

  socket.on('server:registered', (data: { session: SessionState }) => {
    updateLocalSession(data.session);
  });

  socket.on('server:unlock_pc', (data: { session: SessionState }) => {
    updateLocalSession(data.session);
  });

  socket.on('server:lock_pc', (data: { reason: string }) => {
    updateLocalSession({
      pcNumber: PC_NUMBER,
      status: 'Locked',
      timeRemaining: 0,
      elapsedSeconds: 0
    });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Server');
    // Lock PC on server connection failure for protection
    updateLocalSession({
      pcNumber: PC_NUMBER,
      status: 'Locked',
      timeRemaining: 0,
      elapsedSeconds: 0
    });
  });
}

function updateLocalSession(session: SessionState) {
  localSession = session;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('session-update', localSession);
  }

  if (localSession.status === 'Active') {
    // Escape standard full-screen kiosk lock to display active overlay float bar
    if (mainWindow) {
      mainWindow.setFullScreen(false);
      mainWindow.setSize(450, 180);
      mainWindow.setPosition(20, 20); // Pin to top-left corner as a float menu
      mainWindow.setAlwaysOnTop(true);
    }

    startHeartbeat();
  } else {
    // Lock down workstation completely
    if (mainWindow) {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setFullScreen(true);
      mainWindow.setSize(width, height);
      mainWindow.setAlwaysOnTop(true);
    }
    
    stopHeartbeat();
  }
}

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    localSession.elapsedSeconds += 1;
    if (localSession.timeRemaining > 0) {
      localSession.timeRemaining = Math.max(0, localSession.timeRemaining - 1);
      if (localSession.timeRemaining <= 0) {
        updateLocalSession({
          pcNumber: PC_NUMBER,
          status: 'Locked',
          timeRemaining: 0,
          elapsedSeconds: 0
        });
      }
    }
    
    // Send heartbeat ticks to server
    socket?.emit('client:heartbeat', {
      pcNumber: PC_NUMBER,
      elapsedSeconds: localSession.elapsedSeconds
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('session-update', localSession);
    }
  }, 1000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// IPC bindings
ipcMain.handle('get-current-session', () => {
  return localSession;
});

ipcMain.handle('submit-login', async (_, data: { username: string; password?: string; userType: 'Player' | 'Guest' }) => {
  if (!socket || !socket.connected) {
    return { success: false, error: 'Central Server Offline. Please contact LAN operator.' };
  }

  return new Promise((resolve) => {
    socket?.emit('client:request_login', {
      pcNumber: PC_NUMBER,
      username: data.username,
      password: data.password,
      userType: data.userType
    });

    socket?.once('client:login_response', (res: { success: boolean; error?: string; session?: SessionState }) => {
      if (res.success && res.session) {
        updateLocalSession(res.session);
        resolve({ success: true });
      } else {
        resolve({ success: false, error: res.error || 'Login rejected.' });
      }
    });
  });
});

ipcMain.handle('submit-logout', () => {
  if (socket && socket.connected) {
    socket.emit('client:request_logout', { pcNumber: PC_NUMBER });
  }
  updateLocalSession({
    pcNumber: PC_NUMBER,
    status: 'Locked',
    timeRemaining: 0,
    elapsedSeconds: 0
  });
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();
  connectToServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

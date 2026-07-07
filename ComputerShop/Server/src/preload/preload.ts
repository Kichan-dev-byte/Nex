import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlayers: () => ipcRenderer.invoke('get-players'),
  addPlayer: (player: any) => ipcRenderer.invoke('add-player', player),
  topupPlayer: (data: { username: string; amount: number; txId: string; notes: string }) => ipcRenderer.invoke('topup-player', data),
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  getPcSessions: () => ipcRenderer.invoke('get-pc-sessions'),
  remoteLockPc: (pcNumber: number) => ipcRenderer.invoke('remote-lock-pc', pcNumber),
  remoteUnlockPc: (data: { pcNumber: number; username: string; userType: 'Player' | 'Guest' }) => ipcRenderer.invoke('remote-unlock-pc', data)
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentSession: () => ipcRenderer.invoke('get-current-session'),
  submitLogin: (data: { username: string; password?: string; userType: 'Player' | 'Guest' }) => ipcRenderer.invoke('submit-login', data),
  submitLogout: () => ipcRenderer.invoke('submit-logout'),
  onSessionUpdate: (callback: (session: any) => void) => {
    ipcRenderer.on('session-update', (_, session) => callback(session));
  }
});

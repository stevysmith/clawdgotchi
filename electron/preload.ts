import { contextBridge, ipcRenderer } from 'electron'

export interface Session {
  id: string
  cwd: string
  repoName: string
  accessoryId: number
  startTime: number
  lastActivity: number
  status: 'active' | 'idle' | 'ending'
  stats: {
    energy: number
    health: number
    happiness: number
    discipline: number
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  getHealth: () => ipcRenderer.invoke('get-health'),
  updateTrayIcon: (mood: 'happy' | 'okay' | 'sad' | 'sick') =>
    ipcRenderer.invoke('update-tray-icon', mood),
  getSessions: () => ipcRenderer.invoke('get-sessions') as Promise<Session[]>,
  onSessionsUpdate: (callback: (sessions: Session[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessions: Session[]) => callback(sessions)
    ipcRenderer.on('sessions-updated', handler)
    // Return cleanup function
    return () => ipcRenderer.removeListener('sessions-updated', handler)
  },
})

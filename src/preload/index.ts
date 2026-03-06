import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants/channels'

const api = {
  // ── Terminal ──
  terminal: {
    create: (cwd: string): Promise<string> =>
      ipcRenderer.invoke(IPC.TERMINAL_CREATE, cwd),
    write: (id: string, data: string): void =>
      ipcRenderer.send(IPC.TERMINAL_DATA, id, data),
    resize: (id: string, cols: number, rows: number): void =>
      ipcRenderer.send(IPC.TERMINAL_RESIZE, id, cols, rows),
    dispose: (id: string): void =>
      ipcRenderer.send(IPC.TERMINAL_DISPOSE, id),
    onData: (callback: (id: string, data: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, id: string, data: string): void =>
        callback(id, data)
      ipcRenderer.on(IPC.TERMINAL_ON_DATA, handler)
      return () => ipcRenderer.removeListener(IPC.TERMINAL_ON_DATA, handler)
    },
    onExit: (callback: (id: string, exitCode: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, id: string, exitCode: number): void =>
        callback(id, exitCode)
      ipcRenderer.on(IPC.TERMINAL_ON_EXIT, handler)
      return () => ipcRenderer.removeListener(IPC.TERMINAL_ON_EXIT, handler)
    }
  },

  // ── Project ──
  project: {
    open: (path: string) => ipcRenderer.invoke(IPC.PROJECT_OPEN, path),
    readDir: (path: string) => ipcRenderer.invoke(IPC.PROJECT_READ_DIR, path)
  },

  // ── File System ──
  fs: {
    readFile: (path: string): Promise<string> =>
      ipcRenderer.invoke(IPC.FS_READ_FILE, path),
    writeFile: (path: string, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_WRITE_FILE, path, content)
  },

  // ── Claude ──
  claude: {
    checkInstalled: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC.CLAUDE_CHECK_INSTALLED),
    getVersion: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC.CLAUDE_GET_VERSION)
  },

  // ── App ──
  app: {
    getPath: (name: string): Promise<string> =>
      ipcRenderer.invoke(IPC.APP_GET_PATH, name),
    openDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC.DIALOG_OPEN_DIRECTORY)
  }
}

contextBridge.exposeInMainWorld('forgeApi', api)

export type ForgeApi = typeof api

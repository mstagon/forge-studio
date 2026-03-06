import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants/channels'

const api = {
  terminal: {
    create: (cwd: string): Promise<string> => ipcRenderer.invoke(IPC.TERMINAL_CREATE, cwd),
    write: (id: string, data: string): void => ipcRenderer.send(IPC.TERMINAL_DATA, id, data),
    resize: (id: string, cols: number, rows: number): void => ipcRenderer.send(IPC.TERMINAL_RESIZE, id, cols, rows),
    dispose: (id: string): void => ipcRenderer.send(IPC.TERMINAL_DISPOSE, id),
    onData: (callback: (id: string, data: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, id: string, data: string): void => callback(id, data)
      ipcRenderer.on(IPC.TERMINAL_ON_DATA, handler)
      return () => ipcRenderer.removeListener(IPC.TERMINAL_ON_DATA, handler)
    },
    onExit: (callback: (id: string, exitCode: number) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, id: string, exitCode: number): void => callback(id, exitCode)
      ipcRenderer.on(IPC.TERMINAL_ON_EXIT, handler)
      return () => ipcRenderer.removeListener(IPC.TERMINAL_ON_EXIT, handler)
    }
  },

  project: {
    open: (path: string) => ipcRenderer.invoke(IPC.PROJECT_OPEN, path),
    readDir: (path: string) => ipcRenderer.invoke(IPC.PROJECT_READ_DIR, path),
    startWatching: (path: string) => ipcRenderer.invoke(IPC.FS_START_WATCHING, path),
    onFileChanged: (callback: (event: { type: string; path: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, event: { type: string; path: string }): void => callback(event)
      ipcRenderer.on(IPC.FS_FILE_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC.FS_FILE_CHANGED, handler)
    }
  },

  fs: {
    readFile: (path: string): Promise<string> => ipcRenderer.invoke(IPC.FS_READ_FILE, path),
    writeFile: (path: string, content: string): Promise<void> => ipcRenderer.invoke(IPC.FS_WRITE_FILE, path, content)
  },

  claudeMd: {
    read: (projectPath: string) => ipcRenderer.invoke(IPC.CLAUDE_MD_READ, projectPath),
    write: (projectPath: string, config: unknown) => ipcRenderer.invoke(IPC.CLAUDE_MD_WRITE, projectPath, config)
  },

  agents: {
    list: (projectPath: string) => ipcRenderer.invoke(IPC.AGENTS_LIST, projectPath),
    save: (projectPath: string, agent: unknown) => ipcRenderer.invoke(IPC.AGENTS_SAVE, projectPath, agent),
    delete: (projectPath: string, fileName: string) => ipcRenderer.invoke(IPC.AGENTS_DELETE, projectPath, fileName),
    rename: (projectPath: string, oldName: string, newName: string) => ipcRenderer.invoke(IPC.AGENTS_RENAME, projectPath, oldName, newName)
  },

  commands: {
    list: (projectPath: string) => ipcRenderer.invoke(IPC.COMMANDS_LIST, projectPath),
    save: (projectPath: string, command: unknown) => ipcRenderer.invoke(IPC.COMMANDS_SAVE, projectPath, command),
    delete: (projectPath: string, fileName: string) => ipcRenderer.invoke(IPC.COMMANDS_DELETE, projectPath, fileName)
  },

  skills: {
    list: (projectPath: string) => ipcRenderer.invoke(IPC.SKILLS_LIST, projectPath),
    save: (projectPath: string, skill: unknown) => ipcRenderer.invoke(IPC.SKILLS_SAVE, projectPath, skill),
    delete: (projectPath: string, dirName: string) => ipcRenderer.invoke(IPC.SKILLS_DELETE, projectPath, dirName)
  },

  settings: {
    read: (projectPath: string) => ipcRenderer.invoke(IPC.SETTINGS_READ, projectPath),
    write: (projectPath: string, settings: unknown) => ipcRenderer.invoke(IPC.SETTINGS_WRITE, projectPath, settings)
  },

  mcp: {
    list: () => ipcRenderer.invoke(IPC.MCP_LIST)
  },

  claude: {
    checkInstalled: (): Promise<boolean> => ipcRenderer.invoke(IPC.CLAUDE_CHECK_INSTALLED),
    getVersion: (): Promise<string | null> => ipcRenderer.invoke(IPC.CLAUDE_GET_VERSION)
  },

  app: {
    getPath: (name: string): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_PATH, name),
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke(IPC.DIALOG_OPEN_DIRECTORY)
  }
}

contextBridge.exposeInMainWorld('forgeApi', api)

export type ForgeApi = typeof api

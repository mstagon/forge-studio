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
      return (): void => { ipcRenderer.removeListener(IPC.TERMINAL_ON_DATA, handler) }
    },
    onExit: (callback: (id: string, exitCode: number) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, id: string, exitCode: number): void => callback(id, exitCode)
      ipcRenderer.on(IPC.TERMINAL_ON_EXIT, handler)
      return (): void => { ipcRenderer.removeListener(IPC.TERMINAL_ON_EXIT, handler) }
    }
  },

  project: {
    open: (path: string) => ipcRenderer.invoke(IPC.PROJECT_OPEN, path),
    readDir: (path: string) => ipcRenderer.invoke(IPC.PROJECT_READ_DIR, path),
    startWatching: (path: string) => ipcRenderer.invoke(IPC.FS_START_WATCHING, path),
    onFileChanged: (callback: (event: { type: string; path: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, event: { type: string; path: string }): void => callback(event)
      ipcRenderer.on(IPC.FS_FILE_CHANGED, handler)
      return (): void => { ipcRenderer.removeListener(IPC.FS_FILE_CHANGED, handler) }
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
    list: () => ipcRenderer.invoke(IPC.MCP_LIST),
    add: (name: string, command: string, args: string[], env?: Record<string, string>) => ipcRenderer.invoke(IPC.MCP_ADD, name, command, args, env),
    remove: (name: string) => ipcRenderer.invoke(IPC.MCP_REMOVE, name)
  },

  presets: {
    list: () => ipcRenderer.invoke(IPC.PRESETS_LIST),
    apply: (projectPath: string, presetId: string): Promise<boolean> => ipcRenderer.invoke(IPC.PRESETS_APPLY, projectPath, presetId),
    export: (projectPath: string, meta: { name: string; description: string; icon: string; category: string }) => ipcRenderer.invoke(IPC.PRESETS_EXPORT, projectPath, meta),
    import: (presetJson: string): Promise<boolean> => ipcRenderer.invoke(IPC.PRESETS_IMPORT, presetJson)
  },

  workflow: {
    start: (projectPath: string, steps: unknown[]) => ipcRenderer.invoke(IPC.WORKFLOW_START, projectPath, steps),
    approve: (projectPath: string) => ipcRenderer.invoke(IPC.WORKFLOW_APPROVE, projectPath),
    skip: (projectPath: string) => ipcRenderer.invoke(IPC.WORKFLOW_SKIP, projectPath),
    stop: () => ipcRenderer.invoke(IPC.WORKFLOW_STOP),
    getState: () => ipcRenderer.invoke(IPC.WORKFLOW_GET_STATE),
    onState: (callback: (state: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, state: unknown): void => callback(state)
      ipcRenderer.on(IPC.WORKFLOW_STATE, handler)
      return (): void => { ipcRenderer.removeListener(IPC.WORKFLOW_STATE, handler) }
    },
    onOutput: (callback: (workflowId: string, stepId: string, data: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, wfId: string, stepId: string, data: string): void => callback(wfId, stepId, data)
      ipcRenderer.on(IPC.WORKFLOW_OUTPUT, handler)
      return (): void => { ipcRenderer.removeListener(IPC.WORKFLOW_OUTPUT, handler) }
    }
  },

  knowledge: {
    add: (entry: { projectPath: string; category: string; title: string; content: string; tags: string[] }) => ipcRenderer.invoke(IPC.KNOWLEDGE_ADD, entry),
    search: (query: { projectPath?: string; category?: string; search?: string; limit?: number; offset?: number }) => ipcRenderer.invoke(IPC.KNOWLEDGE_SEARCH, query),
    delete: (id: number) => ipcRenderer.invoke(IPC.KNOWLEDGE_DELETE, id),
    update: (id: number, updates: { title?: string; content?: string; tags?: string[]; category?: string }) => ipcRenderer.invoke(IPC.KNOWLEDGE_UPDATE, id, updates),
    importLessons: (projectPath: string, content: string) => ipcRenderer.invoke(IPC.KNOWLEDGE_IMPORT_LESSONS, projectPath, content),
    getEscalation: (projectPath: string) => ipcRenderer.invoke(IPC.KNOWLEDGE_GET_ESCALATION, projectPath),
    applyEscalation: (projectPath: string, entries: unknown[]) => ipcRenderer.invoke(IPC.KNOWLEDGE_APPLY_ESCALATION, projectPath, entries)
  },

  team: {
    start: (projectPath: string, featureName: string) => ipcRenderer.invoke(IPC.TEAM_START, projectPath, featureName),
    stop: () => ipcRenderer.invoke(IPC.TEAM_STOP),
    getState: () => ipcRenderer.invoke(IPC.TEAM_GET_STATE),
    onState: (callback: (state: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, state: unknown): void => callback(state)
      ipcRenderer.on(IPC.TEAM_STATE, handler)
      return (): void => { ipcRenderer.removeListener(IPC.TEAM_STATE, handler) }
    },
    onOutput: (callback: (teamId: string, role: string, data: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, tId: string, role: string, data: string): void => callback(tId, role, data)
      ipcRenderer.on(IPC.TEAM_OUTPUT, handler)
      return (): void => { ipcRenderer.removeListener(IPC.TEAM_OUTPUT, handler) }
    }
  },

  git: {
    log: (projectPath: string, count?: number) => ipcRenderer.invoke(IPC.GIT_LOG, projectPath, count),
    diffStat: (projectPath: string): Promise<string> => ipcRenderer.invoke(IPC.GIT_DIFF_STAT, projectPath)
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

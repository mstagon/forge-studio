import { create } from 'zustand'
import type { ForgeProject, ProjectStats } from '../../../shared/types/project.types'

type View = 'welcome' | 'dashboard' | 'workflow' | 'agents' | 'planning' | 'claude-md' | 'commands' | 'skills' | 'hooks' | 'mcp' | 'knowledge' | 'timeline'

type Theme = 'dark' | 'light'

interface RecentProject {
  name: string
  path: string
  openedAt: string
}

interface AppState {
  // Current view
  currentView: View
  setView: (view: View) => void
  dirtyView: boolean
  setDirtyView: (dirty: boolean) => void
  pendingView: View | null
  setPendingView: (view: View | null) => void

  // Project
  project: ForgeProject | null
  projectStats: ProjectStats | null
  setProject: (project: ForgeProject, stats: ProjectStats) => void
  refreshStats: () => Promise<void>
  clearProject: () => void

  // Terminal
  terminalVisible: boolean
  terminalHeight: number
  terminalPtyId: string | null
  toggleTerminal: () => void
  setTerminalHeight: (height: number) => void
  setTerminalPtyId: (id: string | null) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Claude CLI
  claudeInstalled: boolean
  claudeVersion: string | null
  setClaudeInfo: (installed: boolean, version: string | null) => void

  // Theme
  theme: Theme
  toggleTheme: () => void

  // Command Palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Recent Projects
  recentProjects: RecentProject[]
  setRecentProjects: (projects: RecentProject[]) => void
  addRecentProject: (name: string, path: string) => void
}

const RECENT_PROJECTS_KEY = 'forge-studio-recent-projects'
const THEME_KEY = 'forge-studio-theme'

function loadRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentProjects(projects: RecentProject[]): void {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects))
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'welcome',
  setView: (view) => {
    const state = get()
    if (state.dirtyView) {
      set({ pendingView: view })
      return
    }
    set({ currentView: view })
  },
  dirtyView: false,
  setDirtyView: (dirty) => set({ dirtyView: dirty }),
  pendingView: null,
  setPendingView: (view) => set({ pendingView: view }),

  project: null,
  projectStats: null,
  setProject: (project, projectStats) => {
    get().addRecentProject(project.name, project.path)
    set({ project, projectStats, currentView: 'dashboard' })
  },
  refreshStats: async () => {
    const project = get().project
    if (!project) return
    const { stats } = await window.forgeApi.project.open(project.path)
    set({ projectStats: stats })
  },
  clearProject: () => set({ project: null, projectStats: null, currentView: 'welcome' }),

  terminalVisible: true,
  terminalHeight: 250,
  terminalPtyId: null,
  toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
  setTerminalHeight: (height) => set({ terminalHeight: Math.max(120, Math.min(600, height)) }),
  setTerminalPtyId: (id) => set({ terminalPtyId: id }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  claudeInstalled: false,
  claudeVersion: null,
  setClaudeInfo: (installed, version) => set({ claudeInstalled: installed, claudeVersion: version }),

  theme: loadTheme(),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    return { theme: next }
  }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  recentProjects: loadRecentProjects(),
  setRecentProjects: (projects) => {
    saveRecentProjects(projects)
    set({ recentProjects: projects })
  },
  addRecentProject: (name, path) => {
    const prev = get().recentProjects.filter((p) => p.path !== path)
    const updated = [{ name, path, openedAt: new Date().toISOString() }, ...prev].slice(0, 10)
    saveRecentProjects(updated)
    set({ recentProjects: updated })
  }
}))

import { create } from 'zustand'
import type { ForgeProject, ProjectStats } from '../../../shared/types/project.types'

type View = 'welcome' | 'dashboard' | 'workflow' | 'agents' | 'planning' | 'claude-md' | 'commands' | 'skills' | 'hooks' | 'mcp' | 'knowledge'

interface AppState {
  // Current view
  currentView: View
  setView: (view: View) => void

  // Project
  project: ForgeProject | null
  projectStats: ProjectStats | null
  setProject: (project: ForgeProject, stats: ProjectStats) => void
  clearProject: () => void

  // Terminal
  terminalVisible: boolean
  terminalHeight: number
  toggleTerminal: () => void
  setTerminalHeight: (height: number) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Claude CLI
  claudeInstalled: boolean
  claudeVersion: string | null
  setClaudeInfo: (installed: boolean, version: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'welcome',
  setView: (view) => set({ currentView: view }),

  project: null,
  projectStats: null,
  setProject: (project, projectStats) => set({ project, projectStats, currentView: 'dashboard' }),
  clearProject: () => set({ project: null, projectStats: null, currentView: 'welcome' }),

  terminalVisible: true,
  terminalHeight: 250,
  toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
  setTerminalHeight: (height) => set({ terminalHeight: Math.max(120, Math.min(600, height)) }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  claudeInstalled: false,
  claudeVersion: null,
  setClaudeInfo: (installed, version) => set({ claudeInstalled: installed, claudeVersion: version })
}))

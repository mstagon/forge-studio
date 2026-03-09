import { useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from './stores/app.store'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { TerminalPanel } from './components/terminal/TerminalPanel'
import { RunBar } from './components/terminal/RunBar'
import { CommandPalette } from './components/CommandPalette'
import { ToastContainer } from './components/common/ToastContainer'
import { ConfirmDialog } from './components/common/ConfirmDialog'
import { WelcomeView } from './routes/WelcomeView'
import { DashboardView } from './routes/DashboardView'
import { AgentsView } from './routes/AgentsView'
import { CommandsView } from './routes/CommandsView'
import { SkillsView } from './routes/SkillsView'
import { ClaudeMdView } from './routes/ClaudeMdView'
import { HooksView } from './routes/HooksView'
import { McpView } from './routes/McpView'
import { WorkflowView } from './routes/WorkflowView'
import { PlanningView } from './routes/PlanningView'
import { KnowledgeView } from './routes/KnowledgeView'
import { TimelineView } from './routes/TimelineView'

function MainContent(): React.ReactElement {
  const currentView = useAppStore((s) => s.currentView)

  switch (currentView) {
    case 'welcome':
      return <WelcomeView />
    case 'dashboard':
      return <DashboardView />
    case 'agents':
      return <AgentsView />
    case 'commands':
      return <CommandsView />
    case 'skills':
      return <SkillsView />
    case 'claude-md':
      return <ClaudeMdView />
    case 'hooks':
      return <HooksView />
    case 'mcp':
      return <McpView />
    case 'workflow':
      return <WorkflowView />
    case 'planning':
      return <PlanningView />
    case 'knowledge':
      return <KnowledgeView />
    case 'timeline':
      return <TimelineView />
    default:
      return <WelcomeView />
  }
}

function DirtyNavGuard(): React.ReactElement | null {
  const { pendingView, setPendingView, setDirtyView } = useAppStore()
  const { t } = useTranslation()
  if (!pendingView) return null
  return (
    <ConfirmDialog
      title={t('dialog.unsavedTitle')}
      message={t('dialog.unsavedMessage')}
      confirmLabel={t('common.leave')}
      cancelLabel={t('common.stay')}
      variant="warning"
      onConfirm={() => {
        setDirtyView(false)
        const view = pendingView
        setPendingView(null)
        useAppStore.setState({ currentView: view })
      }}
      onCancel={() => setPendingView(null)}
    />
  )
}

export default function App(): React.ReactElement {
  const { project, terminalVisible, terminalHeight, setTerminalHeight, setClaudeInfo, setView, theme, clearProject } = useAppStore()
  const { t } = useTranslation()
  const resizingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Check Claude CLI on mount
  useEffect(() => {
    ;(async () => {
      const installed = await window.forgeApi.claude.checkInstalled()
      const version = installed ? await window.forgeApi.claude.getVersion() : null
      setClaudeInfo(installed, version)
    })()
  }, [setClaudeInfo])

  // Start file watcher when project opens
  useEffect(() => {
    if (project) {
      window.forgeApi.project.startWatching(project.path)
    }
  }, [project?.path])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (!e.metaKey && !e.ctrlKey) return

      // Cmd+K: Command Palette (always available)
      if (e.key === 'k') {
        e.preventDefault()
        const store = useAppStore.getState()
        store.setCommandPaletteOpen(!store.commandPaletteOpen)
        return
      }

      if (!project) return

      const viewMap: Record<string, Parameters<typeof setView>[0]> = {
        '1': 'dashboard',
        '2': 'workflow',
        '3': 'agents',
        '4': 'planning',
        '5': 'claude-md',
        '6': 'commands',
        '7': 'skills',
        '8': 'hooks',
        '9': 'mcp',
        '0': 'knowledge'
      }

      if (viewMap[e.key]) {
        e.preventDefault()
        setView(viewMap[e.key])
      }

      if (e.key === '`') {
        e.preventDefault()
        useAppStore.getState().toggleTerminal()
      }

      if (e.key === 'b') {
        e.preventDefault()
        useAppStore.getState().toggleSidebar()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [project, setView])

  // Terminal resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    resizingRef.current = true
    startYRef.current = e.clientY
    startHeightRef.current = useAppStore.getState().terminalHeight
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (ev: MouseEvent): void => {
      if (!resizingRef.current) return
      const delta = startYRef.current - ev.clientY
      setTerminalHeight(startHeightRef.current + delta)
    }

    const handleUp = (): void => {
      resizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [setTerminalHeight])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg text-text-primary">
      {/* Titlebar drag region (macOS traffic lights sit here) */}
      <div className="h-[38px] drag-region bg-surface border-b border-border shrink-0 flex items-center">
        {/* Spacer for macOS traffic light buttons (~78px) */}
        <div className="w-[78px] shrink-0" />
        <span className="text-xs font-medium text-text-secondary truncate">
          {project ? project.name : 'Forge Studio'}
        </span>
        {project && (
          <button
            onClick={() => clearProject()}
            className="no-drag ml-2 p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            title={t('common.closeProject')}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>

          {project && terminalVisible && (
            <div
              onMouseDown={handleResizeStart}
              className="h-[3px] bg-border hover:bg-accent cursor-row-resize transition-colors shrink-0"
            />
          )}

          {project && terminalVisible && (
            <div style={{ height: terminalHeight }} className="shrink-0 flex flex-col">
              <RunBar />
              <div className="flex-1 overflow-hidden">
                <TerminalPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar />
      <CommandPalette />
      <ToastContainer />
      <DirtyNavGuard />
    </div>
  )
}
